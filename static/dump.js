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
    if(!geoCoded) {
        $.each(dataTable, function( key, val ) {
            $.getJSON( "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat="+val.lat.toFixed(6)+"&lon="+val.lon.toFixed(6), function( data ) {
                var url = "<a href=\"https://www.openstreetmap.org/note/new?lat="+val.lat+"&lon="+val.lon+"#map=17/"+val.lat+"/"+val.lon+"\" target=\"_blank\">"+data["display_name"]+"</a>";
                val["url"] = url;
                stations.render();
            });
        });
        //https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=47.75140&lon=-3.36124
        geoCoded = true;
    }
}

function generate() {
    var dateStart = $('input[name="datetimes"]').data('daterangepicker').startDate.valueOf();
    var dateEnd = $('input[name="datetimes"]').data('daterangepicker').endDate.valueOf();
    var dayOfWeek = [];
    // doc['field_name'].date.dayOfWeek Day of the week (1-7), e.g. 1 for Monday.

    if($('input[id="weekday-mon"]')[0].checked) {
        dayOfWeek.push(1);
    }
    if($('input[id="weekday-tue"]')[0].checked) {
        dayOfWeek.push(2);
    }
    if($('input[id="weekday-wed"]')[0].checked) {
        dayOfWeek.push(3);
    }
    if($('input[id="weekday-thu"]')[0].checked) {
        dayOfWeek.push(4);
    }
    if($('input[id="weekday-fri"]')[0].checked) {
        dayOfWeek.push(5);
    }
    if($('input[id="weekday-sat"]')[0].checked) {
        dayOfWeek.push(6);
    }
    if($('input[id="weekday-sun"]')[0].checked) {
        dayOfWeek.push(7);
    }

    var startHour = $('input[name="startHour"]')[0].value;
    var endHour = $('input[name="endHour"]')[0].value;

    var doLeq = $('input[id="data_leq"]')[0].checked;
    var doLaeq = $('input[id="data_laeq"]')[0].checked;
    var doSpectrum = $('input[id="data_spectrum"]')[0].checked;

    var selectedSensors = [];
    $.each(dataTable, function( key, val ) {
        if(val["checked"] == "yes") {
            selectedSensors.push(val["station"]);
        }
    });

    var timeOut = $('input[name="timeout"]')[0].value;

    // generate json to post
    var jsonQuery = {
        date_start : dateStart,
        date_end : dateEnd,
        leq : doLeq,
        laeq : doLaeq,
        spectrum : doSpectrum,
        sensors : selectedSensors };

    if(dayOfWeek.length < 7) {
        jsonQuery["week_day"] = dayOfWeek;
    }
}