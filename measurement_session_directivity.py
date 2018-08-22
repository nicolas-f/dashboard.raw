import requests
from requests.auth import HTTPBasicAuth, HTTPDigestAuth
import os
import httplib
import configparser
import time
import json
import io

query = u"""{
  "size": 1,
    "query": {
    "bool": {
      "must": [
        {
          "term": {
            "producerID": "urn:osh:sensor:noisemonitoring:B8-27-EB-74-CD-A8"
          }
        },
        {
          "range": {
            "timestamp": {
            "gte": %d,
            "lte": %d,
              "format": "epoch_millis"
            }
          }
        }
      ],
      "filter": [],
      "should": [],
      "must_not": []
    }
  }
}
"""

class processing:
    def __init__(self):
        self.fields = [12500,10000,8000,6300,5000,4000,3150,2500,2000,1600,1250,1000,800,630,500,400,315,250,200,160,125,100,80,63,50,40,31,25,20];

    def query_es(self, start_time):
        if not hasattr(self, 'config'):
            self.config = configparser.ConfigParser()
            self.config.read(os.path.join('appconfig.ini'))
        post_data = query % (start_time, int(start_time) + 10e3)
    	resp = requests.post(self.config['ELASTIC_SEARCH']['URL']+'/osh_data_acoustic_fast/_search',
          verify=os.path.join('certs', 'transport-ca.pem'),
          auth= HTTPBasicAuth(self.config['ELASTIC_SEARCH']['USER'], self.config['ELASTIC_SEARCH']['PASSWORD']),
          headers = {'content-type': 'application/json'},
          data = post_data)

    	if resp.status_code != 200:
    		# This means something went wrong.
    		raise Networkerror([resp.status_code])
        return resp.text


    def export(self, start_time):
        jsonstring = self.query_es(start_time)
        content = json.load(io.StringIO(jsonstring))
        measurement = content["hits"]["hits"][0]["_source"]
        t = measurement["timestamp"]
        leq_125ms_bands = [[] for i in self.fields]
        for idt in range(80):
            for idfreq, freq in enumerate(self.fields):
                leq_125ms_bands[idfreq].append(measurement["leq_"+str(freq)])
            t+=125
        print leq_125ms_bands

class Networkerror(RuntimeError):
   def __init__(self, arg):
       self.args = arg

p = processing()

p.export(time.time() * 1e3 - 30e3)
