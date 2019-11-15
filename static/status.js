
function getStations(lmap) {
    $.getJSON( "static/network.json", function( data ) {
      var minLat = 90;
      var maxLat = -90;
      var minLong = 180;
      var maxLong = -180;
      $.each( data, function( key, val ) {
        var lat = val.lat;
        var lon = val.long;
        minLat = Math.min(minLat, lat);
        minLong = Math.min(minLong, lon);
        maxLat = Math.max(maxLat, lat);
        maxLong = Math.max(maxLong, lon);
      });
      // Set extent to sensors
      if(minLat < maxLat && minLong < maxLong) {
        lmap.fitBounds([ [minLat, minLong], [maxLat, maxLong] ]);
      }
    });
  }


function getStationsRecordCount(lmap) {
    var start_time = moment().subtract(14, 'minutes').valueOf();
    var end_time = moment().subtract(2, 'minutes').valueOf();
    $.getJSON( "sensors-record-count/" + start_time + "/" + end_time, function( data ) {
      $.each( data.aggregations.group.buckets, function( key, val ) {
            // Set sensor status
      });

    });
  }
