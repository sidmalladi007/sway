'use strict'

const User = require('../models/user');

function setUserInfo(request) {
  return {
    _id: request._id,
    fullName: request.fullName,
    email: request.email,
    role: request.role,
  };
}.

exports.login = function(req, res, next) {
  let userInfo = setUserInfo(req.user);
  res.status(200).json({
    user: userInfo
  });
}

exports.register = function(req, res, next) {
  const email = req.body.email;
  const fullName = req.body.name;
  const password = req.body.password;

  if (!email) {
    return res.status(422).send({ error: 'You must enter an email address.'});
  }

  if (!fullName) {
    return res.status(422).send({ error: 'You must enter a name'});
  }

  if (!password) {
    return res.status(422).send({ error: 'You must enter a password.' });
  }

  User.findOne({ email: email }, function(err, existingUser) {
      if (err) { return next(err); }

      if (existingUser) {
        return res.status(422).send({ error: 'That email address is already in use.' });
      }

      let user = new User({
        email: email,
        password: password,
        fullName: fullName
      });

      user.save(function(err, user) {
        if (err) { return next(err); }

        let userInfo = setUserInfo(user);

        res.redirect("/profile");
      });
  });
}

// Check authorization
exports.roleAuthorization = function(role) {
  return function(req, res, next) {
    const user = req.user;

    User.findById(user._id, function(err, foundUser) {
      if (err) {
        res.status(422).json({ error: 'No user was found.' });
        return next(err);
      }

      if (foundUser.role == role) {
        return next();
      }

      res.status(401).json({ error: 'You are not authorized to view this content.' });
      return next('Unauthorized');
    })
  }
};
