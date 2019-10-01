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

function configure() {
    var dateStart = $('input[name="datetimes"]').data('daterangepicker').startDate.valueOf();
    var dateEnd = $('input[name="datetimes"]').data('daterangepicker').endDate.valueOf();

    var startHour = $('input[name="startHour"]')[0].value;
    var endHour = $('input[name="endHour"]')[0].value;

    // generate json to post
    var jsonQuery = {
        date_start : dateStart,
        date_end : dateEnd,
        spectrum : resultsTable[0],
        weight : resultsTable[1],
        cosine : parseFloat($('input[name="cos_threshold"]')[0].value),
        min_leq : parseFloat($('input[name="minleq"]')[0].value),
        cached_length : parseInt($('input[name="minlength"]')[0].value),
        total_length : parseInt($('input[name="maxlength"]')[0].value),
        trigger_count : parseInt($('input[name="triggerday"]')[0].value)
         };

    if(startHour != "") {
        jsonQuery["start_hour"] = startHour;
    }

    if(endHour != "") {
        jsonQuery["end_hour"] = endHour;
    }

    $('input[name="pubkey"]')[0].files[0].text().then(function(value) {
        jsonQuery["file"] = value;

        $.ajax({
          type: "POST",
          url: "set-trigger",
          data: JSON.stringify(jsonQuery),
          success: function(val) {
            // TODO set message
          },
          contentType : 'application/json',
        });


        $('html, body').animate({ scrollTop: 0 }, 'fast');
    });

}