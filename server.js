// Server-side code
/* jshint node: true, curly: true, eqeqeq: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, nonew: true, quotmark: double, strict: true, undef: true, unused: true */

"use strict";

var express = require("express"),
    http = require("http"),
    app = express(),
    bodyParser = require("body-parser"),
    mongodb = require("mongodb"), //require the mongodb module
    mongodbClient = mongodb.MongoClient, //create a client to connect to mongo
    output_url, collection, key, value, item,
    base_url = "http://localhost:3000/";

// configure the app to use the client directory for static files
app.use(express.static(__dirname + "/client"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

//connect to mongodb
function connect(process, url, res) {
    var mongoUrl = "mongodb://localhost/shorturl";
    mongodbClient.connect(mongoUrl, function(err, db) {
        if(err) {
            return console.dir(err);
        }
        collection = db.collection("url");
        process(collection, url, res);
    });
}

//http://blog.tompawlak.org/how-to-generate-random-values-nodejs-javascript
function randomIntInc (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}

//generate short URL
function randomURL () {
    key = 10*Math.pow(36,3) + Math.floor((Math.random() * 10 + 1)) * randomIntInc(0,35);
    value = key.toString(36);
    return (base_url + value);
}

//add URLs to mongodb
function addDB (collection, input_url, res) { 
    output_url = randomURL();
    item = {long: input_url, short: output_url, count: 0};
    collection.insert(item, {w:1}, function(err, result) {
        if(!err) {
            res.json({"result":output_url});
        }
    }); 
}

//when a long URL is entered, create a new shortened URL
function shortenURL (collection, url, res) {
    // if a shortened URL is entered, display the original long URL
    if (url.indexOf(base_url) > -1) {
        collection.findOne({short:url}, function(err, item) {
            if(!err) {
                if (item !== null) {
                    res.json({"result":item.long});
                } else {
                    res.json({"result":"short URL not found"});
                }
            }
        });
    } else {
        // if long URL exists, display short URL
        collection.findOne({long:url}, function(err, item) {
            if(!err) {
                if (item !== null) {
                    res.json({"result":item.short});
                } else {
                    connect(addDB, url, res);
                }
            }
        });
    }
}

//when a long URL is entered, create a new shortened URL
app.post("/shorten", function (req, res) {
    var urlinfo = req.body.url;
    connect(shortenURL, urlinfo, res);
});

//get top ten popular shortened URLs
function top10 (collection, url, res) {
    collection.aggregate([{$sort:{count: -1}},{$limit:10}], function(err, topten) {
        if (topten !== null) {
            res.json(topten);
        }
    });
}

//get top ten popular shortened URLs
app.get("/top10", function (req, res) {
    connect(top10, 0, res);
});

//redirect short URL
function redirectURL (collection, url, res) { 
    collection.findOne({short:url}, function(err, item) {
        if(!err) {
            if (item !== null) {
                collection.update({short:url},{$inc:{count:1}});
                res.redirect(item.long);
            } else {
                res.redirect(base_url);
            }
        }
    });
}

//redirect short URL
app.get("/*", function (req, res) {
    var redirect=base_url + req.param(0);
    connect(redirectURL, redirect, res);
});

//create the Express-powered HTTP server and have it listen
http.createServer(app).listen(3000);
console.log("Server is listening on port 3000");