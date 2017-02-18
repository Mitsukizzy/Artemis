'use strict';
var Alexa = require("alexa-sdk");

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        this.emit(':tell', 'Launching');
    },
    'LogItemIntent': function () {
        /*
        Intended to calculate the caloric count of an item, then add it as an item to our database
        */
        var speechOutput = 'I invoked the LogItemIntent ' + this.event.request.intent.slots.ItemName.value;
        this.emit(':tell', speechOutput);
    },
    'LogMultipleItemsIntent': function () {
        var myIntent = this.event.request.intent;
        var myItemNum = myIntent.slots.ItemNumber.value;
        var myItemName = myIntent.slots.ItemName.value;
        var speechOutput = 'I invoked the LogMultipleItemsIntent ' + myItemNum + ' ' + myItemName;

        // call https request for the item name
        var url = "https://api.nutritionix.com/v1_1/search/cheddar%20cheese?fields=item_name%2Citem_id%2Cbrand_name%2Cnf_calories%2Cnf_total_fat&appId=27d56daa&appKey=801497a4013af4e17085d5d46e305d0e";
        //var myItemCalorie = httpGetAsync(url, callback);
        this.emit(':tell', speechOutput);
    },
    'HowAmIDoingIntent': function () {
        /*
        Intended to retrieve data from dynamodb, then send that data for alexa to reply
        */


        var speechOutput = 'I invoked the HowAmIDoingIntent';
        this.emit(':tell', speechOutput);
    }
};


//https://api.nutritionix.com/v1_1/search/cheddar%20cheese?fields=item_name%2Citem_id%2Cbrand_name%2Cnf_calories%2Cnf_total_fat&appId=27d56daa&appKey=801497a4013af4e17085d5d46e305d0e
//ID: 27d56daa
//KEY: 801497a4013af4e17085d5d46e305d0e
var httpGetAsync = function(theUrl, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            return callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
}

var callback = function(e) {
    var response = JSON.parse(xhr.responseText);
    alert(response.ip);
    return response['hits'][0]['nf_calories']; // should return the calories
}



