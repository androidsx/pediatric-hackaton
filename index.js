var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.set('port', (process.env.PORT || 5000));

var PATIENT_RESOURCE_API = "https://navhealth.herokuapp.com/api/fhir/Patient/d524b269c800fb5a266209a6"
var MEDICATION_RESOURCE_API = "https://navhealth.herokuapp.com/api/fhir/Medication/d9b24bf4e659da35d723b756"
var MEDICATION_ORDER_RESOURCE_API = "https://navhealth.herokuapp.com/api/fhir/MedicationOrder/f09168d6c2c44a3d6cdb7801"

app.get('/patient', function(req, res) {
    request(PATIENT_RESOURCE_API, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var body_json = JSON.parse(body);
            var result = {
                name: body_json["name"][0]["given"][0],
                surname: body_json["name"][0]["family"][0],
                lang_code: body_json["communication"][0]["language"]["coding"][0]["code"],
                contact_name: body_json["contact"][0]["name"]["given"][0],
                contact_surname: body_json["contact"][0]["name"]["family"][0],
            }
            res.send(result);
        } else {
            res.send(getMockDataPatient());
        }
    })
});

app.get('/medication', function(req, res) {
    request(MEDICATION_RESOURCE_API, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var body_medication_json = JSON.parse(body);

            var drug = body_medication_json["code"]["coding"][0]["display"];

            request(MEDICATION_ORDER_RESOURCE_API, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var body_medication_order_json = JSON.parse(body);

                    var frequency = body_medication_order_json["dosageInstruction"][0]["timing"]["repeat"]["frequency"];
                    var period = body_medication_order_json["dosageInstruction"][0]["timing"]["repeat"]["period"];
                    var periodUnits = body_medication_order_json["dosageInstruction"][0]["timing"]["repeat"]["periodUnits"];


                    var textPeriodUnits = "every {0}{1}".format(period, periodUnits);
                    if (periodUnits == "d") {
                        textPeriodUnits = "every {0} day".format(period);
                        if (period > 1) {
                            textPeriodUnits += "s";
                        }
                    }

                    var displayText = "{0} dose of {1} {2}".format(frequency, drug, textPeriodUnits)
                    var result = {
                        drug: drug,
                        frequency_dose: frequency,
                        text_period_with_unit: textPeriodUnits,
                        display_text: displayText
                    }
                    res.send(result);
                } else {
                    res.send(getMockDataMedication());
                }
            });
        } else {
            res.send(getMockDataMedication());
        }
    });
});

function getMockDataPatient() {
    return {
        "name": "Pieter",
        "surname": "van de Heuvel",
        "lang_code": "nl",
        "contact_name": "Sarah",
        "contact_surname": "Abels"
    };
}

function getMockDataMedication() {
    return {
        "drug": "Rosuvastatin 10mg tablet",
        "frequency_dose": 1,
        "text_period_with_unit": "every 1 day",
        "display_text": "1 dose of Rosuvastatin 10mg tablet every 1 day"
    };
}

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});

// First, checks if it isn't implemented yet.
if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
                ;
        });
    };
}
