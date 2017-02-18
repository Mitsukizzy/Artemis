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
        var speechOutput = 'I invoked the LogItemIntent ' + this.event.request.intent.slots.ItemName.value;
        this.emit(':tell', speechOutput);
    },
    'LogMultipleItemsIntent': function () {
        var myIntent = this.event.request.intent;
        var myItemNum = myIntent.slots.ItemNumber.value;
        var myItemName = myIntent.slots.ItemName.value;
        var speechOutput = 'I invoked the LogMultipleItemsIntent ' + myItemNum + ' ' + myItemName;

        this.emit(':tell', speechOutput);
    }
};