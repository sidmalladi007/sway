const User = require('../models/user');

exports.showProfile = function(req, res) {
  res.send("This is a business profile!!");
}

exports.showDashboard = function(req, res) {
  User.findOne({'_id': req.user._id}, 'campaigns', function(err, result) {
    if (err) {
      console.log(err);
    } else {
      res.render('pages/business_dashboard', {campaigns: result.campaigns, fullName: req.user.fullName});
    }
  })
}

exports.showNewCampaign = function(req, res) {
  res.render('pages/business_campaign', {fullName: req.user.fullName});
}

exports.createCampaign = function(req, res) {
  var campaignName = req.body.campaignname;
  var campaignDescription = req.body.description;
  var numberOfVisits = req.body.numberofvisits;
  var minimumSpend = Number(req.body.minimumspend);
  console.log("MINIMUM SPEND BELOW");
  console.log(minimumSpend);
  var campaignReward = req.body.rewarddescription;
  console.log("REWARD BELOW");
  console.log(campaignReward);
  var rewardValue = Number(req.body.maxreward);
  console.log("MAX REWARD BELOW");
  console.log(rewardValue);
  var campaignStartUnmodified = req.body.startdate;
  var campaignStart = campaignStartUnmodified.split(" ")[0];
  var campaignEndUnmodified = req.body.enddate;
  var campaignEnd = campaignEndUnmodified.split(" ")[0];
  var campaign = {name: campaignName, description: campaignDescription, numVisits: numberOfVisits, minSpent: minimumSpend, rewardName: campaignReward, maxReward: rewardValue, startDate: campaignStart, endDate: campaignEnd};
  User.findByIdAndUpdate({'_id': req.user._id}, { $push: { campaigns: campaign } }, { new: true }, function(err, results) {
    if (err) {
      console.log(err);
    } else {
      console.log(results);
      res.redirect("/business/dashboard");
    }
  });
}
