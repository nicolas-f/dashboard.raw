from flask import Flask, render_template, Response, send_from_directory, request, jsonify
from flask_restful import Resource, Api, reqparse
import requests
from requests.auth import HTTPBasicAuth
import os
import configparser
from multiprocessing import Process, Value
import time
import json
import datetime
import gzip

app = Flask(__name__)
api = Api(app)

config = configparser.ConfigParser()
cfg_file_path = os.path.join(app.root_path, 'appconfig.ini')
if not os.path.exists(cfg_file_path):
    config["ELASTIC_SEARCH"] = {'URL': 'http://localhost:9200', 'USER': 'ESUSER', 'PASSWORD': 'ESPASSWORD'}
    config["SERVER"] = {'PORT': '5002'}
    config.write(cfg_file_path)
    os.chmod(cfg_file_path, 600)
else:
    config.read(cfg_file_path)

parser = reqparse.RequestParser()


# a route where we will display a welcome message via an HTML template
@app.route("/")
def index():
    return render_template('index.html')


@app.route("/dump")
def dump():
    return render_template('dump.html')


# Custom static data
@app.route('/generated/<path:filename>')
def custom_static(filename):
    return send_from_directory("generated", filename)


class QueryFullFast(Resource):
    def get(self, start_time):
        # uncomment if no server available for dev purpose
        # with open(os.path.join(app.root_path, "fast.json"), "r") as f:
        #    return  Response(f.read(), mimetype='application/json')
        post_data = render_template('query.json', start_time=start_time, end_time=int(start_time) + 10e3)
        resp = requests.post(config['ELASTIC_SEARCH']['URL'] + '/osh_data_acoustic_fast/_search',
                             # verify=os.path.join(app.root_path, 'certs', 'transport-ca.pem'),
                             auth=HTTPBasicAuth(config['ELASTIC_SEARCH']['USER'],
                                                config['ELASTIC_SEARCH']['PASSWORD']),
                             headers={'content-type': 'application/json'},
                             data=post_data)

        if resp.status_code != 200:
            # This means something went wrong.
            raise Networkerror([resp.status_code])
        return Response(resp.content, mimetype='application/json')


process = {}
process_id_count = 0


class QuerySensorList(Resource):
    def get(self):
        post_data = render_template('query_sensor_list.json')
        resp = requests.post(config['ELASTIC_SEARCH']['URL'] + '/osh_data_sensorlocation/_search',
                             # verify=os.path.join(app.root_path, 'certs', 'transport-ca.pem'),
                             auth=HTTPBasicAuth(config['ELASTIC_SEARCH']['USER'],
                                                config['ELASTIC_SEARCH']['PASSWORD']),
                             headers={'content-type': 'application/json'},
                             data=post_data)

        if resp.status_code != 200:
            # This means something went wrong.
            raise Networkerror([resp.status_code])
        return Response(resp.content, mimetype='application/json')


class QueryGenerateData(Resource):
    def post(self):
        json_data = request.get_json(force=True)
        p = Generate(json_data)
        p.generate_data()
        # return process id
        return jsonify(process_id=1)


