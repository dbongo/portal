'use strict';

var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    passport = require('passport');

// Create user
exports.create = function (req, res, next) {
  var newUser = new User(req.body);
  newUser.provider = 'local';
  newUser.save(function(err) {
    if (err) return res.status(400).json(err);
    req.logIn(newUser, function(err) {
      if (err) return next(err);
      return res.json(req.user.userInfo);
    });
  });
};

// Get profile of specified user
exports.show = function (req, res, next) {
  var userId = req.params.id;
  User.findById(userId, function (err, user) {
    if (err) return next(err);
    if (!user) return res.status(404).end();
    res.send({profile: user.profile});
  });
};

// Change password
exports.changePassword = function(req, res, next) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);
  User.findById(userId, function (err, user) {
    if(user.authenticate(oldPass)) {
      user.password = newPass;
      user.save(function(err) {
        if (err) return res.status(400).end();
        res.status(200).end();
      });
    } else {
      res.status(403).end();
    }
  });
};

// Get current user
exports.me = function(req, res) {
  res.json(req.user || null);
};
