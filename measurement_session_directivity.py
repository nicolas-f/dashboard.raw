import requests
from requests.auth import HTTPBasicAuth, HTTPDigestAuth
import os
import httplib
import configparser
import time
import json
import io
from math import *
import sys

query = u"""{
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
  },
  "sort": [
        {
            "timestamp": {
                "order": "asc"
            }
        }
    ]
}
"""


class processing:
    def __init__(self):
        self.fields = [12500, 10000, 8000, 6300, 5000, 4000, 3150, 2500, 2000, 1600, 1250, 1000, 800, 630, 500, 400,
                       315, 250, 200, 160, 125, 100, 80, 63, 50, 40, 31, 25, 20];
        self.config = configparser.ConfigParser()
        self.config.read(os.path.join('appconfig.ini'))

    def query_es(self, start_time):
        post_data = query % (start_time, int(start_time) + 10e3)
        resp = requests.post(self.config['ELASTIC_SEARCH']['URL'] + '/osh_data_acoustic_fast/_search',
                             verify=os.path.join('certs', 'transport-ca.pem'),
                             auth=HTTPBasicAuth(self.config['ELASTIC_SEARCH']['USER'],
                                                self.config['ELASTIC_SEARCH']['PASSWORD']),
                             headers={'content-type': 'application/json'},
                             data=post_data)

        if resp.status_code != 200:
            # This means something went wrong.
            raise Networkerror([resp.status_code])
        return resp.text

    def export(self, start_time, end_time):
        measurements = []
        measurement = None
        t = start_time
        while t < end_time:
            if measurement is not None:
                # There is 80 * 125 ms in a document (10 s)
                # But we merge 8*125 ms to make 1 s
                for idt in range(10):
                    sys.stdout.write("%d" % t)
                    for idfreq, freq in enumerate(self.fields):
                        leq1s = 10 * log10(sum(
                            map(lambda x: 10 ** (x / 10.), measurement["leq_" + str(freq)][idt * 8:idt * 8 + 8])) / 8)
                        # leq_1s_bands[idfreq].append(leq1s)
                        sys.stdout.write(",%.1f" % leq1s)
                    sys.stdout.write("\n")
                    t += 1e3
            if t < end_time:
                if len(measurements) > 0:
                    measurement = measurements.pop(0)["_source"]
                else:
                    jsonstring = self.query_es(t)
                    content = json.load(io.StringIO(jsonstring))
                    measurements = content["hits"]["hits"]
                    if len(measurements) == 0:
                        break
                    measurement = measurements.pop(0)["_source"]
                t = measurement["timestamp"]


class Networkerror(RuntimeError):
    def __init__(self, arg):
        self.args = arg


p = processing()

p.export(time.time() * 1e3 - 50e3, time.time() * 1e3 - 20e3)
