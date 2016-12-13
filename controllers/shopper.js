exports.showProfile = function(req, res) {
  res.send("This is your account!!")
}

exports.showSpending = function(req, res) {
  res.render('pages/shopper_spending');
}

exports.showRewards = function(req, res) {
  res.render('pages/shopper_rewards');
}
