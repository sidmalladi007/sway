const User = require('../models/user');

exports.showProfile = function(req, res) {
  res.send("This is a business profile!!");
}

exports.showDashboard = function(req, res) {
  res.render('pages/business_dashboard');
}

exports.showNewCampaign = function(req, res) {
  res.render('pages/business_campaign');
}

exports.createCampaign = function(req, res) {
  var campaignName = req.body.campaignname;
  var campaignDescription = req.body.description;
  var numberOfVisits = req.body.numberofvisits;
  var minimumSpend = req.body.minimumspend;
  var campaignReward = req.body.rewarddescription;
  var rewardValue = req.body.maxreward;
  var campaignStartUnmodified = req.body.startdate;
  var campaignStart = campaignStartUnmodified.split(" ")[0];
  var campaignEndUnmodified = req.body.enddate;
  var campaignEnd = campaignEndUnmodified.split(" ")[0];
  var campaign = {name: campaignName, description: campaignDescription, numVisits: numberOfVisits,
    minspent: minimumSpend, rewardName: campaignReward, maxReward: rewardValue, startDate: campaignStart, endDate: campaignEnd};
  User.findByIdAndUpdate({'_id': req.user._id}, { $push: { campaigns: campaign } }, { new: true }, function(err, results) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/business/dashboard");
    }
  });
}

// campaigns: [{
//   name: {type: String},
//   description: {type: String},
//   numVisits: {type: Number},
//   minSpent: {type: Number},
//   rewardName: {type: String},
//   maxReward: {type: Number},
//   startDate: {type: String},
//   endDate: {type: String}
// }],
