module.exports = function (app) {
  var passport = require('passport');

  //Register a new account
  app.use("/api/signup", passport.authenticate('local-signup', {
    successRedirect: '/profile', // redirect to the secure profile section
    failureRedirect: '/whytho', // redirect back to the signup page if there is an error
  }));

  //Login into an excisting account
  app.post('/api/login', function (req, res, next) {
    passport.authenticate('local-login', function (err, user) {
      if (err) { return next(err); }
      if (!user) { return res.send({isLoggedIn: false, isAdmin: false}); }
      req.logIn(user, function (err) {
        if (err) { return next(err); }
        return res.send(true);
      });
    })(req, res, next);
  });

  //Logout
  app.post('/api/logout', function (req, res){
    if(!req.user){
      res.send(false)
    }else{
      req.logout();
      res.send(true)
    }
  })

  app.post('/api/isloggedin', function (req, res) {
    if (!req.user) {
      res.send({isLoggedIn: false, isAdmin: false})
    } else {
      res.send({isLoggedIn: true, isAdmin: req.user.admin})
    }
  });
};
