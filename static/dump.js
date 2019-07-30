function loadDateTime() {
      $('input[name="datetimes"]').daterangepicker({
          "showISOWeekNumbers": true,
          "timePicker": true,
          "timePicker24Hour": true,
          "timePickerSeconds": true,
          "autoApply": true,
          ranges: {
              'Today': [moment().startOf('day'), moment()],
              'Yesterday': [moment().subtract(1, 'days').startOf('day'), moment().subtract(1, 'days').endOf('day')],
              'Last 7 Days': [moment().subtract(6, 'days'), moment()],
              'Last 30 Days': [moment().subtract(29, 'days'), moment()],
              'This Month': [moment().startOf('month'), moment().endOf('month')],
              'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
          },
          "locale": {
              "format": "MM/DD/YYYY HH:mm:ss",
              "separator": " - ",
              "applyLabel": "Apply",
              "cancelLabel": "Cancel",
              "fromLabel": "From",
              "toLabel": "To",
              "customRangeLabel": "Custom",
              "weekLabel": "W",
              "daysOfWeek": [
                  "Su",
                  "Mo",
                  "Tu",
                  "We",
                  "Th",
                  "Fr",
                  "Sa"
              ],
              "monthNames": [
                  "January",
                  "February",
                  "March",
                  "April",
                  "May",
                  "June",
                  "July",
                  "August",
                  "September",
                  "October",
                  "November",
                  "December"
              ],
              "firstDay": 1
          },
          "startDate": moment().startOf('hour'),
          "endDate": moment()
      }, function(start, end, label) {
        //selectValue = d3.select('select').property('value')
        //heatmapChart(start.valueOf(), selectValue);
      });

  }

function getStations(dataTable, table) {
    dataTable.length = 0;
    $.getJSON( "sensors", function( data ) {
      $.each( data.aggregations.group.buckets, function( key, val ) {
        var lat = val.group_docs.hits.hits[0]._source.location.lat.toFixed(5);
        var lon = val.group_docs.hits.hits[0]._source.location.lon.toFixed(5);
        var url = "<a href=\"https://www.openstreetmap.org/note/new?lat="+lat+"&lon="+lon+"#map=17/"+lat+"/"+lon+"\" target=\"_blank\">"+lat+","+lon+"</a>";
        dataTable.push({station: val["key"], url: url, checked : 'yes', lat:val.group_docs.hits.hits[0]._source.location.lat, lon:val.group_docs.hits.hits[0]._source.location.lon});
      }
      );
      table.render();
    });
  }



function selectAll() {
    $.each(dataTable, function( key, val ) {
        val["checked"] = "yes";
    });
    stations.render();
}

function selectNone() {
    $.each(dataTable, function( key, val ) {
        val["checked"] = "no";
    });
    stations.render();
}

function geoCoding() {

}

