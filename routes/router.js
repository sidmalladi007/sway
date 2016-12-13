exports.init = function(app) {
  var passport = app.get('passport');
  app.all('/', index);
  // app.get('/membersOnly', checkAuthentication, doMembersOnly);
  app.post('/login', passport.authenticate('local', {failureRedirect: '/login.html', successRedirect: '/membersOnly'}));
  app.get('/logout', doLogout);
}

index = function(req, res) {
  res.render('index');
};

function checkAuthentication(req, res, next){
    if(req.isAuthenticated()){
        next();
    }else{
        res.redirect("/login.html");
    }
}

function doLogout(req, res){
  req.logout();
  res.redirect('/');
};
