var http = require('http'),
    path = require('path'),
    methods = require('methods'),
    express = require('express'),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    errorhandler = require('errorhandler'),
    mongoose = require('mongoose');

var isProduction = process.env.NODE_ENV === 'production';

// Create global app object
var app = express();

app.use(cors());

// Normal express config defaults
app.use(require('morgan')('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(require('method-override')());
app.use(express.static(__dirname + '/public'));


if (!isProduction) {
  app.use(errorhandler());
}

if(isProduction){
  mongoose.connect('mongodb://admin:admin_123@cluster0-shard-00-00-w58yo.mongodb.net:27017,cluster0-shard-00-01-w58yo.mongodb.net:27017,cluster0-shard-00-02-w58yo.mongodb.net:27017/Product?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true');
} else {
  mongoose.connect('mongodb://admin:admin_123@cluster0-shard-00-00-w58yo.mongodb.net:27017,cluster0-shard-00-01-w58yo.mongodb.net:27017,cluster0-shard-00-02-w58yo.mongodb.net:27017/Product?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true');
  mongoose.set('debug', true);
}

// require('./models/User');

app.use(require('./routes'));

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (!isProduction) {
  app.use(function(err, req, res, next) {
    console.log(err.stack);

    res.status(err.status || 500);

    res.json({'errors': {
      message: err.message,
      error: err
    }});
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({'errors': {
    message: err.message,
    error: {}
  }});
});

// finally, let's start our server...
var server = app.listen( process.env.PORT || 3000, function(){
  console.log('Listening on port ' + server.address().port);
});
