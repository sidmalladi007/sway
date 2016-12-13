const express = require('express');
const authenticationController = require('../controllers/authentication');
const onboardingController = require('../controllers/onboarding');

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
    res.redirect("/business/profile");
  }
}

function verifyBusiness(req, res, next) {
  if (req.user.role == "Business") {
    next();
  } else {
    res.redirect("/shopper/profile");
  }
}

function financeComplete(req, res, next) {
  if (req.user.role == "Business") {
    if (onboardingController.authComplete(req.user._id)) {
      next();
    } else {
      res.redirect("/business/auth");
    }
  } else if (req.user.role == "Shopper") {
    if (onboardingController.connectComplete(req.user._id) && onboardingController.authComplete(req.user._id)) {
      next();
    } else {
      res.redirect("/shopper/connect");
    }
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
      res.redirect('/shopper/profile');
    } else {
      res.redirect('/business/profile');
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
  shopperRoutes.get('/profile', function(req, res) {
    res.send("Shopper has been created!");
  })
  // shopperRoutes.get('/connect', onboardingController.showConnect);

  // Routes for businesses (i.e. local stores)
  businessRoutes.get('/register', onboardingController.showBusinessRegister);
  businessRoutes.post('/register', onboardingController.modifyBusinessValues, authenticationController.register);


  app.use('/shopper', shopperRoutes);
  app.use('/business', businessRoutes);
};
