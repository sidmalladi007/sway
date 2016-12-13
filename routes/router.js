const express = require('express');
const authenticationController = require('../controllers/authentication');
const onboardingController = require('../controllers/onboarding');

function checkAuthentication(req, res, next){
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect("/login.html");
    }
}

module.exports = function(app) {
  var passport = app.get('passport');
  const shopperRoutes = express.Router();
  const businessRoutes = express.Router();

  app.get('/', onboardingController.home);

  // Authentication routes
  app.post('/login', function(req, res, next) {
    passport.authenticate('local', {failureRedirect: '/login', successRedirect: '/profile'});
  });
  app.get('/logout', checkAuthentication, authenticationController.logout);

  // Routes for shoppers (i.e. regular users)
  shopperRoutes.get('/register', onboardingController.showShopperRegister);
  // shopperRoutes.post('/register', onboardingController.registerShopper);
  // shopperRoutes.get('/connect', onboardingController.showConnect);

  businessRoutes.get('/register', onboardingController.showBusinessRegister);










  app.use('/shopper', shopperRoutes);
  app.use('/business', businessRoutes);
};
