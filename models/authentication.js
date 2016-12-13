var passport = require('passport');
let LocalStrategy = require('passport-local').Strategy;
var expressSession = require('express-session');
const User = require('./user');


// Initialize Passport and restore authentication state, if any, from the session.
exports.init = function (app) {
  app.use(expressSession((
    {secret: 'Tartans',
     resave: false,
     saveUninitialized: true })));
  app.use(passport.initialize());
  app.use(passport.session());
  return passport;
}

// let localOptions = { usernameField: 'email' };

// passport.use(new LocalStrategy({usernameField: 'email', passwordField: 'password'}, function(email, password, done) {
//   console.log("Checking...");
//   User.findOne({ email: email }, function(err, user) {
//     if(err) { return done(err); }
//     if(!user) { return done(null, false, { error: 'Your login details could not be verified. Please try again.' }); }
//     user.comparePassword(password, function(err, isMatch) {
//       if (err) { return done(err); }
//       if (!isMatch) { return done(null, false, { error: "Your login details could not be verified. Please try again." }); }
//       return done(null, user);
//     });
//   });
// });

// passport.use(new Strategy(
//   function(username, password, done) {
//     console.log("Checking....")
//     User.findOne({ email: username }, function(err, foundUser) {
//       if (err) { return done(err); }
//       if (!foundUser) { return done(null, false); }
//       if (foundUser.password != password) { return done(null, false); }
//       return done(null, foundUser);
//     });
//   }));



passport.use(new LocalStrategy({usernameField: 'email', passwordField: 'password'}, function(email, password, done) {
  console.log("Checking...");
  User.findOne({ email: email }, function(err, user) {
    if(err) { return done(err); }
    if(!user) { return done(null, false, { error: 'Your login details could not be verified. Please try again.' }); }
    user.comparePassword(password, function(err, isMatch) {
      if (err) { return done(err); }
      if (!isMatch) { return done(null, false, { error: "Your login details could not be verified. Please try again." }); }
      return done(null, user);
    });
  });
}));

passport.serializeUser(function(user, done) {
  // Pass null for no error, and the user ID as a key to lookup the user
  // upon deserialization.
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
   User.findById(id, function(err, user) {
     done(err, user);
   });
 });