class Generate:
    """
        Create CSV of sensors
    """

    def __init__(self, conf):
        self.conf = conf
        self.csv_filename = "generated" + os.sep + time.strftime("%Y_%m_%d_%Hh%Mm%Ss", time.localtime()) + ".csv.gz"

    def generate_data(self):
        start = time.time()
        epoch_end = self.conf["date_end"]
        do_leq = self.conf["leq"]
        do_spectrum = self.conf["spectrum"]
        do_laeq = self.conf["laeq"]
        do_filter_start = "start_hour" in self.conf
        do_filter_end = "end_hour" in self.conf
        with gzip.open(self.csv_filename, "wt") as csv_f:
            header_written = False
            for sensor in self.conf["sensors"]:
                # generate elastic search query
                query = {"size": 100,
                         "_source": [
                             "timestamp"
                         ],
                         "sort": [
                             {
                                 "timestamp": {
                                     "order": "asc"
                                 }
                             }
                         ],
                         "query": {
                             "bool": {
                                 "must": [
                                     {
                                         "term": {
                                             "producerID": {
                                                 "value": sensor
                                             }
                                         }
                                     },
                                     {
                                         "range": {
                                             "timestamp": {
                                                 "gte": self.conf["date_start"],
                                                 "lte": self.conf["date_end"],
                                                 "format": "epoch_millis"
                                             }
                                         }
                                     }
                                 ]
                             }
                         }
                         }

                if do_spectrum:
                    query["_source"].append("leq*")
                elif do_leq:
                    query["_source"].append("leq")

                if do_laeq:
                    query["_source"].append("laeq")

                if do_filter_start or do_filter_end:
                    source = ""
                    params = {}
                    if do_filter_start:
                        start_hour, start_minute = map(int, self.conf["start_hour"].split(":"))
                        source += "doc['timestamp'].value.hour >= params.minh"
                        params["minh"] = start_hour
                        if start_minute > 0:
                            source += " && doc['timestamp'].value.minute >= params.minm"
                            params["minm"] = start_minute
                    if do_filter_end:
                        if len(source) > 0:
                            source += " && "
                        end_hour, end_minute = map(int, self.conf["end_hour"].split(":"))
                        if end_minute > 0:
                            source += "doc['timestamp'].value.hour <= params.maxh  && doc['timestamp'].value.minute < params.maxm"
                            params["maxm"] = end_minute
                        else:
                            source += "doc['timestamp'].value.hour < params.maxh"
                        params["maxh"] = end_hour
                    query["query"]["bool"]["must"].append({
                        "script": {
                            "script": {
                                "source": source,
                                "params": params
                            }
                        }
                    })
                resp = requests.post(config['ELASTIC_SEARCH']['URL'] + '/osh_data_acoustic_fast/_search?scroll=1m',
                                     # verify=os.path.join(app.root_path, 'certs', 'transport-ca.pem'),
                                     auth=HTTPBasicAuth(config['ELASTIC_SEARCH']['USER'],
                                                        config['ELASTIC_SEARCH']['PASSWORD']),
                                     headers={'content-type': 'application/json'},
                                     data=json.dumps(query))

                if resp.status_code != 200:
                    # This means something went wrong.
                    raise Networkerror([resp.status_code])
                result = json.loads(resp.content)

                # iterate with scroll api
                scroll_id = result["_scroll_id"]
                hits = result["hits"]["hits"]
                # add header
                if len(hits) > 0:
                    if not header_written:
                        csv_f.write("sensor,epoch,date")
                        if do_laeq:
                            csv_f.write(",laeq")
                        if do_leq:
                            csv_f.write(",leq")
                        source = hits[0]["_source"]
                        frequencies = [int(f.split("_")[1]) for f in source.keys() if f.startswith("leq_")]
                        frequencies.sort()
                        for freq in frequencies:
                            csv_f.write(",%d" % freq)
                        csv_f.write("\n")
                        header_written = True
                while len(hits) > 0:
                    for hit in hits:
                        source = hit["_source"]
                        columns = []
                        if do_laeq:
                            columns.append(source["laeq"])
                        if do_leq:
                            columns.append(source["leq"])
                        if do_spectrum:
                            frequencies = [int(f.split("_")[1]) for f in source.keys() if f.startswith("leq_")]
                            frequencies.sort()
                            for freq in frequencies:
                                columns.append(source["leq_%d" % freq])
                        epoch = source["timestamp"]
                        for row in zip(*columns):
                            if epoch < epoch_end:
                                csv_f.write("%s,%d,%s" % (sensor, epoch, datetime.datetime.utcfromtimestamp(epoch / 1000.0).
                                                          strftime("%Y-%m-%dT%H:%M:%S.%fZ")))
                                for col in row:
                                    csv_f.write(",%.2f" % col)
                                csv_f.write("\n")
                            else:
                                break
                            epoch += 125
                    # fetch another batch
                    post_data = render_template('scroll.json', scroll_id=scroll_id)
                    resp = requests.post(config['ELASTIC_SEARCH']['URL'] + '/_search/scroll',
                             # verify=os.path.join(app.root_path, 'certs', 'transport-ca.pem'),
                             auth=HTTPBasicAuth(config['ELASTIC_SEARCH']['USER'],
                                                config['ELASTIC_SEARCH']['PASSWORD']),
                             headers={'content-type': 'application/json'},
                             data=post_data)
                    if resp.status_code != 200:
                        # This means something went wrong.
                        raise Networkerror([resp.status_code])
                    result = json.loads(resp.content)
                    hits = result["hits"]["hits"]


api.add_resource(QuerySensorList, '/sensors')

api.add_resource(QueryFullFast, '/fast/<int:start_time>')  # Route_3

api.add_resource(QueryGenerateData, '/generate')


class Networkerror(RuntimeError):
    def __init__(self, arg):
        self.args = arg


if __name__ == '__main__':
    try:
        from waitress import serve

        serve(app, port=config['SERVER']['PORT'])
    except ImportError:
        app.run(port=config['SERVER']['PORT'])
