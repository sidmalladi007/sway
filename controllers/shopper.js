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

exports.showProfile = function(req, res) {
  res.send("This is your account!!")
}

exports.showSpending = function(req, res) {
  User.findOne({'_id': req.user._id}, 'connectTokens lastRefresh', function(err, context) {
    var now = new Date();
    if (err) { console.log(err); }
    var refreshTime;
    if (context.lastRefresh == null) {
      refreshTime = '30 days ago';
      plaidClient.getConnectUser(context.connectTokens[0], { gte: refreshTime, }, function(err, response) {
        var allTransactionsToAdd = [];
        console.log(response.transactions);
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
        User.update({'_id': req.user._id}, { $push: { transactions: { $each: allTransactionsToAdd } } }, function(err, results) {
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
              res.render('pages/shopper_spending', {transactions: sortedDocs, subscriptions: result.subscriptions});
              console.log(sortedDocs);
              sortedDocs.transactions.forEach(function(transaction) {
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
    } else if (now - context.lastRefresh > 86400000) {
      refreshTime = new Date(context.lastRefresh.getTime() + 60000*1440);
      plaidClient.getConnectUser(context.connectTokens[0], { gte: refreshTime, }, function(err, response) {
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
        User.update({'_id': req.user._id}, { $push: { transactions: { $each: allTransactionsToAdd } } }, function(err, results) {
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
              res.render('pages/shopper_spending', {transactions: sortedDocs, subscriptions: result.subscriptions});
              console.log(sortedDocs);
              sortedDocs.transactions.forEach(function(transaction) {
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
    } else {
      User.findOne({'_id': req.user._id}, 'subscriptions', function(err, results) {
        if (err) { console.log(err); }
        var displayedSubscriptions = (results.subscriptions);
        User.findOne({'_id': req.user._id}, 'transactions', function(err, documents) {
          var sortedDocs = sortTransactions(documents, 'date');
          res.render('pages/shopper_spending', {transactions: sortedDocs, subscriptions: displayedSubscriptions});
        });
      })
    }
  })
}

exports.showRewards = function(req, res) {
  res.render('pages/shopper_rewards');
}

exports.addTransaction = function(req, res) {
  var transactionName = req.query.name;
  var transactionAmount = req.query.amount;
  var transactionDate = req.query.date;
  var transaction = {name: transactionName, amount: transactionAmount, date: transactionDate};
  User.findByIdAndUpdate({'_id': req.user._id}, { $push: { transactions: transaction } }, { new: true }, function(err, results) {
    if (err) {
      console.log(err);
    } else {
      res.send({status: "All good!"});
    }
  })
}
