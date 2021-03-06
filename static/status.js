
function onMarkerClick(e) {
    selectedSensor = e.target.options.data["esid"];
    // Fetch the last sensor record
    $.getJSON( "/get-last-record/" + selectedSensor, function( data ) {
       if ( $("#uptimectrl").length == 0 ) {
        upTimeControl.addTo(lmap);
        loadDateTime();
        buildUpTime();
       }
       var pickerCtrl = $('input[name="datetimes"]').data('daterangepicker');
       var start = pickerCtrl.startDate.clone();
       var end = pickerCtrl.endDate.clone();
       start = start.add(start.utcOffset(), 'm').valueOf();
       end = end.add(end.utcOffset(), 'm').valueOf();
       var sensorEpoch = data["hits"]["hits"][0]["_source"]["timestamp"];
       // Always display the last month of selected sensor data
       start = moment(sensorEpoch).utc().startOf('month').valueOf();
       end = moment(sensorEpoch).utc().endOf('month').valueOf();
       pickerCtrl.setStartDate(moment(start));
       pickerCtrl.setEndDate(moment(end));
       uptimeChart(selectedSensor, start, end);
   });
}

function getStations(lmap, sensorsLayer) {
    $.getJSON( "static/network.json", function( data ) {
      var minLat = 90;
      var maxLat = -90;
      var minLong = 180;
      var maxLong = -180;
      $.each( data, function( key, val ) {
        var lat = val.lat;
        var lon = val.long;
        var style = {data: val, title:"id: "+val.esid+"\nlocal ip: 192.168.1."+val.box_id_sensor+"\n4g id: "+val["4g_router_id"], icon: greyIcon};
        var marker = L.marker([lat, lon], style);
        marker.on('click', onMarkerClick);
        sensorsLayer.addLayer(marker);
        minLat = Math.min(minLat, lat);
        minLong = Math.min(minLong, lon);
        maxLat = Math.max(maxLat, lat);
        maxLong = Math.max(maxLong, lon);
      });
      // Set extent to sensors
      if(minLat < maxLat && minLong < maxLong) {
        lmap.fitBounds([ [minLat, minLong], [maxLat, maxLong] ]);
      }
      // Update sensors status from database
      getStationsRecordCount(lmap, sensorsLayer);
    });
  }

function getRouters(lmap, routersLayer) {
    var params = {cache: false, url: "generated/routers.json",dataType: "json", success: function( data ) {
      $.each( data, function( key, val ) {
        var lat = val.lat;
        var lon = val.long;
        var cabinetIcon = redCabinetIcon;
        var title = "id: "+val.id+"\n4g id: "+val["4g_router_id"]+"\nmac: "+val["mac"];
        if("online" in val) {
            title+= "\nonline: "+new Date(val.online * 1000).toISOString()
            if(moment().subtract(25, 'hours').valueOf() / 1000 < val.online) {
                cabinetIcon = greenCabinetIcon;
            }
        }
        if("clients" in val) {
            title+="\nclients: \n"+val["clients"].join("\n");
        }
        var style = {data: val, title:title, icon: cabinetIcon};
        routersLayer.addLayer(L.marker([lat, lon], style));
      });
    }};
    $.ajax(params);
  }

function getStationsRecordCount(lmap, sensorsLayer) {
    var start_time = moment().subtract(14, 'minutes').valueOf();
    var end_time = moment().subtract(2, 'minutes').valueOf();
    var expected_records = Math.trunc((end_time - start_time) / 1000 / 10);
    var sensors = new Map();
    $.getJSON( "sensors-record-count/" + start_time + "/" + end_time, function( data ) {
      $.each( data.aggregations.group.buckets, function( key, val ) {
            // Set sensor status
            sensors.set(val.key, val.doc_count);
      });
     // Loop over leaflet markers
     sensorsLayer.eachLayer(function(val) {
            var icon = val.options.icon;
            if(!sensors.has(val.options.data.esid)) {
                val.setIcon(redIcon);
            } else if(sensors.get(val.options.data.esid) < expected_records - 1) {
                val.setIcon(yellowIcon);
            } else {
                val.setIcon(greenIcon);
            }
      });
    });
  }


var lmap = L.map('mapid').setView([47.7456, -3.3687], 16);

var sensors = L.layerGroup();
var routers = L.layerGroup();


var osm = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
  maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attribution">CARTO</a>'});

osm.addTo(lmap);

sensors.addTo(lmap);
routers.addTo(lmap);

getStations(lmap, sensors);
getRouters(lmap, routers);

var legend = L.control({position: 'bottomright'});

legend.onAdd = function (lmap) {
    var div = L.DomUtil.create('div', 'info legend'),
    labels = ['Online', 'Missing values', 'Offline'],
    icons = [greenIcon, yellowIcon, redIcon];


    // loop through our density intervals and generate a label with a colored square for each interval
    div.innerHTML += "2 minutes delayed status map<br/>";
    for (var i = 0; i < icons.length; i++) {
        div.innerHTML += '<i ><img style="max-height:100%;" src="'+icons[i].options.iconUrl+'"/></i>'+labels[i];
        if(i < icons.length - 1) {
            div.innerHTML += '<br/>';
        }
    }

    return div;
};

legend.addTo(lmap);


var upTimeControl = L.control({position: 'bottomcenter', });


upTimeControl.onAdd = function (lmap) {
    var div = L.DomUtil.create('div', 'info uptime');
    div.id = "uptimectrl";
    div.innerHTML += "<div class=\"form-style-7\"> <input type=\"text\" name=\"datetimes\"/> </div> <div id=\"chart\"></div>";
    return div;
};

//
