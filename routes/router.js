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

  // Redirect route to split between users and businesses
  app.get('/profile', function(req, res) {
    res.redirect('/login');
    // if (req.user.role == "Shopper") {
    //   res.redirect('/shopper-profile');
    // } else {
    //   res.redirect('/business-profile');
    // }
  });

  // Authentication routes
  app.get('/login', onboardingController.showLogin);

  app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), function(req, res) {
    res.redirect('/');
  });
  
  app.get('/logout', checkAuthentication, authenticationController.logout);

  // Routes for shoppers (i.e. regular users)
  shopperRoutes.get('/register', onboardingController.showShopperRegister);
  shopperRoutes.post('/register', onboardingController.modifyShopperValues, authenticationController.register);
  shopperRoutes.get('/shopper-profile', function(req, res) {
    console.log("Completed")
    res.send("Shopper has been created!");
  })
  // shopperRoutes.get('/connect', onboardingController.showConnect);

  // Routes for businesses (i.e. local stores)
  businessRoutes.get('/register', onboardingController.showBusinessRegister);
  businessRoutes.post('/register', onboardingController.modifyBusinessValues, authenticationController.register);










  app.use('/shopper', shopperRoutes);
  app.use('/business', businessRoutes);
};
