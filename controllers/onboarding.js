exports.home = function(req, res) {
  res.render('pages/index');
};

exports.showLogin = function(req, res) {
  res.render('pages/login')
}

exports.showShopperRegister = function(req, res) {
  res.render('pages/shopper_register');
}

exports.showBusinessRegister = function(req, res) {
  res.render('pages/business_register');
}

exports.modifyShopperValues = function(req, res, next) {
  req.body.fullName = req.body.firstname + " " + req.body.lastname;
  req.body.role = "Shopper";
  next();
}

exports.modifyBusinessValues = function(req, res, next) {
  req.body.fullName = req.body.storename;
  req.body.role = "Business";
  next();
}
