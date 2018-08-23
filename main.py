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
    config.write(cfg_file_path)
    os.chmod(cfg_file_path, 0600)
else:
    config.read(cfg_file_path)


# a route where we will display a welcome message via an HTML template
@app.route("/")
def hello():
    return render_template('index.html')


class QueryFullFast(Resource):
    def get(self, start_time):
        post_data = render_template('query.json', start_time=start_time, end_time=int(start_time) + 10e3)
        resp = requests.post(config['ELASTIC_SEARCH']['URL'] + '/osh_data_acoustic_fast/_search',
                             verify=os.path.join(app.root_path, 'certs', 'transport-ca.pem'),
                             auth=HTTPBasicAuth(config['ELASTIC_SEARCH']['USER'],
                                                config['ELASTIC_SEARCH']['PASSWORD']),
                             headers={'content-type': 'application/json'},
                             data=post_data)

        if resp.status_code != 200:
            # This means something went wrong.
            raise Networkerror([resp.status_code])
        return Response(resp.content, mimetype='application/json')


api.add_resource(QueryFullFast, '/fast/<int:start_time>')  # Route_3


class Networkerror(RuntimeError):
    def __init__(self, arg):
        self.args = arg


if __name__ == '__main__':
    try:
        from waitress import serve
        serve(app)
    except ImportError:
        app.run(port='5002')
