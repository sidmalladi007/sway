exports.showProfile = function(req, res) {
  res.send("This is a business profile!!");
}

exports.showDashboard = function(req, res) {
  res.render('pages/business_dashboard');
}

exports.showNewCampaign = function(req, res) {
  res.render('pages/business_campaign');
}
