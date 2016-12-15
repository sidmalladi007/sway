

const User = require('../models/user');
var plaid = require('plaid');
var stripe = require("stripe")(process.env.STRIPE_KEY);
var PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
var PLAID_SECRET = process.env.PLAID_SECRET;

var plaidClient = new plaid.Client(PLAID_CLIENT_ID, PLAID_SECRET, plaid.environments.tartan);

function sortTransactions(array, key) {
    return array.transactions.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? 1 : ((x > y) ? -1 : 0));
    });
}

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

exports.connectComplete = function(userID) {
  User.findOne({'_id': userID}, 'connectTokens', function(err, result) {
    if (result.connectTokens.length > 0) {
      return true;
    } else {
      return false;
    }
  })
}

exports.showShopperConnect = function(req, res) {
  res.render('pages/shopper_connect');
}

exports.captureShopperConnect = function(req, res) {
  var public_token = req.query.public_token;
  plaidClient.exchangeToken(public_token, function(err, tokenResponse) {
    if (err != null) {
      res.send('Unable to exchange public_token');
    } else {
      // The exchange was successful - this access_token can now be used to
      // safely pull account and routing numbers or transaction data for the
      // user from the Plaid API using your private client_id and secret.
      var plaidAccessToken = tokenResponse.access_token;
      User.update({'_id': req.user._id}, { $push: { connectTokens: plaidAccessToken }}, function(err, docsAffected) {
        if (err != null) {
          console.log(err);
        } else {
          res.redirect('/shopper/auth');
          plaidClient.getConnectUser(plaidAccessToken, { gte: '30 days ago', }, function(err, response) {
            var allTransactionsToAdd = [];
            response.transactions.forEach(function(transaction) {
              var transactionName = transaction.name;
              if (transactionName.startsWith("DEBIT CARD PURCHASE")) {
                transactionName = transactionName.split(' ').slice(4).join(' ');
              }
              var amount = transaction.amount
              var transactionAmount = amount.toFixed(2);
              var backupDate = Date.now();
              var transactionDate = transaction.date || backupDate.toISOString().slice(0,10);
              var newTransaction = {name: transactionName, amount: transactionAmount, date: transactionDate};
              allTransactionsToAdd.push(newTransaction);
            });
            User.findByIdAndUpdate({'_id': req.user._id}, { $push: { transactions: { $each: allTransactionsToAdd } } }, { new: true }, function(err, results) {
              if (err) {
                console.log(err);
              } else {
                let rightNow = new Date();
                User.update({'_id': req.user._id}, { $set: { lastRefresh: rightNow }}, function(err, results) {
                  if (err) {console.log(err);}
                })
              }
              User.findOne({'_id': req.user._id}, 'transactions', function(err, documents) {
                var sortedDocs = sortTransactions(documents, 'date');
                User.findOne({'_id': req.user._id}, 'subscriptions', function(err, result) {
                  if (err) { console.log(err); }
                  res.render('pages/shopper_spending', {transactions: sortedDocs, subscriptions: result.subscriptions, fullName: req.user.fullName});
                  sortedDocs.forEach(function(transaction) {
                    result.subscriptions.forEach(function(subscription) {
                      if (transaction.name.toUpperCase().indexOf(subscription.business.toUpperCase()) >= 0) {
                        if(transaction.amount >= subscription.minSpend) {
                          var visitsSoFar = subscription.visits;
                          visitsSoFar += 1;
                          User.update({'subscriptions.id': subscription.id}, { $set: { 'subscriptions.$.visits': visitsSoFar }}, function(err, results) {
                            if (err) { console.log(err); }
                            if (visitsSoFar == subscription.goalVisits) {
                              User.findOne({'_id': req.user._id}, 'totalRewards', function(err, result) {
                                var rewardThusFar = result.totalRewards;
                                rewardThusFar += subscription.reward;
                                User.update({'_id': req.user._id}, { $set: { totalRewards: rewardThusFar }}, function(err, results) {
                                  User.update({'subscriptions.id': subscription.id}, { $set: { 'subscriptions.$.visits': 0 }}, function(err, results) {
                                    if (err) { console.log(err); }
                                  })
                                })
                              })
                            }
                          })
                        }
                      }
                    })
                  })
                })
              })
            })
          })
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
  var account_id = req.query.account_id;
  plaidClient.exchangeToken(public_token, function(err, tokenResponse) {
    if (err != null) {
      res.send('Unable to exchange public_token');
    } else {
      // The exchange was successful - this access_token can now be used to
      // safely pull account and routing numbers or transaction data for the
      // user from the Plaid API using your private client_id and secret.
      var plaidAccessToken = tokenResponse.access_token;
      var stripeBankToken = tokenResponse.stripe_bank_account_token;
      User.update({'_id': req.user._id}, { $push: { authTokens: plaidAccessToken } }, function(err, docsAffected) {
        if (err != null) {
          console.log(err);
        } else {
          stripe.customers.create({
            description: `Stripe customer account for ${req.user.firstName} ${req.user.lastName}`,
            source: stripeBankToken // obtained with Stripe.js
          }, function(err, customer) {
            if (err != null) {
              console.log(err);
            } else {
              User.update({'_id': req.user._id}, { $set: { stripeCustomerID: customer.id }}, function(err, docsAffected) {
                if (err != null) {
                  console.log(err);
                } else {
                }
                res.redirect('/shopper/spending');
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
  var account_id = req.query.account_id;
  plaidClient.exchangeToken(public_token, function(err, tokenResponse) {
    if (err != null) {
      res.json({error: 'Unable to exchange public_token'});
    } else {
      // The exchange was successful - this access_token can now be used to
      // safely pull account and routing numbers or transaction data for the
      // user from the Plaid API using your private client_id and secret.
      var plaidAccessToken = tokenResponse.access_token;
      var stripeBankToken = tokenResponse.stripe_bank_account_token;
      User.update({'_id': req.user._id}, { $push: { authTokens: plaidAccessToken } }, function(err, docsAffected) {
        if (err != null) {
          console.log(err);
        } else {
          stripe.customers.create({
            description: `Stripe customer account for ${req.user.firstName} ${req.user.lastName}`,
            source: stripeBankToken // obtained with Stripe.js
          }, function(err, customer) {
            if (err != null) {
              console.log(err);
            } else {
              User.update({'_id': req.user._id}, { $set: { stripeCustomerID: customer.id }}, function(err, docsAffected) {
                if (err != null) {
                  console.log(err);
                } else {
                  res.redirect('/business/dashboard');
                }
              })
            }
        });
      }
      });
    }
  })
}
