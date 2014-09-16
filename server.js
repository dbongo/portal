var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var crypto = require('crypto');
var bcrypt = require('bcryptjs');
var mongoose = require('mongoose');
var jwt = require('jwt-simple');
var moment = require('moment');
var async = require('async');
var request = require('request');
var xml2js = require('xml2js');
var agenda = require('agenda')({ db: { address: 'localhost:27017/test' } });
var sugar = require('sugar');
var nodemailer = require('nodemailer');
var _ = require('lodash');

var tokenSecret = 'your unique secret';

var userSchema = new mongoose.Schema({
  username: { type: String, unique: true, trim: true, required: true },
  email: { type: String, unique: true, lowercase: true, trim: true },
  password: String,
  facebook: {
    id: String,
    email: String
  },
  google: {
    id: String,
    email: String
  }
});

userSchema.pre('save', function(next) {
  var user = this;
  if (!user.isModified('password')) return next();
  bcrypt.genSalt(10, function(err, salt) {
    if (err) return next(err);
    bcrypt.hash(user.password, salt, function(err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

var User = mongoose.model('User', userSchema);

mongoose.connect('localhost');

var app = express();

app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

function ensureAuthenticated(req, res, next) {
  if (req.headers.authorization) {
    var token = req.headers.authorization.split(' ')[1];
    try {
      var decoded = jwt.decode(token, tokenSecret);
      if (decoded.exp <= Date.now()) {
        res.status(400).send('Access token has expired');
      } else {
        req.user = decoded.user;
        return next();
      }
    } catch (err) {
      return res.status(500).send('Error parsing token');
    }
  } else {
    return res.status(401).end();
  }
}

function createJwtToken(user) {
  var payload = {
    user: user,
    iat: new Date().getTime(),
    exp: moment().add(7, 'days').valueOf()
  };
  return jwt.encode(payload, tokenSecret);
}

app.post('/auth/signup', function(req, res, next) {
  var user = new User({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password
  });
  user.save(function(err) {
    if (err) return next(err);
    res.status(200).end();
  });
});

app.post('/auth/login', function(req, res, next) {
  User.findOne({ email: req.body.email }, function(err, user) {
    if (!user) return res.status(401).send('User does not exist');
    user.comparePassword(req.body.password, function(err, isMatch) {
      if (!isMatch) return res.status(401).send('Invalid email and/or password');
      var token = createJwtToken(user);
      res.send({token: token});
    });
  });
});

app.get('/api/users', function(req, res, next) {
  if (!req.query.email) return res.status(400).send({message: 'Email parameter is required.'});
  User.findOne({email: req.query.email}, function(err, user) {
    if (err) return next(err);
    res.send({available: !user});
  });
});

app.get('*', function(req, res) {
  res.redirect('/#' + req.originalUrl);
});

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send({message: err.message});
});

app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});
