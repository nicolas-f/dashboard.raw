from flask import Flask, request, render_template, Response
from flask_restful import Resource, Api
import requests
from requests.auth import HTTPBasicAuth, HTTPDigestAuth
import os
import httplib
import configparser

app = Flask(__name__)
api = Api(app)

# a route where we will display a welcome message via an HTML template
@app.route("/")
def hello():
    return render_template('index.html')

class QueryFullFast(Resource):
    def get(self, start_time):
        if not hasattr(self, 'config'):
            self.config = configparser.ConfigParser()
            self.config.read(os.path.join(app.root_path, 'appconfig.ini'))
        post_data = render_template('query.json', start_time = start_time, end_time = int(start_time) + 10e3)
    	resp = requests.post(self.config['ELASTIC_SEARCH']['URL']+'/osh_data_acoustic_fast/_search',
          verify=os.path.join(app.root_path, 'certs', 'transport-ca.pem'),
          auth= HTTPBasicAuth(self.config['ELASTIC_SEARCH']['USER'], self.config['ELASTIC_SEARCH']['PASSWORD']),
          headers = {'content-type': 'application/json'},
          data = post_data)

    	if resp.status_code != 200:
    		# This means something went wrong.
    		raise Networkerror([resp.status_code])
        return Response(resp.content, mimetype='application/json')

api.add_resource(QueryFullFast, '/fast/<int:start_time>') # Route_3

class Networkerror(RuntimeError):
   def __init__(self, arg):
       self.args = arg

if __name__ == '__main__':
     app.run(port='5002')
