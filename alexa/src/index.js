'use strict';
var Alexa = require("alexa-sdk");
var AWS = require("aws-sdk");
var request = require('request');


/* ALEXA STATE VARIABLES */
var logAnywaysState = false;
var savedItemName;

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
                logAnywaysState = false;

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
            var myDay = timestamp.getDate()-18; //special for purposes of hackathon
            var myHourMinute = "" + timestamp.getHours() + ":" + timestamp.getMinutes();
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
                    Day: myDay,
                    HourMinute: myHourMinute,
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

                    var goalMet = false;
                    var goals = data.Item.Goals;
                    if (goals[myItemName] != undefined) {
                            goals[myItemName] = goals[myItemName] + 0.01;
                            var multiplied = Math.ceil((goals[myItemName] * 100)%100);
                            if (multiplied >= Math.floor(goals[myItemName])) {
                                delete goals[myItemName];
                                goalMet = true;
                            }
                    }

                    var updateParams = {
                        TableName: 'User',
                        Key: {
                            Id: 1
                        },
                        UpdateExpression: "set Calories=:c, Fats=:f, Carbs=:b, Fiber=:r, Sugars=:s, Protein=:p, Goals=:g",
                        ExpressionAttributeValues: {
                            ":c":newCalories,
                            ":f":newFats,
                            ":b":newCarbs,
                            ":r":newFiber,
                            ":s":newSugars,
                            ":p":newProtein,
                            ":g":goals
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
                        if (goalMet) {
                            speechOutput += ' You also met a quick goal.';
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
                logAnywaysState = false;

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
                            var myDay = timestamp.getDate()-18; //special for purposes of hackathon
            var myHourMinute = "" + timestamp.getHours() + ":" + timestamp.getMinutes();
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
                    Day: myDay,
                    HourMinute: myHourMinute,
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

                    var goalMet = false;
                    var goals = data.Item.Goals;
                    if (goals[myItemName] != undefined) {
                        goals[myItemName] = goals[myItemName] + 0.01*myItemNum;
                            if (multiplied >= Math.floor(goals[myItemName])) {
                                delete goals[myItemName];
                                goalMet = true;
                            }
                    }


                    var updateParams = {
                        TableName: 'User',
                        Key: {
                            Id: 1
                        },
                        UpdateExpression: "set Calories=:c, Fats=:f, Carbs=:b, Fiber=:r, Sugars=:s, Protein=:p, Goals=:g",
                        ExpressionAttributeValues: {
                            ":c":newCalories,
                            ":f":newFats,
                            ":b":newCarbs,
                            ":r":newFiber,
                            ":s":newSugars,
                            ":p":newProtein,
                            ":g":goals
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
                                                if (goalMet) {
                            speechOutput += ' You also met a quick goal.';
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
        this.emit(':tell', 'Ok. Goodbye');
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
            if (myNutrientType === 'carbs') {
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
                speechOutput = speechOutput + mySugars + " grams of sugar total.";    
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
    },
    'LogMultipleItemsAndMultipleItemsIntent': function () {
                logAnywaysState = false;

        var myIntent = this.event.request.intent;
        var myItemNumA = parseInt(myIntent.slots.ItemNumberA.value);
        var myItemNameA = myIntent.slots.ItemNameA.value;
        var myItemNumB = parseInt(myIntent.slots.ItemNumberB.value);
        var myItemNameB = myIntent.slots.ItemNameB.value;

        if (myIntent.slots.ItemNumberA.value == undefined || myIntent.slots.ItemNumberB.value == undefined || myItemNameB == undefined || myItemNameA == undefined) {
            this.emit(':tell', 'I am sorry, I did not catch that');            
        }
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
        
        request.get({
            uri: 'https://api.nutritionix.com/v1_1/search/' + myItemNameA,
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
            var myCalories = Math.floor(parsed['hits'][0]['fields']['nf_calories'])*myItemNumA;
            var myFats = Math.floor(parsed['hits'][0]['fields']['nf_total_fat'])*myItemNumA;
            var myCarbs = Math.floor(parsed['hits'][0]['fields']['nf_total_carbohydrate'])*myItemNumA;
            var myFiber = Math.floor(parsed['hits'][0]['fields']['nf_dietary_fiber'])*myItemNumA;
            var mySugars = Math.floor(parsed['hits'][0]['fields']['nf_sugars'])*myItemNumA;
            var myProtein = Math.floor(parsed['hits'][0]['fields']['nf_protein'])*myItemNumA;

            var d = new Date();
            var utc = d.getTime() + (d.getTimezoneOffset()*60000);
            var timestamp = new Date(utc + (3600000 * (-8)));
            var logTime = "" + timestamp.getDate() + "/"
                + (timestamp.getMonth()+1)  + "/" 
                + timestamp.getFullYear() + " @ "  
                + timestamp.getHours() + ":"  
                + timestamp.getMinutes() + ":" 
                + timestamp.getSeconds();
                            var myDay = timestamp.getDate()-18; //special for purposes of hackathon
            var myHourMinute = "" + timestamp.getHours() + ":" + timestamp.getMinutes();
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
                    Day: myDay,
                    HourMinute: myHourMinute,
                    Items: {
                        [myItemNameA]: myItemNumA
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
                    var goalMet = false;

                    var goals = data.Item.Goals;
                    if (goals[myItemNameA] != undefined) {
                            goals[myItemNameA] = goals[myItemNameA] + 0.01*myItemNumA;
                                    if (multiplied >= Math.floor(goals[myItemNameA])) {
                                delete goals[myItemNameA];
                                goalMet = true;
                            }
                    }


                    var updateParams = {
                        TableName: 'User',
                        Key: {
                            Id: 1
                        },
                        UpdateExpression: "set Calories=:c, Fats=:f, Carbs=:b, Fiber=:r, Sugars=:s, Protein=:p, Goals=:g",
                        ExpressionAttributeValues: {
                            ":c":newCalories,
                            ":f":newFats,
                            ":b":newCarbs,
                            ":r":newFiber,
                            ":s":newSugars,
                            ":p":newProtein,
                            ":g":goals
                        }
                    };
                    docClient.update(updateParams).promise().then((data) => {
                        console.log("FINISHED FIRST SET OF ITEMS");
                        /* !!!!!!!!! */
                        request.get({
                            uri: 'https://api.nutritionix.com/v1_1/search/' + myItemNameB,
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

                            var parsed = JSON.parse(body);
    
                            var myCalories = Math.floor(parsed['hits'][0]['fields']['nf_calories'])*myItemNumB;
                            var myFats = Math.floor(parsed['hits'][0]['fields']['nf_total_fat'])*myItemNumB;
                            var myCarbs = Math.floor(parsed['hits'][0]['fields']['nf_total_carbohydrate'])*myItemNumB;
                            var myFiber = Math.floor(parsed['hits'][0]['fields']['nf_dietary_fiber'])*myItemNumB;
                            var mySugars = Math.floor(parsed['hits'][0]['fields']['nf_sugars'])*myItemNumB;
                            var myProtein = Math.floor(parsed['hits'][0]['fields']['nf_protein'])*myItemNumB;

                            var d = new Date();
                            var utc = d.getTime() + (d.getTimezoneOffset()*60000);
                            var timestamp = new Date(utc + (3600000 * (-8)));
                            var logTime = "" + timestamp.getDate() + "/"
                                + (timestamp.getMonth()+1)  + "/" 
                                + timestamp.getFullYear() + " @ "  
                                + timestamp.getHours() + ":"  
                                + timestamp.getMinutes() + ":" 
                                + timestamp.getSeconds();
                                            var myDay = timestamp.getDate()-18; //special for purposes of hackathon
            var myHourMinute = "" + timestamp.getHours() + ":" + timestamp.getMinutes();
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
                                    Day: myDay,
                                    HourMinute: myHourMinute,
                                    Items: {
                                        [myItemNameB]: myItemNumB
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
                    var goalMet = false;

                                                        var goals = data.Item.Goals;
                    if (goals[myItemNameB] != undefined) {
                            goals[myItemNameB] = goals[myItemNameB] + 0.01*myItemNumB;
                                            if (multiplied >= Math.floor(goals[myItemNameB])) {
                                delete goals[myItemNameB];
                                goalMet = true;
                            }
                    }

                                    var updateParams = {
                                        TableName: 'User',
                                        Key: {
                                            Id: 1
                                        },
                                        UpdateExpression: "set Calories=:c, Fats=:f, Carbs=:b, Fiber=:r, Sugars=:s, Protein=:p, Goals=:g",
                                        ExpressionAttributeValues: {
                                            ":c":newCalories,
                                            ":f":newFats,
                                            ":b":newCarbs,
                                            ":r":newFiber,
                                            ":s":newSugars,
                                            ":p":newProtein,
                                            ":g":goals
                                        }
                                    };
                                    docClient.update(updateParams).promise().then((data) => {
                                        var speechOutput = 'Ok, I logged ' + myItemNumA + ' ' + myItemNameA
                                            + ' and ' + myItemNumB + ' ' + myItemNameB + '. You are now '
                                        var calorieDiff = calorieGoal - newCalories;
                                        if (calorieDiff >= 0) {
                                            speechOutput = speechOutput + calorieDiff + " calories under your goal today.";
                                        } else {
                                            speechOutput = speechOutput + Math.abs(calorieDiff) + " calories over your goal today."
                                        }
                                                                if (goalMet) {
                            speechOutput += ' You also met a quick goal.';
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
                    })
                    .catch((err) => console.log(err));
                })
                .catch((err) => console.log(err));
            })
            .catch((err) => console.log(err));
        });
    },
    'LogMultipleItemsAndSingleItemIntent': function () {
                logAnywaysState = false;

        var myIntent = this.event.request.intent;
        var myItemNumA = parseInt(myIntent.slots.ItemNumberA.value);
        var myItemNameA = myIntent.slots.ItemNameA.value;
        var myItemNumB = 1;
        var myItemNameB = myIntent.slots.ItemNameB.value;

        if (myIntent.slots.ItemNumberA.value == undefined || myItemNameB == undefined || myItemNameA == undefined) {
            this.emit(':tell', 'I am sorry, I did not catch that');            
        }
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
        
        request.get({
            uri: 'https://api.nutritionix.com/v1_1/search/' + myItemNameA,
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
            var myCalories = Math.floor(parsed['hits'][0]['fields']['nf_calories'])*myItemNumA;
            var myFats = Math.floor(parsed['hits'][0]['fields']['nf_total_fat'])*myItemNumA;
            var myCarbs = Math.floor(parsed['hits'][0]['fields']['nf_total_carbohydrate'])*myItemNumA;
            var myFiber = Math.floor(parsed['hits'][0]['fields']['nf_dietary_fiber'])*myItemNumA;
            var mySugars = Math.floor(parsed['hits'][0]['fields']['nf_sugars'])*myItemNumA;
            var myProtein = Math.floor(parsed['hits'][0]['fields']['nf_protein'])*myItemNumA;

            var d = new Date();
            var utc = d.getTime() + (d.getTimezoneOffset()*60000);
            var timestamp = new Date(utc + (3600000 * (-8)));
            var logTime = "" + timestamp.getDate() + "/"
                + (timestamp.getMonth()+1)  + "/" 
                + timestamp.getFullYear() + " @ "  
                + timestamp.getHours() + ":"  
                + timestamp.getMinutes() + ":" 
                + timestamp.getSeconds();
            var myDay = timestamp.getDate()-18; //special for purposes of hackathon
            var myHourMinute = "" + timestamp.getHours() + ":" + timestamp.getMinutes();
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
                    Day: myDay,
                    HourMinute: myHourMinute,
                    Items: {
                        [myItemNameA]: myItemNumA
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
                    var goalMet = false;

                                        var goals = data.Item.Goals;
                    if (goals[myItemNameA] != undefined) {
                            goals[myItemNameA] = goals[myItemNameA] + 0.01*myItemNumA;
                            if (multiplied >= Math.floor(goals[myItemNameA])) {
                                delete goals[myItemNameA];
                                goalMet = true;
                            }
                    }

                    var updateParams = {
                        TableName: 'User',
                        Key: {
                            Id: 1
                        },
                        UpdateExpression: "set Calories=:c, Fats=:f, Carbs=:b, Fiber=:r, Sugars=:s, Protein=:p, Goals=:g",
                        ExpressionAttributeValues: {
                            ":c":newCalories,
                            ":f":newFats,
                            ":b":newCarbs,
                            ":r":newFiber,
                            ":s":newSugars,
                            ":p":newProtein,
                            ":g":goals
                        }
                    };
                    docClient.update(updateParams).promise().then((data) => {
                        console.log("FINISHED FIRST SET OF ITEMS");
                        /* !!!!!!!!! */
                        request.get({
                            uri: 'https://api.nutritionix.com/v1_1/search/' + myItemNameB,
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

                            var parsed = JSON.parse(body);
    
                            var myCalories = Math.floor(parsed['hits'][0]['fields']['nf_calories'])*myItemNumB;
                            var myFats = Math.floor(parsed['hits'][0]['fields']['nf_total_fat'])*myItemNumB;
                            var myCarbs = Math.floor(parsed['hits'][0]['fields']['nf_total_carbohydrate'])*myItemNumB;
                            var myFiber = Math.floor(parsed['hits'][0]['fields']['nf_dietary_fiber'])*myItemNumB;
                            var mySugars = Math.floor(parsed['hits'][0]['fields']['nf_sugars'])*myItemNumB;
                            var myProtein = Math.floor(parsed['hits'][0]['fields']['nf_protein'])*myItemNumB;

                            var d = new Date();
                            var utc = d.getTime() + (d.getTimezoneOffset()*60000);
                            var timestamp = new Date(utc + (3600000 * (-8)));
                            var logTime = "" + timestamp.getDate() + "/"
                                + (timestamp.getMonth()+1)  + "/" 
                                + timestamp.getFullYear() + " @ "  
                                + timestamp.getHours() + ":"  
                                + timestamp.getMinutes() + ":" 
                                + timestamp.getSeconds();
                                            var myDay = timestamp.getDate()-18; //special for purposes of hackathon
            var myHourMinute = "" + timestamp.getHours() + ":" + timestamp.getMinutes();
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
                                    Day: myDay,
                                    HourMinute: myHourMinute,
                                    Items: {
                                        [myItemNameB]: myItemNumB
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
                                                        var goalMet = false;

                                                        var goals = data.Item.Goals;
                    if (goals[myItemNameB] != undefined) {
                            goals[myItemNameB] = goals[myItemNameB] + 0.01*myItemNumB;
                            if (multiplied >= Math.floor(goals[myItemNameB])) {
                                delete goals[myItemNameB];
                                goalMet = true;
                            }
                    }

                                    var updateParams = {
                                        TableName: 'User',
                                        Key: {
                                            Id: 1
                                        },
                                        UpdateExpression: "set Calories=:c, Fats=:f, Carbs=:b, Fiber=:r, Sugars=:s, Protein=:p, Goals=:g",
                                        ExpressionAttributeValues: {
                                            ":c":newCalories,
                                            ":f":newFats,
                                            ":b":newCarbs,
                                            ":r":newFiber,
                                            ":s":newSugars,
                                            ":p":newProtein,
                                            ":g":goals
                                        }
                                    };
                                    docClient.update(updateParams).promise().then((data) => {
                                        var speechOutput = 'Ok, I logged ' + myItemNumA + ' ' + myItemNameA
                                            + ' and ' + myItemNumB + ' ' + myItemNameB + '. You are now '
                                        var calorieDiff = calorieGoal - newCalories;
                                        if (calorieDiff >= 0) {
                                            speechOutput = speechOutput + calorieDiff + " calories under your goal today.";
                                        } else {
                                            speechOutput = speechOutput + Math.abs(calorieDiff) + " calories over your goal today."
                                        }
                                                                if (goalMet) {
                            speechOutput += ' You also met a quick goal.';
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
                    })
                    .catch((err) => console.log(err));
                })
                .catch((err) => console.log(err));
            })
            .catch((err) => console.log(err));
        });
    },
    'LogSingleItemAndMultipleItemsIntent': function () {
                logAnywaysState = false;

        var myIntent = this.event.request.intent;
        var myItemNumB = parseInt(myIntent.slots.ItemNumberB.value);
        var myItemNameA = myIntent.slots.ItemNameA.value;
        var myItemNumA = 1;
        var myItemNameB = myIntent.slots.ItemNameB.value;

        if (myIntent.slots.ItemNumberB.value == undefined || myItemNameB == undefined || myItemNameA == undefined) {
            this.emit(':tell', 'I am sorry, I did not catch that');            
        }
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
        
        request.get({
            uri: 'https://api.nutritionix.com/v1_1/search/' + myItemNameA,
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
            var myCalories = Math.floor(parsed['hits'][0]['fields']['nf_calories'])*myItemNumA;
            var myFats = Math.floor(parsed['hits'][0]['fields']['nf_total_fat'])*myItemNumA;
            var myCarbs = Math.floor(parsed['hits'][0]['fields']['nf_total_carbohydrate'])*myItemNumA;
            var myFiber = Math.floor(parsed['hits'][0]['fields']['nf_dietary_fiber'])*myItemNumA;
            var mySugars = Math.floor(parsed['hits'][0]['fields']['nf_sugars'])*myItemNumA;
            var myProtein = Math.floor(parsed['hits'][0]['fields']['nf_protein'])*myItemNumA;

            var d = new Date();
            var utc = d.getTime() + (d.getTimezoneOffset()*60000);
            var timestamp = new Date(utc + (3600000 * (-8)));
            var logTime = "" + timestamp.getDate() + "/"
                + (timestamp.getMonth()+1)  + "/" 
                + timestamp.getFullYear() + " @ "  
                + timestamp.getHours() + ":"  
                + timestamp.getMinutes() + ":" 
                + timestamp.getSeconds();
                            var myDay = timestamp.getDate()-18; //special for purposes of hackathon
            var myHourMinute = "" + timestamp.getHours() + ":" + timestamp.getMinutes();
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
                    Day: myDay,
                    HourMinute: myHourMinute,
                    Items: {
                        [myItemNameA]: myItemNumA
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
                    var goalMet = false;

                    var goals = data.Item.Goals;
                    if (goals[myItemNameA] != undefined) {
                            goals[myItemNameA] = goals[myItemNameA] + 0.01*myItemNumA;
                                if (multiplied >= Math.floor(goals[myItemNameA])) {
                                delete goals[myItemNameA];
                                goalMet = true;
                            }
                    }

                    var updateParams = {
                        TableName: 'User',
                        Key: {
                            Id: 1
                        },
                        UpdateExpression: "set Calories=:c, Fats=:f, Carbs=:b, Fiber=:r, Sugars=:s, Protein=:p, Goals=:g",
                        ExpressionAttributeValues: {
                            ":c":newCalories,
                            ":f":newFats,
                            ":b":newCarbs,
                            ":r":newFiber,
                            ":s":newSugars,
                            ":p":newProtein,
                            ":g":goals
                        }
                    };
                    docClient.update(updateParams).promise().then((data) => {
                        console.log("FINISHED FIRST SET OF ITEMS");
                        /* !!!!!!!!! */
                        request.get({
                            uri: 'https://api.nutritionix.com/v1_1/search/' + myItemNameB,
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

                            var parsed = JSON.parse(body);
    
                            var myCalories = Math.floor(parsed['hits'][0]['fields']['nf_calories'])*myItemNumB;
                            var myFats = Math.floor(parsed['hits'][0]['fields']['nf_total_fat'])*myItemNumB;
                            var myCarbs = Math.floor(parsed['hits'][0]['fields']['nf_total_carbohydrate'])*myItemNumB;
                            var myFiber = Math.floor(parsed['hits'][0]['fields']['nf_dietary_fiber'])*myItemNumB;
                            var mySugars = Math.floor(parsed['hits'][0]['fields']['nf_sugars'])*myItemNumB;
                            var myProtein = Math.floor(parsed['hits'][0]['fields']['nf_protein'])*myItemNumB;

                            var d = new Date();
                            var utc = d.getTime() + (d.getTimezoneOffset()*60000);
                            var timestamp = new Date(utc + (3600000 * (-8)));
                            var logTime = "" + timestamp.getDate() + "/"
                                + (timestamp.getMonth()+1)  + "/" 
                                + timestamp.getFullYear() + " @ "  
                                + timestamp.getHours() + ":"  
                                + timestamp.getMinutes() + ":" 
                                + timestamp.getSeconds();
                                            var myDay = timestamp.getDate()-18; //special for purposes of hackathon
            var myHourMinute = "" + timestamp.getHours() + ":" + timestamp.getMinutes();
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
                                    Day: myDay,
                                    HourMinute: myHourMinute,
                                    Items: {
                                        [myItemNameB]: myItemNumB
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
                    var goalMet = false;

                                                        var goals = data.Item.Goals;
                    if (goals[myItemNameB] != undefined) {
                            goals[myItemNameB] = goals[myItemNameB] + 0.01*myItemNumB;
                                                        if (multiplied >= Math.floor(goals[myItemNameB])) {
                                delete goals[myItemNameB];
                                goalMet = true;
                            }
                    }

                                    var updateParams = {
                                        TableName: 'User',
                                        Key: {
                                            Id: 1
                                        },
                                        UpdateExpression: "set Calories=:c, Fats=:f, Carbs=:b, Fiber=:r, Sugars=:s, Protein=:p, Goals=:g",
                                        ExpressionAttributeValues: {
                                            ":c":newCalories,
                                            ":f":newFats,
                                            ":b":newCarbs,
                                            ":r":newFiber,
                                            ":s":newSugars,
                                            ":p":newProtein,
                                            ":g":goals
                                        }
                                    };
                                    docClient.update(updateParams).promise().then((data) => {
                                        var speechOutput = 'Ok, I logged ' + myItemNumA + ' ' + myItemNameA
                                            + ' and ' + myItemNumB + ' ' + myItemNameB + '. You are now '
                                        var calorieDiff = calorieGoal - newCalories;
                                        if (calorieDiff >= 0) {
                                            speechOutput = speechOutput + calorieDiff + " calories under your goal today.";
                                        } else {
                                            speechOutput = speechOutput + Math.abs(calorieDiff) + " calories over your goal today."
                                        }
                                                                if (goalMet) {
                            speechOutput += ' You also met a quick goal.';
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
                    })
                    .catch((err) => console.log(err));
                })
                .catch((err) => console.log(err));
            })
            .catch((err) => console.log(err));
        });
    },
    'LogSingleItemAndSingleItemIntent': function () {
                logAnywaysState = false;

        var myIntent = this.event.request.intent;
        var myItemNumB = 1;
        var myItemNameA = myIntent.slots.ItemNameA.value;
        var myItemNumA = 1;
        var myItemNameB = myIntent.slots.ItemNameB.value;

        if (myItemNameB == undefined || myItemNameA == undefined) {
            this.emit(':tell', 'I am sorry, I did not catch that');            
        }
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
        
        request.get({
            uri: 'https://api.nutritionix.com/v1_1/search/' + myItemNameA,
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
            var myCalories = Math.floor(parsed['hits'][0]['fields']['nf_calories'])*myItemNumA;
            var myFats = Math.floor(parsed['hits'][0]['fields']['nf_total_fat'])*myItemNumA;
            var myCarbs = Math.floor(parsed['hits'][0]['fields']['nf_total_carbohydrate'])*myItemNumA;
            var myFiber = Math.floor(parsed['hits'][0]['fields']['nf_dietary_fiber'])*myItemNumA;
            var mySugars = Math.floor(parsed['hits'][0]['fields']['nf_sugars'])*myItemNumA;
            var myProtein = Math.floor(parsed['hits'][0]['fields']['nf_protein'])*myItemNumA;

            var d = new Date();
            var utc = d.getTime() + (d.getTimezoneOffset()*60000);
            var timestamp = new Date(utc + (3600000 * (-8)));
            var logTime = "" + timestamp.getDate() + "/"
                + (timestamp.getMonth()+1)  + "/" 
                + timestamp.getFullYear() + " @ "  
                + timestamp.getHours() + ":"  
                + timestamp.getMinutes() + ":" 
                + timestamp.getSeconds();
                            var myDay = timestamp.getDate()-18; //special for purposes of hackathon
            var myHourMinute = "" + timestamp.getHours() + ":" + timestamp.getMinutes();
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
                    Day: myDay,
                    HourMinute: myHourMinute,
                    Items: {
                        [myItemNameA]: myItemNumA
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
                    var goalMet = false;

                                        var goals = data.Item.Goals;
                    if (goals[myItemNameA] != undefined) {
                            goals[myItemNameA] = goals[myItemNameA] + 0.01*myItemNumA;
                                                        if (multiplied >= Math.floor(goals[myItemNameA])) {
                                delete goals[myItemNameA];
                                goalMet = true;
                            }
                    }

                    var updateParams = {
                        TableName: 'User',
                        Key: {
                            Id: 1
                        },
                        UpdateExpression: "set Calories=:c, Fats=:f, Carbs=:b, Fiber=:r, Sugars=:s, Protein=:p, Goals=:g",
                        ExpressionAttributeValues: {
                            ":c":newCalories,
                            ":f":newFats,
                            ":b":newCarbs,
                            ":r":newFiber,
                            ":s":newSugars,
                            ":p":newProtein,
                            ":g":goals
                        }
                    };
                    docClient.update(updateParams).promise().then((data) => {
                        console.log("FINISHED FIRST SET OF ITEMS");
                        /* !!!!!!!!! */
                        request.get({
                            uri: 'https://api.nutritionix.com/v1_1/search/' + myItemNameB,
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

                            var parsed = JSON.parse(body);
    
                            var myCalories = Math.floor(parsed['hits'][0]['fields']['nf_calories'])*myItemNumB;
                            var myFats = Math.floor(parsed['hits'][0]['fields']['nf_total_fat'])*myItemNumB;
                            var myCarbs = Math.floor(parsed['hits'][0]['fields']['nf_total_carbohydrate'])*myItemNumB;
                            var myFiber = Math.floor(parsed['hits'][0]['fields']['nf_dietary_fiber'])*myItemNumB;
                            var mySugars = Math.floor(parsed['hits'][0]['fields']['nf_sugars'])*myItemNumB;
                            var myProtein = Math.floor(parsed['hits'][0]['fields']['nf_protein'])*myItemNumB;

                            var d = new Date();
                            var utc = d.getTime() + (d.getTimezoneOffset()*60000);
                            var timestamp = new Date(utc + (3600000 * (-8)));
                            var logTime = "" + timestamp.getDate() + "/"
                                + (timestamp.getMonth()+1)  + "/" 
                                + timestamp.getFullYear() + " @ "  
                                + timestamp.getHours() + ":"  
                                + timestamp.getMinutes() + ":" 
                                + timestamp.getSeconds();
                                            var myDay = timestamp.getDate()-18; //special for purposes of hackathon
            var myHourMinute = "" + timestamp.getHours() + ":" + timestamp.getMinutes();
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
                                    Day: myDay,
                                    HourMinute: myHourMinute,
                                    Items: {
                                        [myItemNameB]: myItemNumB
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
                    var goalMet = false;

                                                        var goals = data.Item.Goals;
                    if (goals[myItemNameB] != undefined) {
                            goals[myItemNameB] = goals[myItemNameB] + 0.01*myItemNumB;
                                                        if (multiplied >= Math.floor(goals[myItemNameB])) {
                                delete goals[myItemNameB];
                                goalMet = true;
                            }
                    }

                                    var updateParams = {
                                        TableName: 'User',
                                        Key: {
                                            Id: 1
                                        },
                                        UpdateExpression: "set Calories=:c, Fats=:f, Carbs=:b, Fiber=:r, Sugars=:s, Protein=:p, Goals=:g",
                                        ExpressionAttributeValues: {
                                            ":c":newCalories,
                                            ":f":newFats,
                                            ":b":newCarbs,
                                            ":r":newFiber,
                                            ":s":newSugars,
                                            ":p":newProtein,
                                            ":g":goals
                                        }
                                    };
                                    docClient.update(updateParams).promise().then((data) => {
                                        var speechOutput = 'Ok, I logged ' + myItemNumA + ' ' + myItemNameA
                                            + ' and ' + myItemNumB + ' ' + myItemNameB + '. You are now '
                                        var calorieDiff = calorieGoal - newCalories;
                                        if (calorieDiff >= 0) {
                                            speechOutput = speechOutput + calorieDiff + " calories under your goal today.";
                                        } else {
                                            speechOutput = speechOutput + Math.abs(calorieDiff) + " calories over your goal today."
                                        }
                                                                if (goalMet) {
                            speechOutput += ' You also met a quick goal.';
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
                    })
                    .catch((err) => console.log(err));
                })
                .catch((err) => console.log(err));
            })
            .catch((err) => console.log(err));
        });
    },
    'ShouldIEatIntent': function () {
        var myIntent = this.event.request.intent;
        var myItemName = myIntent.slots.ItemName.value;

        if (myItemName == undefined) {
            this.emit(':tell', 'I am sorry, I do not know what that is');
        }
        savedItemName = myItemName;

        request.get({
            uri: 'https://api.nutritionix.com/v1_1/search/' + myItemName,
            qs: {
                appId: '27d56daa',
                appKey: '801497a4013af4e17085d5d46e305d0e',
                fields: 'item_name,item_id,brand_name,nf_calories,nf_total_fat,nf_dietary_fiber,nf_sugars,nf_protein,nf_total_carbohydrate'
            }
        }, (err, response, body) => {
            var parsed = JSON.parse(body);
    
            var myCalories = Math.floor(parsed['hits'][0]['fields']['nf_calories']);

            var getParams = {
                TableName: "User",
                Key: {
                    Id: 1
                }
            };

            AWS.config.update({
                region: "us-east-1",
                endpoint: 'http://dynamodb.us-east-1.amazonaws.com',
                accessKeyId: 'AKIAJKTVMITXX54WN63A',
                secretAccessKey: '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'
            });

            var docClient = new AWS.DynamoDB.DocumentClient();           

            docClient.get(getParams).promise().then((data) => {
                var calorieGoal = data.Item.CalorieGoal;
                var oldCalories = data.Item.Calories;

                var calorieDiff = oldCalories - calorieGoal;
                if (calorieDiff >= 0) {
                    var speechOutput = 'I would not recommend it, as you are ' + calorieDiff + ' over your daily calorie goal.';
                    speechOutput += ' Would you like to log the ' + myItemName + ' anyways?';
                    var reprompt = 'Would you like to log the ' + myItemName + ' anyways?';
                    logAnywaysState = true;
                    this.emit(':ask', speechOutput, reprompt);
                }
                else if (oldCalories + myCalories < calorieGoal) {
                    var newDiff = calorieGoal - oldCalories - myCalories;
                    var speechOutput = 'Sure, you will still be ' + newDiff + ' calories under your daily goal.';
                    speechOutput += ' Would you like to log the ' + myItemName + '?';
                    var reprompt = 'Would you like to log the ' + myItemName + '?';
                    logAnywaysState = true;
                    this.emit(':ask', speechOutput, reprompt);
                } else {
                    var newDiff = oldCalories + myCalories - calorieGoal;
                    var speechOutput = 'Sure, but keep in mind you will be ' + newDiff + ' calories over your daily goal afterwards.';
                    speechOutput += ' Would you like to log the ' + myItemName + '?';
                    var reprompt = 'Would you like to log the ' + myItemName + '?';
                    logAnywaysState = true;
                    this.emit(':ask', speechOutput, reprompt);
                }

            })
            .catch((err) => console.log(err));
        });
    },
    'YesIntent': function () {
        if (!logAnywaysState) {
            this.emit(':tell', 'I am sorry, I do not understand.');
        }
        logAnywaysState = false;
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
        var myItemName = savedItemName;
        if (myItemName == undefined) {
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
                            var myDay = timestamp.getDate()-18; //special for purposes of hackathon
            var myHourMinute = "" + timestamp.getHours() + ":" + timestamp.getMinutes();
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
                    Day: myDay,
                    HourMinute: myHourMinute,
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
                    var goalMet = false;

                                        var goals = data.Item.Goals;
                    if (goals[myItemName] != undefined) {
                            goals[myItemName] = goals[myItemName] + 0.01;
                                                        if (multiplied >= Math.floor(goals[myItemName])) {
                                delete goals[myItemName];
                                goalMet = true;
                            }
                    }

                    var updateParams = {
                        TableName: 'User',
                        Key: {
                            Id: 1
                        },
                        UpdateExpression: "set Calories=:c, Fats=:f, Carbs=:b, Fiber=:r, Sugars=:s, Protein=:p, Goals=:g",
                        ExpressionAttributeValues: {
                            ":c":newCalories,
                            ":f":newFats,
                            ":b":newCarbs,
                            ":r":newFiber,
                            ":s":newSugars,
                            ":p":newProtein,
                            ":g":goals
                        }
                    };
                    docClient.update(updateParams).promise().then((data) => {
                        var speechOutput = 'Ok, I logged the ' + myItemName + '.';
                                                if (goalMet) {
                            speechOutput += ' You also met a quick goal.';
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
    'MakeQuickGoalIntent': function () {
        var myIntent = this.event.request.intent;
        var myItemName = myIntent.slots.ItemName.value;
        var myItemNum = parseInt(myIntent.slots.ItemNumber.value);

        if (myItemName == undefined || myIntent.slots.ItemNumber.value == undefined) {
            this.emit(':tell', 'I am sorry, I do not know what that is')            
        }

        var getParams = {
            TableName: "User",
            Key: {
                Id: 1
            }
        };

        AWS.config.update({
            region: "us-east-1",
            endpoint: 'http://dynamodb.us-east-1.amazonaws.com',
            accessKeyId: 'AKIAJKTVMITXX54WN63A',
            secretAccessKey: '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'
        });

            var docClient = new AWS.DynamoDB.DocumentClient();           

            docClient.get(getParams).promise().then((data) => {

                var myMap = data.Item.Goals;
                myMap[myItemName] = myItemNum;

                var updateParams = {
                    TableName: 'User',
                    Key: {
                        Id: 1
                    },
                    UpdateExpression: "set Goals=:g",
                    ExpressionAttributeValues: {
                        ":g":myMap,
                    }
                };
                docClient.update(updateParams).promise().then((data) => {
                    var speechOutput = 'Ok, a new quick goal was set this week for ' + myItemNum + ' ' + myItemName + '.';
                    speechOutput += ' Anything else?';
                    var reprompt = 'Anything else?';
                    this.emit(':ask', speechOutput, reprompt);
                })
                .catch((err) => console.log(err));        

            })
            .catch((err) => console.log(err));        
    },
    'GetWaterIntent': function () {
        var getParams = {
            TableName: "User",
            Key: {
                Id: 1
            }
        };

        AWS.config.update({
            region: "us-east-1",
            endpoint: 'http://dynamodb.us-east-1.amazonaws.com',
            accessKeyId: 'AKIAJKTVMITXX54WN63A',
            secretAccessKey: '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'
        });

        var docClient = new AWS.DynamoDB.DocumentClient();
        docClient.get(getParams).promise().then((data) => {

                var w = data.Item.Water;
                var newW = w + 10;

                var updateParams = {
                    TableName: 'User',
                    Key: {
                        Id: 1
                    },
                    UpdateExpression: "set Water=:w",
                    ExpressionAttributeValues: {
                        ":w":newW,
                    }
                };
                docClient.update(updateParams).promise().then((data) => {
                    var speechOutput = 'You have consumed ' + w + ' millileters of water today.';
                    speechOutput += ' Anything else?';
                    var reprompt = 'Anything else?';
                    this.emit(':ask', speechOutput, reprompt);
                })
                .catch((err) => console.log(err));        

            })
            .catch((err) => console.log(err));   
    },
    'HealthyOptionIntent': function () {
        logAnywaysState = false;
        var speechOutput = 'Today\'s healthy suggestions are grilled chicken breast and kale.';
        this.emit(':tell', speechOutput);
    }
};




