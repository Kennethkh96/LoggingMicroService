import * as Express from 'express';
let app = Express();
import * as BodyParser from 'body-parser';
import * as Fs from 'fs';

app.set('port', (process.env.PORT || 3000));

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({extended: true}));

let log = JSON.parse( Fs.readFileSync(__dirname + '/log.txt').toString());

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/documentation.html');
});

app.post('/api/log', (req, res) => {
    let info = req.body.information;
    let api_key = req.body.api_key;

    if (info === undefined)
    {
        res.status(400).send("information is required");
        return;
    }
    if (log[api_key] === undefined)
    {
        res.status(400).send("api key is not valid");
        return;
    }
    
    let logObj = {
        Info: info,
        Time: new Date()
    }
    log[api_key].push(logObj);
    
    SaveLog();

    res.status(200).send("saved");
});

app.get('/api/log', (req, res) => {
    let api_key = req.query.api_key;
    let hour = req.query.hour;
    let day = req.query.day;
    let week = req.query.week;

    if (log[api_key] === undefined)
    {
        res.status(400).send("api key is not valid");
        return;
    }

    let logElements = log[api_key].slice(1);

    let logObjs = [];
    const date = new Date();
    let DateToCheck = new Date();

    if (hour)
    {
        let before = new Date();
        before.setHours(date.getHours() - 1);
        logObjs = GetLogObjects(logElements, before);
    }
    else if (day)
    {
        let before = new Date();
        before.setDate(date.getDate() - 1);
        logObjs = GetLogObjects(logElements, before);
    }
    else if (week)
    {

        let before = new Date();
        before.setDate(date.getDate() - 7);
        logObjs = GetLogObjects(logElements, before);
    }

    res.status(200).json(logObjs);
});

function GetLogObjects(objs: any, before: Date)
{
    let returnArr = [];
    let date = new Date();
    for (let index = 0; index < objs.length; index++) {
        let elem = objs[index];
        let elemDate = new Date(elem.Time);
        if (elemDate > before && elemDate < date)
        {
            returnArr.push(elem);
        }
    }

    return returnArr;
}

app.get('/new_api_key', (req, res) => {
    let owner = req.query.owner;

    if (owner === undefined)
        res.status(200).send();
 
    let key = GenerateApiKey();

    while (log[key] !== undefined)
    {
        key = GenerateApiKey();
    }

    log[key] =[
        {
            Information: owner,
            Time: new Date()
        }
    ]

    SaveLog();
    res.send(key);
});

function SaveLog()
{
    Fs.writeFileSync(__dirname + "/log.txt", JSON.stringify(log, null, 4));
}

function GenerateApiKey(): string
{
    let key = generateRandomString(10) + '-' +  generateRandomString(10) + '-' +  generateRandomString(10);
    return key;
}

function generateRandomString(length: any) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

app.listen(app.get('port'), () => {console.log(`listening on port ${app.get('port')}...`)});