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

function loadDateTimePlayer() {
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
          "startDate": moment().subtract(6, 'days').startOf('day'),
          "endDate": moment()
      });
  }

function StrToArrayBuffer(byteStr) {
  var bytes = new Uint8Array(byteStr.length)
  for (var i = 0; i < byteStr.length; i++) {
    bytes[i] = byteStr.charCodeAt(i)
  }
  return bytes.buffer
}

function base64StringToArrayBuffer(b64str) {
  return StrToArrayBuffer(atob(b64str));
}

function convertPemToBinary(pem) {
  var lines = pem.split('\n')
  var encoded = ''
  for(var i = 0;i < lines.length;i++){
    if (lines[i].trim().length > 0 &&
        lines[i].indexOf('-BEGIN') < 0 &&
        lines[i].indexOf('-END') < 0) {
      encoded += lines[i].trim()
    }
  }
  return base64StringToArrayBuffer(encoded);
}

/*
Import a PEM encoded RSA private key, to use for RSA-PSS signing.
Takes a string containing the PEM encoded key, and returns a Promise
that will resolve to a CryptoKey representing the private key.
*/
function importPrivateKey(pem) {
      // convert from a binary string to an ArrayBuffer
      const binaryDer = convertPemToBinary(pem);

      return window.crypto.subtle.importKey(
        "pkcs8",
        binaryDer,
        {
          name: "RSA-OAEP",
          hash: {name: "SHA-256"},
        },
        true,
        ["decrypt"]
      );
}
function stringToArrayBuffer(str){
    var buf = new ArrayBuffer(str.length);
    var bufView = new Uint8Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

function arrayBufferToString(str){
    var byteArray = new Uint8Array(str);
    var byteString = '';
    for(var i=0; i < byteArray.byteLength; i++) {
        byteString += String.fromCodePoint(byteArray[i]);
    }
    return byteString;
}

function encryptDataWithPublicKey(data, key) {
    data = stringToArrayBuffer(data);
    return window.crypto.subtle.encrypt(
    {
        name: "RSA-OAEP",
        //label: Uint8Array([...]) //optional
    },
    key, //from generateKey or importKey above
    data //ArrayBuffer of data you want to encrypt
);
}


function decryptDataWithPrivateKey(data, key) {
    data = stringToArrayBuffer(data);
    return window.crypto.subtle.decrypt(
        {
            name: "RSA-OAEP",
            //label: Uint8Array([...]) //optional
        },
        key, //from generateKey or importKey above
        data //ArrayBuffer of data you want to encrypt
    );
}


async function do_decrypt(jsonContent) {
    const pem = await $('input[name="privkey"]')[0].files[0].text();
    var encrypted = atob(jsonContent.hits.hits[0]._source.samples);
    // convert a Forge certificate from PEM
    const pki = forge.pki;
    var privateKey = pki.decryptRsaPrivateKey(pem, $('input[name="pwd"]')[0].value);
    let el = document.getElementById("error_panel");
    if(privateKey == null) {
        el.style.visibility = "visible";
        el.innerHTML = "Invalid decryption key or password";
    } else {
        el.style.visibility = "hidden";
    }
    //var decrypted = privateKey.decrypt(encrypted.substring(0, 512), 'RSA-OAEP');
    var header = 'z2ZrmqB7SiEtA2roZ3+oLxgxvoSpdK+/sfpUYNgAms8=';
    var header_encrypted = 'kXnwAT1JNztfsWQw6wbNp+5EyTtsvupAw4CkHVhul5kN/cCv1+nYUN4Nlzgq/2fz5cv68uKLQu3bKGymskH00RLNScQhqm3NZfPKQW/BY3Cnl5mCXUbJJ0ddr9RiXwzREGJWZM6uNz2uqsVDAOy7AFVXL21rnzuAJHmed1nTRgOnmz+dBhdFFAC3MgT3nyCunbHI9RIBfID7+vPeZbr4yvXStIf+mej0+/PAAjXzuoaS1rhuXegjH6Y/ojZjYxzI2HN7HJVtLh8V8vNOtsCUuLxt81pxa2L1a08ODmK2PV9tyNmPbVX4A9AFEzmvUqARAkWUuIugul6cxvUaKc+yk8prRs/ehOe1xLombbO/Xs2ND2o0YJerrQmEgFu2i4GHxZ9KXyOoBQu11d42IuUM8O/AXPyJPjPfr+px24uDvgg2IGNK5IKOTI1B0FfuaHIgSNX6bHGhPod1fjOgB03kCoiYH9JuSUUqqv9CKcxmm+uvj6PQv6Dzmxsft00F4GIxU6yjaGtQ8o110Yg2XNAeIJyarPZ03byrwXtT2j0lw5sdooVFmzbuWs/7FaE0rT37OhXZ9tidxjgi6vzXs3EKwiQP3Dz99mAToY9D9B7t42+iq0Hg6ErtX6RbjdWAn1tw7dmFCucVC9aCTeKnk3v116KJtitSAJADJ49dr4EiwlA=';
    var decrypted = privateKey.decrypt(atob(header_encrypted), 'RSA-OAEP');

    console.log(btoa(decrypted));
}

//
//async function do_decrypt(jsonContent) {
//    const pem = await $('input[name="privkey"]')[0].files[0].text();
//    var encrypted = atob(jsonContent.hits.hits[0]._source.samples);
//    privateKey = await importPrivateKey(pem);
//    // export private key to JWK
//    const jwk = await crypto.subtle.exportKey("jwk", privateKey);// remove private data from JWK
//    delete jwk.d;
//    delete jwk.dp;
//    delete jwk.dq;
//    delete jwk.q;
//    delete jwk.qi;
//    jwk.key_ops = ["encrypt", "wrapKey"];
//    // import public key
//    const publicKey = await crypto.subtle.importKey("jwk", jwk, { name: "RSA-OAEP",
//    hash: privateKey.algorithm.hash.name }, true, ["encrypt", "wrapKey"]);
//
//    let enc = new TextEncoder();
//    let encoded = enc.encode("hello");
//    ciphertext = await window.crypto.subtle.encrypt(
//      {
//        name: "RSA-OAEP"
//      },
//      publicKey,
//      encoded
//    );
//    console.log(ciphertext);
//    console.log(stringToArrayBuffer(encrypted.substring(0, 512)));
//
//    let decrypted = await window.crypto.subtle.decrypt(
//      {
//        name: "RSA-OAEP"
//      },
//      privateKey,
//      stringToArrayBuffer(encrypted.substring(0, 512))
//    );
//
//    let dec = new TextDecoder();
//    console.log(dec.decode(decrypted));
//}

function decrypt_and_download(sample_id) {
    $.ajax({
      type: "GET",
      url: "get-samples/"+sample_id,
      success: function(jsonContent) {
            do_decrypt(jsonContent);
      },
      contentType : 'application/json',
    });
}

function fetch() {
    var dateStart = $('input[name="datetimes"]').data('daterangepicker').startDate.valueOf();
    var dateEnd = $('input[name="datetimes"]').data('daterangepicker').endDate.valueOf();

    $.ajax({
      type: "GET",
      url: "list-samples/"+dateStart+"/"+dateEnd,
      success: function(jsonContent) {
        downloadedData.length = 0;
        jsonContent.hits.hits.forEach(function(element) {
            entry = {};
            entry["id"]="<a href=\"#\" onclick=\"decrypt_and_download('"+element["_id"]+"')\">Download</a>";
            var date = new Date(element["_source"]["timestamp"]);
            entry["timestamp"]=date.toLocaleDateString()+" "+date.toLocaleTimeString();
            entry["producerID"]=element["_source"]["producerID"];
            downloadedData.push(entry);
        });
        stations.render();
      },
      contentType : 'application/json',
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