'use strict';
var Alexa = require("alexa-sdk");
var AWS = require("aws-sdk");
var request = require('request');

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        this.emit(':ask', 'Welcome to Artemis. How may I help you?');
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

        if (myItemName == undefined) {
            this.emit(':tell', 'I am sorry, I do not know what that is');
        }

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
                fields: 'item_name,item_id,brand_name,nf_calories,nf_total_fat,nf_dietary_fiber,nf_sugars,nf_protein,nf_total_carbohydrate'
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
            var myFats = Math.floor(parsed['hits'][0]['fields']['nf_total_fat']);
            var myCarbs = Math.floor(parsed['hits'][0]['fields']['nf_total_carbohydrate']);
            var myFiber = Math.floor(parsed['hits'][0]['fields']['nf_dietary_fiber']);
            var mySugars = Math.floor(parsed['hits'][0]['fields']['nf_sugars']);
            var myProtein = Math.floor(parsed['hits'][0]['fields']['nf_protein']);

            var d = new Date();
            var utc = d.getTime() + (d.getTimezoneOffset()*60000);
            var timestamp = new Date(utc + (3600000 * (-8)));
            var logTime = "" + timestamp.getDate() + "/"
                + (timestamp.getMonth()+1)  + "/" 
                + timestamp.getFullYear() + " @ "  
                + timestamp.getHours() + ":"  
                + timestamp.getMinutes() + ":" 
                + timestamp.getSeconds();
            var table = 'LoggedItems';
            console.log("passed another checkpoint");
            var params = {
                TableName: table,
                Item: {
                    TimeOfLog: logTime,
                    Calories: myCalories,
                    Fats: myFats,
                    Carbs: myCarbs,
                    Fiber: myFiber,
                    Sugars: mySugars,
                    Protein: myProtein,
                    Items: {
                        [myItemName]: 1
                    }
                }
            };


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

                    var oldFats = data.Item.Fats;
                    var newFats = oldFats + myFats;

                    var oldCarbs = data.Item.Carbs;
                    var newCarbs = oldCarbs + myCarbs;

                    var oldFiber = data.Item.Fiber;
                    var newFiber = oldFiber + myFiber;

                    var oldSugars = data.Item.Sugars;
                    var newSugars = oldSugars + mySugars;

                    var oldProtein = data.Item.Protein;
                    var newProtein = oldProtein + myProtein;

                    var calorieGoal = data.Item.CalorieGoal;

                    var updateParams = {
                        TableName: 'User',
                        Key: {
                            Id: 1
                        },
                        UpdateExpression: "set Calories=:c, Fats=:f, Carbs=:b, Fiber=:r, Sugars=:s, Protein=:p",
                        ExpressionAttributeValues: {
                            ":c":newCalories,
                            ":f":newFats,
                            ":b":newCarbs,
                            ":r":newFiber,
                            ":s":newSugars,
                            ":p":newProtein
                        }
                    };
                    docClient.update(updateParams).promise().then((data) => {
                        var speechOutput = 'Ok, I logged the ' + myItemName + '. You are now '
                        var calorieDiff = calorieGoal - newCalories;
                        if (calorieDiff >= 0) {
                            speechOutput = speechOutput + calorieDiff + " calories under your goal today.";
                        } else {
                            speechOutput = speechOutput + Math.abs(calorieDiff) + " calories over your goal today."
                        }
                        speechOutput += ' Anything else?';
                        var reprompt = 'Anything else?';
                        this.emit(':ask', speechOutput, reprompt);
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
        var myItemNum = parseInt(myIntent.slots.ItemNumber.value);
        var myItemName = myIntent.slots.ItemName.value;
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

        if (myItemName == undefined || myItemNum == undefined) {
            this.emit(':tell', 'I am sorry, I do not know what that is');
        }
        
        request.get({
            uri: 'https://api.nutritionix.com/v1_1/search/' + myItemName,
            qs: {
                appId: '27d56daa',
                appKey: '801497a4013af4e17085d5d46e305d0e',
                fields: 'item_name,item_id,brand_name,nf_calories,nf_total_fat,nf_dietary_fiber,nf_sugars,nf_protein,nf_total_carbohydrate'
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
            var myCalories = Math.floor(parsed['hits'][0]['fields']['nf_calories'])*myItemNum;
            var myFats = Math.floor(parsed['hits'][0]['fields']['nf_total_fat'])*myItemNum;
            var myCarbs = Math.floor(parsed['hits'][0]['fields']['nf_total_carbohydrate'])*myItemNum;
            var myFiber = Math.floor(parsed['hits'][0]['fields']['nf_dietary_fiber'])*myItemNum;
            var mySugars = Math.floor(parsed['hits'][0]['fields']['nf_sugars'])*myItemNum;
            var myProtein = Math.floor(parsed['hits'][0]['fields']['nf_protein'])*myItemNum;

            var d = new Date();
            var utc = d.getTime() + (d.getTimezoneOffset()*60000);
            var timestamp = new Date(utc + (3600000 * (-8)));
            var logTime = "" + timestamp.getDate() + "/"
                + (timestamp.getMonth()+1)  + "/" 
                + timestamp.getFullYear() + " @ "  
                + timestamp.getHours() + ":"  
                + timestamp.getMinutes() + ":" 
                + timestamp.getSeconds();
            var table = 'LoggedItems';
            console.log("passed another checkpoint");
            var params = {
                TableName: table,
                Item: {
                    TimeOfLog: logTime,
                    Calories: myCalories,
                    Fats: myFats,
                    Carbs: myCarbs,
                    Fiber: myFiber,
                    Sugars: mySugars,
                    Protein: myProtein,
                    Items: {
                        [myItemName]: myItemNum
                    }
                }
            };


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

                    var oldFats = data.Item.Fats;
                    var newFats = oldFats + myFats;

                    var oldCarbs = data.Item.Carbs;
                    var newCarbs = oldCarbs + myCarbs;

                    var oldFiber = data.Item.Fiber;
                    var newFiber = oldFiber + myFiber;

                    var oldSugars = data.Item.Sugars;
                    var newSugars = oldSugars + mySugars;

                    var oldProtein = data.Item.Protein;
                    var newProtein = oldProtein + myProtein;

                    var calorieGoal = data.Item.CalorieGoal;

                    var updateParams = {
                        TableName: 'User',
                        Key: {
                            Id: 1
                        },
                        UpdateExpression: "set Calories=:c, Fats=:f, Carbs=:b, Fiber=:r, Sugars=:s, Protein=:p",
                        ExpressionAttributeValues: {
                            ":c":newCalories,
                            ":f":newFats,
                            ":b":newCarbs,
                            ":r":newFiber,
                            ":s":newSugars,
                            ":p":newProtein
                        }
                    };
                    docClient.update(updateParams).promise().then((data) => {
                        var speechOutput = 'Ok, I logged the ' + myItemNum + ' ' + myItemName + '. You are now '
                        var calorieDiff = calorieGoal - newCalories;
                        if (calorieDiff >= 0) {
                            speechOutput = speechOutput + calorieDiff + " calories under your goal today.";
                        } else {
                            speechOutput = speechOutput + Math.abs(calorieDiff) + " calories over your goal today."
                        }
                        speechOutput += ' Anything else?';
                        var reprompt = 'Anything else?';
                        this.emit(':ask', speechOutput, reprompt);
                    })
                    .catch((err) => console.log(err));
                })
                .catch((err) => console.log(err));
            })
            .catch((err) => console.log(err));
        });

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
                var myFats = data.Item.Fats;
                var myCarbs = data.Item.Carbs;
                var myFiber = data.Item.Fiber;
                var mySugars = data.Item.Sugars;
                var myProtein = data.Item.Protein;
                var speechOutput = 'Today, you have eaten ' + myCalories + ' calories, and '
                    + myCarbs + ' grams of fat, and '
                    + myFats + ' grams of carbohydrates, and '
                    + myFiber + ' grams of fiber, and '
                    + mySugars + ' grams of sugar, and '
                    + myProtein + ' grams of protein';
                this.emit(':tell', speechOutput);
            })
            .catch((err) => console.log(err));
    },
    'StopIntent': function () {
        this.emit(':tell', 'Goodbye');
    },
    'SetCalorieGoalIntent': function () {
        var myIntent = this.event.request.intent;
        var check = myIntent.slots.ItemNumber.value;
        if (check == undefined) {
            this.emit(':tell', 'I am sorry, I did not catch that');
        }
        var myNum = parseInt(check);

        AWS.config.update({
            region: "us-east-1",
            endpoint: 'http://dynamodb.us-east-1.amazonaws.com',
            accessKeyId: 'AKIAJKTVMITXX54WN63A',
            secretAccessKey: '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'
        });

        var docClient = new AWS.DynamoDB.DocumentClient();

        var updateParams = {
            TableName: 'User',
            Key: {
                Id: 1
            },
            UpdateExpression: "set CalorieGoal=:c",
            ExpressionAttributeValues: {
                ":c":myNum,
            }
        };
        docClient.update(updateParams).promise().then((data) => {
            var speechOutput = 'Ok, your daily goal is now set to ' + myNum + ' calories.'
            speechOutput += ' Anything else?';
            var reprompt = 'Anything else?';
            this.emit(':ask', speechOutput, reprompt);
        })
        .catch((err) => console.log(err));        
    },
    'GetItemInfoIntent': function () {
        var myIntent = this.event.request.intent;
        var myItemName = myIntent.slots.ItemName.value;
        var myNutrientType = myIntent.slots.NutrientType.value;
        if (myItemName == undefined || myNutrientType == undefined) {
            this.emit(':tell', 'I am sorry, I did not catch that');
        }

        request.get({
            uri: 'https://api.nutritionix.com/v1_1/search/' + myItemName,
            qs: {
                appId: '27d56daa',
                appKey: '801497a4013af4e17085d5d46e305d0e',
                fields: 'item_name,item_id,brand_name,nf_calories,nf_total_fat,nf_dietary_fiber,nf_sugars,nf_protein,nf_total_carbohydrate'
            }
        }, (err, response, body) => {
            if (response.status === 200) {
                console.log("results error");
            }

            var parsed = JSON.parse(body);
            var myCalories = Math.floor(parsed['hits'][0]['fields']['nf_calories']);
            var myFats = Math.floor(parsed['hits'][0]['fields']['nf_total_fat']);
            var myCarbs = Math.floor(parsed['hits'][0]['fields']['nf_total_carbohydrate']);
            var myFiber = Math.floor(parsed['hits'][0]['fields']['nf_dietary_fiber']);
            var mySugars = Math.floor(parsed['hits'][0]['fields']['nf_sugars']);
            var myProtein = Math.floor(parsed['hits'][0]['fields']['nf_protein']);
            var speechOutput = "On average, a " + myItemName + " has "
            if (myNutrientType === 'carb') {
                speechOutput = speechOutput + myCarbs + " grams of carbohydrates per serving.";    
            }
            else if (myNutrientType === 'calories') {
                speechOutput = speechOutput + myCalories + " calories per serving.";    
            }
            else if (myNutrientType === 'sugar') {
                speechOutput = speechOutput + mySugars + " grams of sugars per serving.";    
            }
            else if (myNutrientType === 'fat') {
                speechOutput = speechOutput + myFats + " grams of fat per serving.";    
            }
            else if (myNutrientType === 'fiber') {
                speechOutput = speechOutput + myFiber + " grams of fiber per serving.";    
            }
            else
            {
                speechOutput = speechOutput + myProtein + " grams of protein per serving.";    
            }

            speechOutput += ' Anything else?';
            var reprompt = 'Anything else?';
            this.emit(':ask', speechOutput, reprompt);
        });
    },
    'GetMultipleItemsInfoIntent': function () {
        var myIntent = this.event.request.intent;
        var myItemName = myIntent.slots.ItemName.value;
        var myNutrientType = myIntent.slots.NutrientType.value;

        if (myItemName == undefined || myNutrientType == undefined || myIntent.slots.ItemNumber.value == undefined) {
            this.emit(':tell', 'I am sorry, I did not catch that');
        }
        var myItemNum = parseInt(myIntent.slots.ItemNumber.value);


        request.get({
            uri: 'https://api.nutritionix.com/v1_1/search/' + myItemName,
            qs: {
                appId: '27d56daa',
                appKey: '801497a4013af4e17085d5d46e305d0e',
                fields: 'item_name,item_id,brand_name,nf_calories,nf_total_fat,nf_dietary_fiber,nf_sugars,nf_protein,nf_total_carbohydrate'
            }
        }, (err, response, body) => {
            if (response.status === 200) {
                console.log("results error");
            }

            var parsed = JSON.parse(body);
            var myCalories = Math.floor(parsed['hits'][0]['fields']['nf_calories']) *myItemNum;
            var myFats = Math.floor(parsed['hits'][0]['fields']['nf_total_fat']) *myItemNum;
            var myCarbs = Math.floor(parsed['hits'][0]['fields']['nf_total_carbohydrate']) *myItemNum;
            var myFiber = Math.floor(parsed['hits'][0]['fields']['nf_dietary_fiber']) *myItemNum;
            var mySugars = Math.floor(parsed['hits'][0]['fields']['nf_sugars']) *myItemNum;
            var myProtein = Math.floor(parsed['hits'][0]['fields']['nf_protein']) *myItemNum;
            var speechOutput = "On average, " + myItemNum + " servings of " + myItemName + " has "
            if (myNutrientType === 'carb') {
                speechOutput = speechOutput + myCarbs + " grams of carbohydrates total.";    
            }
            else if (myNutrientType === 'calories') {
                speechOutput = speechOutput + myCalories + " calories total.";    
            }
            else if (myNutrientType === 'sugar') {
                speechOutput = speechOutput + mySugars + " grams of sugars total.";    
            }
            else if (myNutrientType === 'fat') {
                speechOutput = speechOutput + myFats + " grams of fat total.";    
            }
            else if (myNutrientType === 'fiber') {
                speechOutput = speechOutput + myFiber + " grams of fiber total.";    
            }
            else
            {
                speechOutput = speechOutput + myProtein + " grams of protein total.";    
            }

            speechOutput += ' Anything else?';
            var reprompt = 'Anything else?';
            this.emit(':ask', speechOutput, reprompt);
        });
    }

};




