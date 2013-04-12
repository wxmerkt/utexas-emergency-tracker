
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , request = require('request')
  , parseString = require('xml2js').parseString
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  //app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

var url = "http://www.utexas.edu/emergency/status.xml";

app.get('/', function(req, res){ 
  getStatus(function(result) {
    var color = (result.statuslvl == 2) ? "orange" : "white"; /* unknown so far whether LARGER equals more dangerous or less */
    res.render('index', {result: result, bgcolor: color});
  });
});

function getStatus(callback) {
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      parseString(body, function (err, result) {
        var ret = new Object();
        ret.title = result.rss.channel[0].title[0];
        ret.pubDate = result.rss.channel[0].pubDate[0];
        ret.statuslvl = result.rss.channel[0].item[0].$['ut:status'];
        ret.statustitle = result.rss.channel[0].item[0].title[0];
        ret.statusdesc = result.rss.channel[0].item[0].description[0]._;
        ret.link = result.rss.channel[0].item[0].link[0];
        callback(ret);
      });
    }
  })
};

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});