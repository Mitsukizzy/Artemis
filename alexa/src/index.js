'use strict';
var Alexa = require("alexa-sdk");
var AWS = require("aws-sdk");

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
        AWS.config.update({
            region: "us-east-1",
            endpoint: 'http://dynamodb.us-east-1.amazonaws.com',
            accessKeyId: 'AKIAJKTVMITXX54WN63A',
            secretAccessKey: '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'
        });

        var docClient = new AWS.DynamoDB.DocumentClient();

        var myIntent = this.event.request.intent;
        var myItemName = myIntent.slots.ItemName.value;

        var table = 'LoggedItems';
        var params = {
            TableName: table,
            Item: {
                TimeOfLog: 'yetanotherTEst',
                Calories: 120
            }
        };

        var speechOutput = 'I invoked the LogItemIntent';
        docClient.put(params).promise().then((data) => {
            this.emit(':tell', speechOutput);
        }).catch((err) => console.log(err));

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



