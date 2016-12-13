const User = require('../models/user');
var plaid = require('plaid');
var stripe = require("stripe")("sk_test_syV9DDTuDwIsdDGvxqVCA4K2");
var PLAID_CLIENT_ID = "584a46a139361950fd107cdd" //envvar.string('PLAID_CLIENT_ID');
var PLAID_SECRET = "9dc438ec35793f5395f3011f006aed" //envvar.string('PLAID_SECRET');

var plaidClient = new plaid.Client(PLAID_CLIENT_ID, PLAID_SECRET, plaid.environments.tartan);

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
  })
}

exports.connectComplete = function(userID) {
  User.findOne({'_id': userID}, 'connectTokens', function(err, result) {
    return (result.connectTokens.length > 0);
  })
}

exports.showShopperConnect = function(req, res) {
  res.render('pages/shopper_connect');
}

exports.captureShopperConnect = function(req, res) {
  var public_token = req.query.public_token;
  plaidClient.exchangeToken(public_token, function(err, tokenResponse) {
    if (err != null) {
      res.json({error: 'Unable to exchange public_token'});
      console.log("Token exchange didn't work");
    } else {
      // The exchange was successful - this access_token can now be used to
      // safely pull account and routing numbers or transaction data for the
      // user from the Plaid API using your private client_id and secret.
      var plaidAccessToken = tokenResponse.access_token;
      User.update({'_id': req.user._id}, { $push: { connectTokens: plaidAccessToken }}, function(err, docsAffected) {
        if (err != null) {
          console.log(err);
        } else {
          console.log("Plaid token inserted!");
          res.redirect('/shopper/auth');
        }
      });
    }
  })
}

exports.showShopperAuth = function(req, res) {
  res.render('pages/shopper_auth');
}

exports.captureShopperAuth = function(req, res) {
  var public_token = req.query.public_token;
  console.log("Auth Public Token: " + public_token);
  var account_id = req.query.account_id;
  plaidClient.exchangeToken(public_token, function(err, tokenResponse) {
    if (err != null) {
      res.send('Unable to exchange public_token');
      console.log("Token exchange didn't work");
    } else {
      // The exchange was successful - this access_token can now be used to
      // safely pull account and routing numbers or transaction data for the
      // user from the Plaid API using your private client_id and secret.
      var plaidAccessToken = tokenResponse.access_token;
      console.log("Auth Access Token: " + plaidAccessToken);
      var stripeBankToken = tokenResponse.stripe_bank_account_token;
      console.log("Stripe Bank Token: " + stripeBankToken);
      User.update({'_id': req.user._id}, { $push: { authTokens: plaidAccessToken } }, function(err, docsAffected) {
        if (err != null) {
          console.log(err);
        } else {
          console.log("Plaid token inserted!");
          stripe.customers.create({
            description: `Stripe customer account for ${req.user.firstName} ${req.user.lastName}`,
            source: stripeBankToken // obtained with Stripe.js
          }, function(err, customer) {
            if (err != null) {
              console.log(err);
            } else {
              console.log("Stripe customer created!");
              User.update({'_id': req.user._id}, { $set: { stripeCustomerID: customer.id }}, function(err, docsAffected) {
                if (err != null) {
                  console.log(err);
                } else {
                  console.log("Stripe ID inserted!");
                }
                res.redirect('/shopper/profile');
              })
            }
        });
      }
      });
    }
  })
}

exports.showBusinessAuth = function(req, res) {
  res.render('pages/business_auth');
}

exports.captureBusinessAuth = function(req, res) {
  var public_token = req.query.public_token;
  console.log("Auth Public Token: " + public_token);
  var account_id = req.query.account_id;
  plaidClient.exchangeToken(public_token, function(err, tokenResponse) {
    if (err != null) {
      res.json({error: 'Unable to exchange public_token'});
      console.log("Token exchange didn't work");
    } else {
      // The exchange was successful - this access_token can now be used to
      // safely pull account and routing numbers or transaction data for the
      // user from the Plaid API using your private client_id and secret.
      var plaidAccessToken = tokenResponse.access_token;
      console.log("Auth Access Token: " + plaidAccessToken);
      var stripeBankToken = tokenResponse.stripe_bank_account_token;
      console.log("Stripe Bank Token: " + stripeBankToken);
      User.update({'_id': req.user._id}, { $push: { authTokens: plaidAccessToken } }, function(err, docsAffected) {
        if (err != null) {
          console.log(err);
        } else {
          console.log("Plaid token inserted!");
          stripe.customers.create({
            description: `Stripe customer account for ${req.user.firstName} ${req.user.lastName}`,
            source: stripeBankToken // obtained with Stripe.js
          }, function(err, customer) {
            if (err != null) {
              console.log(err);
            } else {
              console.log("Stripe customer created!");
              User.update({'_id': req.user._id}, { $set: { stripeCustomerID: customer.id }}, function(err, docsAffected) {
                if (err != null) {
                  console.log(err);
                } else {
                  console.log("Stripe ID inserted!");
                }
                res.redirect('/business/profile');
              })
            }
        });
      }
      });
    }
  })
}
