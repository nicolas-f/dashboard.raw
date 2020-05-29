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

  var downloadedData = {};
  
  function loadSensor(jsonContent) {
      svg.selectAll(".hour").remove();
      if (typeof jsonContent.aggregations == 'undefined') {
        throw "Wrong Json conent " + jsonContent;
      }

      var recordCount = jsonContent.aggregations.daily.buckets.length;
      var sensorData = jsonContent.aggregations.daily.buckets;
      var data = [];
      var t, freqIndex;
      for(t=0; t<recordCount; t++) {
        var field_date =  jsonContent.aggregations.daily.buckets[t]["key_as_string"]; //"2020-04-01 00"
        var field_epoch = jsonContent.aggregations.daily.buckets[t]["key"];
        var field_num_records = jsonContent.aggregations.daily.buckets[t]["doc_count"];
        data.push({
            day: freqIndex,
            hour: + (t+1),
            value: + (freqIndex < fields.length - 2 ? sensorData['leq_'+freqField][t] : freqIndex == fields.length - 2 ? sensorData['leq'][t] : sensorData['laeq'][t])
        });
      }


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

  var heatmapChart = function(sensorId) {
    d3.json("static/testuptime.json").then(function(jsonContent) {
      downloadedData = jsonContent;
      loadSensor(jsonContent);
    });
  };

  heatmapChart("");
