var express = require('express');
var app = express();
var path = require('path');
var http = require('http'), fs = require('fs');
var jf = require('jsonfile')
var util = require('util') 


app.use(express.static('public'));


var lookup = {};

var dataLoaded = function(myData){
  myData.data.forEach(function (el, i, arr) {
      lookup[el.rapper] = el.data;
  });
  console.log("finish lookup");
};

var loadData = function() {
  console.log("load our data");
  var file = 'data.json'
  jf.readFile(file, function(err, obj) {
    console.log("finished loading data");
    dataLoaded(obj);
  });
};


loadData();


app.get('/', function(req, res) {
	res.json({sendData: ""})
});


app.get('/biggie', function(req, res) {
    res.json({sendData: lookup['/biggie']})
});

app.get('/krsone', function(req, res) {
    res.json({sendData: lookup['/krsone']})
});

app.get('/drake', function(req, res) {
  res.json({sendData: lookup['/drake']})
});

app.get('/kanye', function(req, res) {
  res.json({sendData: lookup['/kanye']})
});

app.get('/kendrick', function(req, res) {
  res.json({sendData: lookup['/kendrick']})
});

app.get('/lilwayne', function(req, res) {
  res.json({sendData: lookup['/lilwayne']})
});

app.get('/missyelliot', function(req, res) {
  res.json({sendData: lookup['/missyelliot']})
});

app.get('/nas', function(req, res) {
  res.json({sendData: lookup['/nas']})
});

app.get('/nicki', function(req, res) {
  res.json({sendData: lookup['/nicki']})
});

app.get('/publicenemy', function(req, res) {
  res.json({sendData: lookup['/publicenemy']})
});

app.get('/queenlatifah', function(req, res) {
  res.json({sendData: lookup['/queenlatifah']})
});

app.get('/rakim', function(req, res) {
  res.json({sendData: lookup['/rakim']})
});

app.get('/jayz', function(req, res) {
  res.json({sendData: lookup['/jayz']})
});


app.listen(8080, function() {
    console.log('Magic on 8080. Ctrl+C to terminate.');
});
