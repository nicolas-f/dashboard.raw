from flask import Flask, render_template, Response
from flask_restful import Resource, Api
import requests
from requests.auth import HTTPBasicAuth
import os
import configparser

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


# a route where we will display a welcome message via an HTML template
@app.route("/")
def hello():
    return render_template('index.html')


class QueryFullFast(Resource):
    def get(self, sensor_id, start_time):
        # uncomment if no server available for dev purpose
        #with open(os.path.join(app.root_path, "fast.json"), "r") as f:
        #    return  Response(f.read(), mimetype='application/json')
        post_data = render_template('query_spectrum.json', start_time=start_time, end_time=int(start_time) + 10e3, sensor_id= sensor_id)
        resp = requests.post(config['ELASTIC_SEARCH']['URL'] + '/osh_data_acoustic_fast/_search',
                             #verify=os.path.join(app.root_path, 'certs', 'transport-ca.pem'),
                             auth=HTTPBasicAuth(config['ELASTIC_SEARCH']['USER'],
                                                config['ELASTIC_SEARCH']['PASSWORD']),
                             headers={'content-type': 'application/json'},
                             data=post_data)

        if resp.status_code != 200:
            # This means something went wrong.
            raise Networkerror([resp.status_code])
        return Response(resp.content, mimetype='application/json')

class QuerySensorList(Resource):
    def get(self):
        # uncomment if no server available for dev purpose
        #with open(os.path.join(app.root_path, "fast.json"), "r") as f:
        #    return  Response(f.read(), mimetype='application/json')
        post_data = render_template('query_sensor_list.json')
        resp = requests.post(config['ELASTIC_SEARCH']['URL'] + '/osh_data_sensorlocation/_search',
                             #verify=os.path.join(app.root_path, 'certs', 'transport-ca.pem'),
                             auth=HTTPBasicAuth(config['ELASTIC_SEARCH']['USER'],
                                                config['ELASTIC_SEARCH']['PASSWORD']),
                             headers={'content-type': 'application/json'},
                             data=post_data)

        if resp.status_code != 200:
            # This means something went wrong.
            raise Networkerror([resp.status_code])
        return Response(resp.content, mimetype='application/json')


api.add_resource(QuerySensorList, '/sensors')  # Route_3
api.add_resource(QueryFullFast, '/fast/<string:sensor_id>/<int:start_time>')  # Route_3


class Networkerror(RuntimeError):
    def __init__(self, arg):
        self.args = arg


if __name__ == '__main__':
    try:
        from waitress import serve
        serve(app, port=config['SERVER']['PORT'])
    except ImportError:
        app.run(port=config['SERVER']['PORT'])
