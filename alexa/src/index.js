'use strict';
var Alexa = require("alexa-sdk");
var AWS = require("aws-sdk");
var request = require('request');
//var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
//var NutritionixClient = require('nutritionix');


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

    /*
        const promise = new Promise((resolve, reject) => {
            request.get({
                uri: 'https://api.nutritionix.com/v1_1/search/banana',
                qs: {
                    appId: '27d56daa',
                    appKey: '801497a4013af4e17085d5d46e305d0e',
                    fields: 'item_name,item_id,brand_name,nf_calories,nf_total_fat'
                }
            }, (err, response, body) => {
                if(err) {
                    reject(err);
                } else {
                    resolve([response, body]);
                }
            });
        }).then(([response, body]) => {
            console.log('body', body);

            if (response.status !== 200) {
                console.log("results error");
            }
            console.log(body);

            myCalories = (int) 89.98;
            var timestamp = new Date();
            var table = 'LoggedItems';
            var params = {
                TableName: table,
                Item: {
                    TimeOfLog: timestamp.toString(),
                    Calories: myCalories,
                    Name: myItemName
                }
            };

            var speechOutput = 'I invoked the LogItemIntent';
            docClient.put(params).promise().then((data) => {
                this.emit(':tell', speechOutput);
            })
            .catch((err) => console.log(err));
        })
        .catch(err => console.error(err));
*/
        
        request.get({
            uri: 'https://api.nutritionix.com/v1_1/search/' + myItemName,
            qs: {
                appId: '27d56daa',
                appKey: '801497a4013af4e17085d5d46e305d0e',
                fields: 'item_name,item_id,brand_name,nf_calories,nf_total_fat'
            }
        }, (err, response, body) => {
            console.log('body', body);

            if (response.status === 200) {
                console.log("results error");
            }

            //var parsed = JSON.parse(response);
            //console.log(parsed);
            console.log(body);
            console.log(response);
            console.log(JSON.parse(body));
            var parsed = JSON.parse(body);
            console.log('hits',parsed.hits);
            console.log('hits via bracket', parsed['hits']);
            //console.log(body["total_hits"]);
            //console.log('mah booty', body['hits'][0]);
            console.log(parsed['hits'][0]['fields']);
            //var myCalories = (int)parsed['hits'][0]['fields']['nf_calories'];
            var myCalories = Math.floor(parsed['hits'][0]['fields']['nf_calories']);
            var timestamp = new Date();
            var table = 'LoggedItems';
            var params = {
                TableName: table,
                Item: {
                    TimeOfLog: timestamp.toString(),
                    Calories: myCalories,
                    Items: {
                        [myItemName]: 1
                    }
                }
            };

            var speechOutput = 'I invoked the LogItemIntent';

            docClient.put(params).promise().then((data) => {

                var getParams = {
                    TableName: "User",
                    Key: {
                        Id: 1
                    }
                };
                docClient.get(getParams).promise().then((data) => {
                    var oldCalories = data.Item.Calories;
                    var newCalories = oldCalories + myCalories;

                    var updateParams = {
                        TableName: 'User',
                        Key: {
                            Id: 1
                        },
                        UpdateExpression: "set Calories = :c",
                        ExpressionAttributeValues: {
                            ":c":newCalories
                        }
                    };
                    docClient.update(updateParams).promise().then((data) => {
                        this.emit(':tell', speechOutput);
                    })
                    .catch((err) => console.log(err));
                })
                .catch((err) => console.log(err));
            })
            .catch((err) => console.log(err));
        });


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
        AWS.config.update({
            region: "us-east-1",
            endpoint: 'http://dynamodb.us-east-1.amazonaws.com',
            accessKeyId: 'AKIAJKTVMITXX54WN63A',
            secretAccessKey: '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'
        });

        var docClient = new AWS.DynamoDB.DocumentClient();

        var params = {
            TableName: "User",
            Key: {
                Id: 1
            }
        };
        docClient.get(params).promise().then((data) => {
                var myCalories = data.Item.Calories;
                var speechOutput = 'You have eaten ' + myCalories + ' calories today';
                this.emit(':tell', speechOutput);
            })
            .catch((err) => console.log(err));


    }
};




