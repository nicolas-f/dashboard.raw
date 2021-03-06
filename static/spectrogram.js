 var margin = { top: 50, right: 0, bottom: 100, left: 80 },
      fields = [12500,10000,8000,6300,5000,4000,3150,2500,2000,1600,1250,1000,800,630,500,400,315,250,200,160,125,100,80,63,50,40,31.5,25,20,'leq', 'laeq'];
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom,
      gridSize = Math.floor(width / 80),
      legendElementWidth = gridSize * 7,
      colors = ["#82A6AD","#A0BABF","#B8D6D1","#CEE4CC","#E2F2BF","#F3C683","#E87E4D","#CD463E","#A11A4D","#75085C","#430A4A"], // http://www.coloringnoise.com/theoretical_background/new-color-scheme/
      days = fields.map(f => f<= 1000 ? f+" Hz" : f > 1000 ? Math.round(f / 100.) / 10 + " kHz": f),
      datasets = [""],
      init = false,
      displayed_time = 0;

  const svg = d3.select("#chart").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var dayLabels = svg.selectAll(".dayLabel")
      .data(days)
      .enter().append("text")
        .text(function (d) { return d; })
        .attr("x", 0)
        .attr("y", function (d, i) { return i * gridSize - 8; })
        .style("text-anchor", "end")
        .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
        .attr("class", "dayLabel mono axis axis-workweek");

 const select = d3.select('#dataset-picker')
        .append('select')
          .attr('class','select')
          .on('change',changesensor)



  var downloadedData = {};
  $('input[name="datetimes"]').daterangepicker({
      "singleDatePicker": true,
      "showISOWeekNumbers": true,
      "timePicker": true,
      "timePicker24Hour": true,
      "timePickerSeconds": true,
      "autoApply": true,
      ranges: {
          'Today': [moment(), moment()],
          'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
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
      "startDate": moment().subtract(1, 'minutes'),
      "endDate": moment()
  }, function(start, end, label) {
    selectValue = d3.select('select').property('value')
    heatmapChart(start.valueOf(), selectValue);
  });

  function before() {
    const targetTime = moment(displayed_time).subtract(10, 'seconds');
    $('input[name="datetimes"]').data('daterangepicker').setStartDate(targetTime);
    selectValue = d3.select('select').property('value')
    heatmapChart(targetTime.valueOf(), selectValue);
  };
  function after() {
    const targetTime = moment(displayed_time).add(10, 'seconds');
    $('input[name="datetimes"]').data('daterangepicker').setStartDate(targetTime);
    selectValue = d3.select('select').property('value')
    heatmapChart(targetTime.valueOf(), selectValue);
  };
  function changesensor() {
      if(typeof downloadedData != 'undefined' && typeof downloadedData.took != 'undefined') {
        selectValue = d3.select('select').property('value')
        loadSensor(downloadedData, selectValue);
      }
    };

  function loadSensor(jsonContent, sensorId) {
      svg.selectAll(".hour").remove();
      if (typeof jsonContent.aggregations == 'undefined') {
        throw "Wrong Json conent " + jsonContent;
      }
      if(jsonContent.aggregations.group.buckets.length == 0) {
        return;
      }
      var sensors = jsonContent.aggregations.group.buckets.map( s => s.key)
      var sensorIndex = sensors.indexOf(sensorId)
      if(sensorIndex == -1) {
        sensorIndex = 0;
      }

      var stepCount = jsonContent.aggregations.group.buckets[sensorIndex].group_docs.hits.hits[0]._source.leq.length;
      var sensorData = jsonContent.aggregations.group.buckets[sensorIndex].group_docs.hits.hits[0]._source;
      var sensorTime = jsonContent.aggregations.group.buckets[sensorIndex].group_docs.hits.hits[0]._source.timestamp;
      var data = [];
      var t, freqIndex;
      for(t=0; t<stepCount; t++) {
        for(freqIndex=0; freqIndex < fields.length; freqIndex++) {
          freqField = Math.trunc(fields[freqIndex]);
          data.push({
            day: freqIndex,
            hour: + (t+1),
            value: + (freqIndex < fields.length - 2 ? sensorData['leq_'+freqField][t] : freqIndex == fields.length - 2 ? sensorData['leq'][t] : sensorData['laeq'][t])
          });
        }
      }

      select.selectAll('option').remove();

      var options = select
        .selectAll('option')
        .data(sensors).enter()
        .append('option')
          .property("selected", function(d){ return d === sensorId; })
          .text(function (d) { return d; });

      var colorScale = d3.scaleQuantize().domain([30,85]).range(colors);

      var cards = svg.selectAll(".hour")
          .data(data, function(d) {return d.day+':'+d.hour;});

      cards.append("title");

      var rect = cards.enter().append("rect");

      rect.attr("x", function(d) { return (d.hour - 1) * gridSize; })
          .attr("y", function(d) { return (d.day - 1) * gridSize; })
          .attr("class", "hour")
          .attr("width", gridSize)
          .attr("height", gridSize)
          .style("fill", colors[0]).transition().duration(1000).style("fill", function(d) { return colorScale(d.value); })

      rect.append("title").text(function(d) { return new Date(sensorTime + (d.hour - 1) * 125).toISOString() + " : " + d.value + " dB"; });

      svg.selectAll(".legend").remove();
      var legend = svg.selectAll(".legend")
          .data(d3.range(colors.length));

      var legendgroup = legend.enter().append("g")
          .attr("class", "legend");

      legendgroup.append("rect")
        .attr("x", function(d, i) { return legendElementWidth * i; })
        .attr("y", height)
        .attr("width", legendElementWidth)
        .attr("height", legendElementWidth / 4)
        .style("fill", function(d, i) { return colors[i]; });

      legendgroup.append("text")
        .attr("class", "mono")
        .text(function(d) { var ranges = colorScale.invertExtent(colors[d]); return d == 0 ? "< " + Math.round(ranges[1]) : d < colors.length - 1 ? Math.round(ranges[0]) + " - " + Math.round(ranges[1]) : "> " + Math.round(ranges[0])})
        .attr("x", function(d, i) { return legendElementWidth * i + 15; })
        .attr("y", height + (legendElementWidth / 4) + 15);


    svg.selectAll(".timeLabel").remove();
    var timeLabels = svg.selectAll(".timeLabel")
        .data([0,1])
        .enter().append("text")
        .text(function(d) { return new Date(sensorTime + d * 125 * 80).toISOString(); })
        .attr("x", function(d, i) { return d == 0 ? 80 : i * gridSize * 79 - 80; })
        .attr("y", -8)
        .style("text-anchor", "middle")
        .attr("transform", "translate(" + gridSize / 2 + ", -6)")
        .attr("class", function(d, i) { return ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"); });

  }

  function onClear() {
     dataTable.length = 0;
     dataTable.push([]);
     hot1.render();
  }

  //  Append load loaded graph to table
  function append() {
        if(downloadedData != null) {
          if(dataTable.length == 1) {
            dataTable.pop();
          }
          var selectValue = d3.select('select').property('value');
          var sensors = downloadedData.aggregations.group.buckets.map( s => s.key)
          var sensorIndex = sensors.indexOf(selectValue)
          if(sensorIndex == -1) {
            sensorIndex = 0;
          }
          var stepCount = downloadedData.aggregations.group.buckets[sensorIndex].group_docs.hits.hits[0]._source.leq.length;
          var sensorData = downloadedData.aggregations.group.buckets[sensorIndex].group_docs.hits.hits[0]._source;
          var sensorTime = downloadedData.aggregations.group.buckets[sensorIndex].group_docs.hits.hits[0]._source.timestamp;
          var t, freqIndex;
          for(t=0; t<stepCount; t++) {
            var rowvalues = [];
            for(freqIndex=fields.length - 1; freqIndex >= 0 ; freqIndex--) {
              freqField = Math.trunc(fields[freqIndex]);
              rowvalues.push(freqIndex < fields.length - 2 ? sensorData['leq_'+freqField][t] : freqIndex == fields.length - 2 ? sensorData['leq'][t] : sensorData['laeq'][t]);
            }
            dataTable.push([selectValue, sensorTime + t * 125, new Date(sensorTime + t * 125).toISOString()].concat(rowvalues));
          }
        }
        hot1.render();
  }

  var heatmapChart = function(timeStart, sensorId) {
    d3.json("fast/"+timeStart).then(function(jsonContent) {
      downloadedData = jsonContent;
      displayed_time = timeStart;
      loadSensor(jsonContent, sensorId);
    });
  };

  function onExport() {
      var stringData, filename, link;

      stringData = settings1.colHeaders.join(',') + "\n";

      stringData += dataTable.map(row => row.join(',')).join("\n");

      // stringData = 'data:text/csv;charset=utf-8,' + stringData;

      download(stringData, "rawdata.csv", "text/plain");
  }

  var dataTable = [[]];

  heatmapChart(moment().subtract(1, 'minutes').valueOf(), "");

  var container1 = document.getElementById('datatable'),
    settings1 = {
      data: dataTable,
      minCols: fields.length + 3,
      readOnly: true,
      autoColumnSize: true,
      colHeaders: ['sensor', 'epoch', 'date'].concat(fields.slice().reverse()),
    }, hot1;

  hot1 = new Handsontable(container1, settings1);