
function getStations(lmap, sensorsLayer) {
    $.getJSON( "static/network.json", function( data ) {
      var minLat = 90;
      var maxLat = -90;
      var minLong = 180;
      var maxLong = -180;
      $.each( data, function( key, val ) {
        var lat = val.lat;
        var lon = val.long;
        var style = {data: val, title:"id: "+val.esid+"\nlocal ip: 192.168.1."+val.box_id_sensor+"\n4g id: "+val["4g_router_id"], icon: L.divIcon({
            className: 'sensorOk',
            iconSize: [5, 5]
        })};
        sensorsLayer.addLayer(L.marker([lat, lon], style));
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
                icon.options.className = 'sensorMissing';
            } else if(sensors.get(val.options.data.esid) != expected_records) {
                icon.options.className = 'sensorFault';
            } else {
                icon.options.className = 'sensorOk';
            }
            val.setIcon(icon);
      });
    });
  }
