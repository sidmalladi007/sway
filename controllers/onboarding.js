const User = require('../models/user');

exports.home = function(req, res) {
  res.render('pages/index');
};

exports.showLogin = function(req, res) {
  res.render('pages/login')
}

exports.showShopperRegister = function(req, res) {
  res.render('pages/shopper_register');
}

exports.showBusinessRegister = function(req, res) {
  res.render('pages/business_register');
}

exports.modifyShopperValues = function(req, res, next) {
  req.body.fullName = req.body.firstname + " " + req.body.lastname;
  req.body.role = "Shopper";
  next();
}

exports.modifyBusinessValues = function(req, res, next) {
  req.body.fullName = req.body.storename;
  req.body.role = "Business";
  next();
}

exports.authComplete = function(userID) {
  User.findOne({'_id': userID}, 'authTokens', function(err, result) {
    return (results.authTokens.length > 0);
  }
}

exports.connectComplete = function(userID) {
  User.findOne({'_id': userID}, 'connectTokens', function(err, result) {
    return (results.connectTokens.length > 0);
  }
}
