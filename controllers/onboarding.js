const User = require('../models/user');
var plaid = require('plaid');
var stripe = require("stripe")("sk_test_syV9DDTuDwIsdDGvxqVCA4K2");
var PLAID_CLIENT_ID = "58509a6bfbfa99426419332c" //envvar.string('PLAID_CLIENT_ID');
var PLAID_SECRET = "68a5788fd6829e18b18f9edcc815c6" //envvar.string('PLAID_SECRET');

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

exports.authComplete = function(userID) {
  User.findOne({'_id': userID}, 'authTokens', function(err, result) {
    return (results.authTokens.length > 0);
  })
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
              console.log("HERE ARE ALL TRANSACTIONS");
              console.log(allTransactionsToAdd);
            });
            User.findByIdAndUpdate({'_id': req.user._id}, { $push: { transactions: { $each: allTransactionsToAdd } } }, { new: true }, function(err, results) {
              if (err) {
                console.log(err);
              } else {
                console.log("AFTER INSERTING INTO DATABASE");
                console.log(results);
                let rightNow = new Date();
                User.update({'_id': req.user._id}, { $set: { lastRefresh: rightNow }}, function(err, results) {
                  if (err) {console.log(err);}
                })
              }
              User.findOne({'_id': req.user._id}, 'transactions', function(err, documents) {
                console.log("HERE ARE THE DOCUMENTS FETCHED FROM THE DB");
                console.log(documents);
                var sortedDocs = sortTransactions(documents, 'date');
                User.findOne({'_id': req.user._id}, 'subscriptions', function(err, result) {
                  if (err) { console.log(err); }
                  res.render('pages/shopper_spending', {transactions: sortedDocs, subscriptions: result.subscriptions});
                  console.log("HERE ARE THE SORTED DOCS");
                  console.log(sortedDocs);
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
