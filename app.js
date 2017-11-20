"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Express = require("express");
var app = Express();
var BodyParser = require("body-parser");
var Fs = require("fs");
var amqp = require("amqplib/callback_api");
app.set('port', (process.env.PORT || 3000));
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));
var log = JSON.parse(Fs.readFileSync(__dirname + '/log.txt').toString());
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/documentation.html');
});
amqp.connect('amqp://1doFhxuC:WGgk9kXy_wFIFEO0gwB_JiDuZm2-PrlO@black-ragwort-810.bigwig.lshift.net:10802/SDU53lDhKShK', function (err, conn) {
    conn.createChannel(function (err, ch) {
        var q = 'logging';
        ch.assertQueue(q, { durable: true });
        ch.consume(q, function (data) {
            Logging(data);
        }, { noAck: true });
    });
});
function Logging(data) {
    var info = data.info;
    var api_key = data.api_key;
    var logObj = {
        Info: info,
        Time: new Date()
    };
    log[api_key].push(logObj);
    SaveLog();
}
app.post('/api/log', function (req, res) {
    var info = req.body.information;
    var api_key = req.body.api_key;
    if (info === undefined) {
        res.status(400).send("information is required");
        return;
    }
    if (log[api_key] === undefined) {
        res.status(400).send("api key is not valid");
        return;
    }
    var logObj = {
        Info: info,
        Time: new Date()
    };
    log[api_key].push(logObj);
    SaveLog();
    res.status(200).send("saved");
});
app.get('/api/log', function (req, res) {
    var api_key = req.query.api_key;
    var hour = req.query.hour;
    var day = req.query.day;
    var week = req.query.week;
    if (log[api_key] === undefined) {
        res.status(400).send("api key is not valid");
        return;
    }
    var logElements = log[api_key].slice(1);
    var logObjs = [];
    var date = new Date();
    var DateToCheck = new Date();
    if (hour) {
        var before = new Date();
        before.setHours(date.getHours() - 1);
        logObjs = GetLogObjects(logElements, before);
    }
    else if (day) {
        var before = new Date();
        before.setDate(date.getDate() - 1);
        logObjs = GetLogObjects(logElements, before);
    }
    else if (week) {
        var before = new Date();
        before.setDate(date.getDate() - 7);
        logObjs = GetLogObjects(logElements, before);
    }
    res.status(200).json(logObjs);
});
function GetLogObjects(objs, before) {
    var returnArr = [];
    var date = new Date();
    for (var index = 0; index < objs.length; index++) {
        var elem = objs[index];
        var elemDate = new Date(elem.Time);
        if (elemDate > before && elemDate < date) {
            returnArr.push(elem);
        }
    }
    return returnArr;
}
app.get('/new_api_key', function (req, res) {
    var owner = req.query.owner;
    if (owner === undefined)
        res.status(200).send();
    var key = GenerateApiKey();
    while (log[key] !== undefined) {
        key = GenerateApiKey();
    }
    log[key] = [
        {
            Information: owner,
            Time: new Date()
        }
    ];
    SaveLog();
    res.send(key);
});
function SaveLog() {
    Fs.writeFileSync(__dirname + "/log.txt", JSON.stringify(log, null, 4));
}
function GenerateApiKey() {
    var key = generateRandomString(10) + '-' + generateRandomString(10) + '-' + generateRandomString(10);
    return key;
}
function generateRandomString(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
;
app.listen(app.get('port'), function () { console.log("listening on port " + app.get('port') + "..."); });
