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




