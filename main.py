from flask import Flask, render_template, Response, send_from_directory, request, jsonify
from flask_restful import Resource, Api, reqparse
import requests
from requests.auth import HTTPBasicAuth
import os
import configparser
from multiprocessing import Process, Manager
import time
import json
import datetime
import gzip
import base64

app = Flask(__name__)
api = Api(app)

config = configparser.ConfigParser()
data = {}
if os.path.exists("trigger.json"):
    with open("trigger.json") as f:
        data["trigger"] = json.loads(f.read())
cfg_file_path = os.path.join(app.root_path, 'appconfig.ini')
if not os.path.exists(cfg_file_path):
    config["ELASTIC_SEARCH"] = {'URL': 'http://localhost:9200', 'USER': 'ESUSER', 'PASSWORD': 'ESPASSWORD'}
    config["SERVER"] = {'PORT': '5002', 'PROTOCOL': 'https'}
    # comma separated path of accepted public keys
    config["ADMIN"] = {'PUBKEYS': 'path1,path2'}
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

@app.route("/trigger")
def trigger():
    return render_template('trigger.html')


@app.route("/player")
def player():
    return render_template('read_trigger.html')

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
        process[p.id] = p
        p.start()
        # return process id
        return jsonify(process_id=p.id)


class QueryProcessInfo(Resource):
    def get(self, process_id):
        if process_id in process:
            p = process[process_id]
            if p.exitcode is None:
                return jsonify(process_id=p.start_time)
            else:
                return jsonify(process_id=p.start_time, file_path=p.csv_filename)
        else:
            return jsonify(error="Process not found")

class QueryTrigger(Resource):
    def get(self):
        if "trigger" in data:
            return Response(json.dumps(data["trigger"]), mimetype='application/json')
        else:
            return jsonify(error="no triggers")

class QuerySampleList(Resource):
    def get(self, start_time, end_time):
        # uncomment if no server available for dev purpose
        # with open(os.path.join(app.root_path, "fast.json"), "r") as f:
        #    return  Response(f.read(), mimetype='application/json')
        post_data = render_template('trigger_list.json', start_time=start_time, end_time=end_time)
        resp = requests.post(config['ELASTIC_SEARCH']['URL'] + '/osh_data_acoustic_samples/_search',
                             # verify=os.path.join(app.root_path, 'certs', 'transport-ca.pem'),
                             auth=HTTPBasicAuth(config['ELASTIC_SEARCH']['USER'],
                                                config['ELASTIC_SEARCH']['PASSWORD']),
                             headers={'content-type': 'application/json'},
                             data=post_data)

        if resp.status_code != 200:
            # This means something went wrong.
            raise Networkerror([resp.status_code])
        return Response(resp.content, mimetype='application/json')


class QuerySample(Resource):
    def get(self, sample_id):
        # uncomment if no server available for dev purpose
        # with open(os.path.join(app.root_path, "fast.json"), "r") as f:
        #    return  Response(f.read(), mimetype='application/json')
        post_data = render_template('fetch_samples.json', sample_id=base64.b64decode(sample_id).decode("utf-8"))
        resp = requests.post(config['ELASTIC_SEARCH']['URL'] + '/osh_data_acoustic_samples/_search',
                             # verify=os.path.join(app.root_path, 'certs', 'transport-ca.pem'),
                             auth=HTTPBasicAuth(config['ELASTIC_SEARCH']['USER'],
                                                config['ELASTIC_SEARCH']['PASSWORD']),
                             headers={'content-type': 'application/json'},
                             data=post_data)

        if resp.status_code != 200:
            # This means something went wrong.
            raise Networkerror([resp.status_code])
        return Response(resp.content, mimetype='application/json')


class Generate(Process):
    """
        Create CSV of sensors
    """

    def __init__(self, conf, group=None, target=None, name=None, args=(), kwargs={}):
        super().__init__(group, target, name, args, kwargs)
        self.conf = conf
        self.start_time = time.time()
        self.id = int(self.start_time * 1000)
        self.csv_filename = "generated" + os.sep + time.strftime("%Y_%m_%d_%Hh%Mm%Ss", time.localtime()) + ".csv.gz"

    def run(self):
        epoch_end = self.conf["date_end"]
        do_leq = self.conf["leq"]
        do_spectrum = self.conf["spectrum"]
        do_laeq = self.conf["laeq"]
        timeout = 600000
        if "timeout" in self.conf:
            timeout = [int(a)*3600+int(b)*60+int(c) for a, b, c in [self.conf["timeout"].split(":")]][0]
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

                if do_filter_start or do_filter_end or "week_day" in self.conf:
                    source = ""
                    params = {}
                    if do_filter_start:
                        start_hour, start_minute = map(int, self.conf["start_hour"].split(":"))
                        source += "doc['timestamp'].value.hour >= params.minh"
                        params["minh"] = start_hour
                        if start_minute > 0:
                            source += " && doc['timestamp'].value.minute >= params.minm"
                            params["minm"] = start_minute
                    if "week_day" in self.conf:
                        if len(source) > 0:
                            source += " && "
                        source += "params.week_day.contains(doc['timestamp'].value.getDayOfWeekEnum().getValue())"
                        params["week_day"] = self.conf["week_day"]
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
                result = json.loads(resp.content.decode('utf-8'))

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
                    if (time.time() - self.start_time) > timeout:
                        raise(TimeoutError())
                    result = json.loads(resp.content.decode('utf-8'))
                    hits = result["hits"]["hits"]


class PostTriggerData(Resource):
    def post(self):
        json_data = request.get_json(force=True)
        # Check public key
        # config["ADMIN"] = {'PUBKEYS'
        if "ADMIN" in config and 'PUBKEYS' in config["ADMIN"]:
            for fpath in config["ADMIN"]['PUBKEYS'].split(","):
                if os.path.exists(fpath):
                    # Read local public key
                    local_public_key = open(fpath).read()
                    if json_data["file"] == local_public_key:
                        data["trigger"] = json_data
                        with open("trigger.json", "w") as f:
                            f.write(json.dumps(json_data, indent=4))
                        return jsonify(result='success')
        # return process id
        return jsonify(result='Provided public key is not authorized')


api.add_resource(QuerySensorList, '/sensors')

api.add_resource(QueryFullFast, '/fast/<int:start_time>')  # Route_3

api.add_resource(QueryGenerateData, '/generate')

api.add_resource(QueryProcessInfo, '/process/<int:process_id>')

api.add_resource(PostTriggerData, '/set-trigger')

api.add_resource(QueryTrigger, '/get-trigger')

api.add_resource(QuerySampleList, '/list-samples/<int:start_time>/<int:end_time>')

api.add_resource(QuerySample, '/get-samples/<string:sample_id>')


class Networkerror(RuntimeError):
    def __init__(self, arg):
        self.args = arg


if __name__ == '__main__':
    try:
        from waitress import serve

        serve(app, port=config['SERVER']['PORT'])
    except ImportError:
        if config['SERVER']['PROTOCOL'] == 'https':
            app.run(port=config['SERVER']['PORT'], ssl_context=('certs/cert.pem', 'certs/key.pem'))
        else:
            app.run(port=config['SERVER']['PORT'])
