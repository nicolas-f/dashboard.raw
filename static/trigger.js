function loadDateTime() {
      $('input[name="datetimes"]').daterangepicker({
          "showISOWeekNumbers": true,
          "timePicker": true,
          "timePicker24Hour": true,
          "timePickerSeconds": true,
          "autoApply": true,
          ranges: {
              'Tomorrow': [moment().add(1, 'days').startOf('day'), moment().add(1, 'days').endOf('day')],
              'Next 7 Days': [moment().add(1, 'days').startOf('day'), moment().add(6, 'days')],
              'Next 30 Days': [moment().add(1, 'days').startOf('day'), moment().add(29, 'days')],
              'This Month': [moment().add(1, 'days').startOf('day'), moment().endOf('month')],
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
          "startDate": moment().add(1, 'days').startOf('day'),
          "endDate": moment().add(1, 'days').endOf('day')
      });

  }
