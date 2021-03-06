const express = require('express');
const authenticationController = require('../controllers/authentication');
const onboardingController = require('../controllers/onboarding');
const shopperController = require('../controllers/shopper');
const businessController = require('../controllers/business');
const User = require('../models/user');

function checkAuthentication(req, res, next){
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect("/login");
    }
}

function verifyShopper(req, res, next) {
  if (req.user.role == "Shopper") {
    next();
  } else {
    res.redirect("/business/dashboard");
  }
}

function verifyBusiness(req, res, next) {
  if (req.user.role == "Business") {
    next();
  } else {
    res.redirect("/shopper/spending");
  }
}

exports.authComplete = function(userID) {
  User.findOne({'_id': userID}, 'authTokens', function(err, result) {
    if (result.authTokens.length > 0) {
      return true;
    } else {
      return false;
    }
  })
}

function financeComplete(req, res, next) {
  if (req.user.role == "Business") {
    User.findOne({'_id': req.user._id}, 'authTokens', function(err, result) {
      if (result.authTokens.length > 0) {
        next();
      } else {
        res.redirect("/business/auth");
      }
    });
  } else if (req.user.role == "Shopper") {
    User.findOne({'_id': req.user._id}, 'connectTokens', function(err, result) {
      if (result.connectTokens.length > 0) {
        next();
      } else {
      res.redirect("/shopper/connect");
      }
    })
  }
}

module.exports = function(app) {
  var passport = app.get('passport');
  const shopperRoutes = express.Router();
  const businessRoutes = express.Router();

  app.get('/', onboardingController.home);

  // Redirect route to split between users and businesses
  app.get('/profile', function(req, res) {
    if (req.user.role == "Shopper") {
      res.redirect('/shopper/spending');
    } else {
      res.redirect('/business/dashboard');
    }
  });

  // Authentication routes
  app.get('/login', onboardingController.showLogin);

  app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), function(req, res) {
    res.redirect('/profile');
  });

  app.get('/logout', checkAuthentication, authenticationController.logout);

  // Routes for shoppers (i.e. regular users)
  shopperRoutes.get('/register', onboardingController.showShopperRegister);
  shopperRoutes.post('/register', onboardingController.modifyShopperValues, authenticationController.register);
  shopperRoutes.get('/connect', checkAuthentication, verifyShopper, onboardingController.showShopperConnect);
  shopperRoutes.get('/capture-connect', checkAuthentication, verifyShopper, onboardingController.captureShopperConnect);
  shopperRoutes.get('/auth', checkAuthentication, verifyShopper, onboardingController.showShopperAuth);
  shopperRoutes.get('/capture-auth', checkAuthentication, verifyShopper, onboardingController.captureShopperAuth);
  shopperRoutes.get('/spending', checkAuthentication, financeComplete, verifyShopper, shopperController.showSpending);
  shopperRoutes.get('/rewards', checkAuthentication, verifyShopper, shopperController.showRewards);
  shopperRoutes.post('/addtransaction', checkAuthentication, verifyShopper, shopperController.addTransaction);



  // Routes for businesses (i.e. local stores)
  businessRoutes.get('/register', onboardingController.showBusinessRegister);
  businessRoutes.post('/register', onboardingController.modifyBusinessValues, authenticationController.register);
  businessRoutes.get('/auth', checkAuthentication, verifyBusiness, onboardingController.showBusinessAuth);
  businessRoutes.get('/capture-auth', checkAuthentication, verifyBusiness, onboardingController.captureBusinessAuth);
  businessRoutes.get('/dashboard', checkAuthentication, financeComplete, verifyBusiness, businessController.showDashboard);
  businessRoutes.get('/new-campaign', checkAuthentication, businessController.showNewCampaign);
  businessRoutes.post('/create-campaign', checkAuthentication, businessController.createCampaign);


  app.use('/shopper', shopperRoutes);
  app.use('/business', businessRoutes);
};
