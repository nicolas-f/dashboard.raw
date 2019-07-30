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
          "startDate": moment().subtract(1, 'minutes'),
          "endDate": moment()
      }, function(start, end, label) {
        //selectValue = d3.select('select').property('value')
        //heatmapChart(start.valueOf(), selectValue);
      });

  }

function getCarData() {
    return [
      {car: "Mercedes A 160", year: 2017, available: true, comesInBlack: 'yes'},
      {car: "Citroen C4 Coupe", year: 2018, available: false, comesInBlack: 'yes'},
      {car: "Audi A4 Avant", year: 2019, available: true, comesInBlack: 'no'},
      {car: "Opel Astra", year: 2020, available: false, comesInBlack: 'yes'},
      {car: "BMW 320i Coupe", year: 2021, available: false, comesInBlack: 'no'}
    ];
  }
