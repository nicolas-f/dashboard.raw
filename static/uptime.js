var margin = {
        top: 50,
        right: 0,
        bottom: 100,
        left: 80
    },
    cellSize = 25,
    cellVMargin = 2,
    cellHMargin = 2,
    headerMargin = 2,
    leftColumnMargin = 4,
    width = (cellSize + cellHMargin) * 31 + margin.left + margin.right,
    height = headerMargin + (cellSize + cellHMargin) * 4 + margin.top + margin.bottom;
function loadDateTime() {
     $('input[name="datetimes"]').daterangepicker({
          "singleDatePicker": false,
          "showISOWeekNumbers": true,
          "maxSpan": {
               "month": 1
          },
          "timePicker": false,
          "autoApply": true,
          ranges: {
              'This Month': [moment().startOf('month'), moment().endOf('month')],
              'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
          },
          "locale": {
              "format": "MM/DD/YYYY",
              "separator": " - ",
              "applyLabel": "Apply",
              "cancelLabel": "Cancel",
              "fromLabel": "From",
              "toLabel": "To",
              "customRangeLabel": "Custom",
              "weekLabel": "W",
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
          "startDate": moment().startOf('month'),
          "endDate": moment().endOf('month')
      }, function(start, end, label) {
        uptimeChart("urn:osh:sensor:noisemonitoring:B8-27-EB-A8-79-B3", moment.utc(start.toString()).utc().valueOf(), moment.utc(end.toString()).utc().valueOf());
      });
}

const svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var downloadedData = {};

function loadSensor(jsonContent) {
    svg.selectAll(".hour").remove();
    if (typeof jsonContent.aggregations == 'undefined') {
        throw "Wrong Json conent " + jsonContent;
    }

    var recordCount = jsonContent.aggregations.daily.buckets.length;
    var sensorData = jsonContent.aggregations.daily.buckets;
    var data = [];
    var days = [];
    var t, freqIndex;
    var column = -1;
    for (t = 0; t < recordCount; t++) {
        var field_date = jsonContent.aggregations.daily.buckets[t]["key_as_string"]; //"2020-04-01 00"
        [stat_all, stat_year, stat_month, stat_day, stat_hour] = field_date.match('([0-9]+)-([0-9]+)-([0-9]+) ([0-9]+)');
        var field_epoch = jsonContent.aggregations.daily.buckets[t]["key"];
        var field_num_records = jsonContent.aggregations.daily.buckets[t]["doc_count"];
        if (days.length == 0 || days[days.length - 1] != stat_day + "-" + stat_month) {
            days.push(stat_day + "-" + stat_month);
            column += 1;
        }
        data.push({
            column: column,
            row: parseInt(stat_hour, 10) / 6,
            date: field_date,
            value: parseInt(field_num_records, 10)
        });
    }


    var colorScale = function(d) {
        if (d <= 0) {
            return "#000000";
        } else if (d < 2052) {
            return "#CC0000";
        } else if (d < 2159) {
            return "#CCCC00";
        } else {
            return "#009900";
        }
    };

    var cards = svg.selectAll(".hour")
        .data(data, function(d) {
            return d.day + ':' + d.hour;
        });

    cards.append("title");

    var rect = cards.enter().append("rect");

    rect.attr("x", function(d) {
            return leftColumnMargin + d.column * (cellSize + cellVMargin);
        })
        .attr("y", function(d) {
            return headerMargin + d.row * (cellSize + cellHMargin);
        })
        .attr("class", "hour")
        .attr("width", 0)
        .attr("height", 0)
        .style("fill", function(d) {
            return colorScale(d.value);
        })

    rect.transition()
    .duration(function(d, i) {
            return i/4 * 20;
        })
    .attr("width", cellSize)
    .attr("height", cellSize);

    rect.append("title").text(function(d) {
        return d.date + "h: " + d.value * 10 + " seconds (" + (d.value / 2160.0 * 100.0).toFixed(1) + " %)";
    });

    svg.selectAll(".dayLabel").remove();

    var dayLabels = svg.selectAll(".dayLabel")
        .data(days)
        .enter().append("text")
        .text(function(d) {
            return d;
        })
        .attr("x", function(d, i) {
            return cellSize / 2 + leftColumnMargin + i * (cellSize + cellHMargin);
        })
        .attr("y", 0)
        .style("text-anchor", "end")
        .style("writing-mode", "vertical-lr")
        .attr("class", "dayLabel mono axis axis-workweek");


    svg.selectAll(".timeLabel").remove();
    var timeLabels = svg.selectAll(".timeLabel")
        .data(['', '0h-6h', '6h-12h', '12h-18h', '18h-24h'])
        .enter().append("text")
        .text(function(d) {
            return d;
        })
        .attr("y", function(d, i) {
            return i * (cellSize + cellVMargin) + headerMargin - cellSize / 2;
        })
        .attr("x", 0)
        .style("text-anchor", "end")
        .attr("class", "dayLabel mono axis axis-workweek");
}

var uptimeChart = function(sensorId, startTime, endTime) {
    svg.selectAll(".hour").remove();
    d3.json("/get-uptime/"+sensorId+"/"+startTime+"/"+endTime).then(function(jsonContent) {
        downloadedData = jsonContent;
        loadSensor(jsonContent);
    });
};

uptimeChart("urn:osh:sensor:noisemonitoring:B8-27-EB-A8-79-B3",moment().utc().startOf('month'),moment().utc().endOf('month'));
loadDateTime();