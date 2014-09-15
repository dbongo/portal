'use strict';

var mongoose = require('mongoose'),
Schema = mongoose.Schema,
crypto = require('crypto');

var authTypes = ['twitter', 'facebook', 'google'];

// User Schema
var UserSchema = new Schema({
  name: String,
  email: { type: String, lowercase: true },
  role: { type: String, default: 'user' },
  hashedPassword: String,
  provider: String,
  salt: String,
  facebook: {},
  twitter: {},
  google: {}
});


UserSchema.virtual('password')
.set(function(password) {
  this._password = password;
  this.salt = this.makeSalt();
  this.hashedPassword = this.encryptPassword(password);
})
.get(function() {
  return this._password;
});


// Basic info to identify the current authenticated user in the lib
UserSchema.virtual('userInfo')
.get(function() {
  return {
    'name': this.name,
    'role': this.role,
    'provider': this.provider
  };
});


// Public profile information
UserSchema.virtual('profile')
.get(function() {
  return {
    'name': this.name,
    'role': this.role
  };
});


// Validate empty email
UserSchema.path('email')
.validate(function(email) {
  if (authTypes.indexOf(this.provider) !== -1) return true;
  return email.length;
}, 'Email cannot be blank');


// Validate empty password
UserSchema.path('hashedPassword')
.validate(function(hashedPassword) {
  if (authTypes.indexOf(this.provider) !== -1) return true;
  return hashedPassword.length;
}, 'Password cannot be blank');


// Validate email is not taken
UserSchema.path('email')
.validate(function(value, respond) {
  var self = this;
  this.constructor.findOne({email: value}, function(err, user) {
    if(err) throw err;
    if(user) {
      if(self.id === user.id) return respond(true);
      else return respond(false);
    }
    respond(true);
  });
}, 'The specified email address is already in use.');


var validatePresenceOf = function(value) {
  return value && value.length;
};

UserSchema.pre('save', function(next) {
  if (!this.isNew) return next();
  if (!validatePresenceOf(this.hashedPassword) && authTypes.indexOf(this.provider) === -1) {
    next(new Error('Invalid password'));
  else
    next();
});


UserSchema.methods = {

  authenticate: function(plainText) {
    return this.encryptPassword(plainText) === this.hashedPassword;
  },

  makeSalt: function() {
    return crypto.randomBytes(16).toString('base64');
  },

  encryptPassword: function(password) {
    if (!password || !this.salt) return '';
    var salt = new Buffer(this.salt, 'base64');
    return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
  }
};

module.exports = mongoose.model('User', UserSchema);
