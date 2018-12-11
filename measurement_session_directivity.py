import requests
from requests.auth import HTTPBasicAuth, HTTPDigestAuth
import os
import datetime
import configparser
import time
import json
import io
from math import *
import sys

level_trigger = 75
# 4 s minimum length
minimum_session_time_s = 4

query = u"""
{
  "size": 0,
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
    "aggs": {
        "group": {
            "terms": {
                "field": "producerID"
            },
            "aggs": {
                "group_docs": {
                    "top_hits": {
                        "size": 1,
                        "sort": [
                            {
                                "timestamp": {
                                    "order": "desc"
                                }
                            }
                        ]
                    }
                }
            }
        }
    }
}

"""


class processing:
    def __init__(self):
        self.fields = [20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500]
        self.config = configparser.ConfigParser()
        cfg_file_path = os.path.join('appconfig.ini')
        if not os.path.exists(cfg_file_path):
            self.config["ELASTIC_SEARCH"] = {'URL': 'http://localhost:9200', 'USER': 'ESUSER', 'PASSWORD': 'ESPASSWORD'}
            self.config["SERVER"] = {'PORT': '5002'}
            with open(cfg_file_path, "w") as f:
                self.config.write(f)
            os.chmod(cfg_file_path, 600)
            sys.exit("Please edit appconfig.ini with your credentials")
        else:
            self.config.read(os.path.join('appconfig.ini'))

    def query_es(self, start_time):
        post_data = query % (start_time, int(start_time) + 9e3)
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
        record_state = 'WAITING_START'

        sys.stdout.write("t,length")
        for idf, f in enumerate(self.fields):
            sys.stdout.write(",")
            sys.stdout.write("{:g}".format(f))
        sys.stdout.write("\n")
        content = None
        while t < end_time:
            if measurement is not None:
                index_start = 0
                while True:
                    # There is 80 * 125 ms in a document (10 s)
                    if record_state == 'WAITING_START':
                        # Search level > 60 dB in this 10s range
                        try:
                            index_start = [l > level_trigger for l in measurement["leq"]].index(True, index_start)
                            epoch = ((t + index_start * 125) / 1e3 + 2 * 3600)
                            t_start = epoch
                            leq1s_stack = [[] for f in self.fields]
                        except ValueError:
                            break  # exit loop
                        record_state = 'STARTED'

                    if record_state == 'STARTED':
                        try:
                            index_end = [l < level_trigger for l in measurement["leq"]].index(True, index_start)
                        except ValueError:
                            index_end = len(measurement["leq"]) - 1
                        for idfreq, freq in enumerate(self.fields):
                            leq1s_stack[idfreq] += measurement["leq_" + str(int(freq))][index_start:index_end]
                        # end of measurement session
                        if measurement["leq"][index_end] < level_trigger:
                            time_range = len(leq1s_stack[0]) * 0.125
                            if time_range > minimum_session_time_s:
                                sys.stdout.write("%s" % datetime.datetime.utcfromtimestamp(t_start).isoformat())
                                sys.stdout.write(",")
                                sys.stdout.write("%.2f" % time_range)
                                for idfreq, freq in enumerate(self.fields):
                                    leq_range = 10 * log10(sum(
                                        map(lambda x: 10 ** (x / 10.),
                                            leq1s_stack[idfreq][1:-1])) / len(leq1s_stack[idfreq][1:-1]))
                                    sys.stdout.write(",")
                                    sys.stdout.write("%.1f" % leq_range)
                                sys.stdout.write("\n")
                            record_state = 'WAITING_START'
                            index_start = index_end
                        else:
                            break
                t += 9e3
            if t < end_time:
                if len(measurements) > 0:
                    measurement = measurements.pop(0)["_source"]
                else:
                    old_t = 0
                    if measurement is not None and content is not None:
                        old_t = content[u'aggregations'][u'group'][u'buckets'][0][u'group_docs'][u'hits'][u'hits'][0]["_source"]["timestamp"]
                    while t < end_time:
                        jsonstring = self.query_es(t)
                        content = json.load(io.StringIO(jsonstring))
                        # Copy array
                        try:
                            measurements = content[u'aggregations'][u'group'][u'buckets'][0][u'group_docs'][u'hits'][u'hits'][:]
                            downloaded_t = content[u'aggregations'][u'group'][u'buckets'][0][u'group_docs'][u'hits'][u'hits'][0]["_source"]["timestamp"]
                            if downloaded_t != old_t:
                                break
                            else:
                                t += 10e3
                        except IndexError:
                            t += 10e3
                    measurement = measurements.pop(0)["_source"]
                t = measurement["timestamp"]


class Networkerror(RuntimeError):
    def __init__(self, arg):
        self.args = arg


p = processing()

p.export(1539765633000, 1539786510000)
