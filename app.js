
/**
 * Module dependencies.
 */

var app = require('express')()
  , express = require('express')
  , server = require('http').Server(app)
  , request = require('request')
  , parseString = require('xml2js').parseString
  , parseCookie = express.cookieParser
  , MemoryStore = express.session.MemoryStore
  , sessionStore = new MemoryStore()
  , path = require('path');

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
  app.use(express.cookieParser());
  app.use(express.session({store: sessionStore
    , secret: 'secret'
    , key: 'express.sid'}));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

var url = "http://www.utexas.edu/emergency/status.xml";

/* Setup socket.io */
/*var io = require('socket.io');;//(server);
var sio = io.listen(server);*/

/* cookie: the cookie string from the request headers
 * sid: the session 'key' used with express.session()
 * secret: the session 'secret' used with express.session()
 */
/*function parseSessionCookie(cookie, sid, secret) {
  var cookies = require('express/node_modules/cookie').parse(cookie)
    , parsed = require('express/node_modules/connect/lib/utils').parseSignedCookies(cookies, secret);
  return parsed[sid] || null;
}

sio.set('authorization', function(data, accept) {
  var sid = parseSessionCookie(data.headers.cookie, 'express.sid', 'secret');
  if (sid) {
    sessionStore.get(sid, function(err, session) {
      if (err || !session) {
        accept('Error', false);
      } else {
        data.session = session;
        accept(null, true);
      }
    });
  } else {
    return accept('No cookie transmitted.', false);
  }
}); 

sio.sockets.on('connection', function (socket) {
    var hs = socket.handshake;
    console.log('A socket with sessionID ' + hs.sessionID 
        + ' connected!');
    // setup an inteval that will keep our session fresh
    var intervalID = setInterval(function () {
        // reload the session (just in case something changed,
        // we don't want to override anything, but the age)
        // reloading will also ensure we keep an up2date copy
        // of the session with our connection.
        hs.session.reload( function () { 
            // "touch" it (resetting maxAge and lastAccess)
            // and save it back again.
            hs.session.touch().save();
        });
    }, 60 * 1000);
    socket.on('disconnect', function () {
        console.log('A socket with sessionID ' + hs.sessionID 
            + ' disconnected!');
        // clear the socket interval to stop refreshing the session
        clearInterval(intervalID);
    });
 
});*/

app.get('/', function(req, res){ 
  getStatus(function(result) {
    var color = (result.statuslvl <= 1) ? "green" : "white";
    var color = (result.statuslvl == 2) ? "orange" : color;
    var favicon = "white";
    favicon = (result.statuslvl <= 1) ? "green" : favicon;
    favicon = (result.statuslvl == 2) ? "orange" : favicon;
    favicon = (result.statuslvl > 2) ? "red" : favicon;
    res.render('index', {result: result, bgcolor: color, favicon: favicon});
  });
});

app.get('/favicon.ico', function(req, res) {
  getStatus(function(result) {
    var favicon = "white";
    favicon = (result.statuslvl <= 1) ? "green" : favicon;
    favicon = (result.statuslvl == 2) ? "orange" : favicon;
    favicon = (result.statuslvl > 2) ? "red" : favicon;

    res.redirect('/images/'+favicon+'.ico');
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

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});