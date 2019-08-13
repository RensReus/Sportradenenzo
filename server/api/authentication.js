module.exports = function (app) {
  var passport = require('passport');
  const sqlDB = require('../db/sqlDB')
  const fs = require('fs');
  const jwt = require('jsonwebtoken')

  function getSecret(){
    if (fs.existsSync('./server/jwtsecret.js')) {
      return secret = require('../jwtsecret');
    } else {
      return secret = process.env.JWT_SECRET;
    }
  }

  function generateToken(user){
    //Create the authentication token
    var payload = {
      account_id : user.account_id,
      email : user.email,
      admin : user.admin
    }
    return token = jwt.sign(payload, getSecret(), {expiresIn: 60*60*24*30})
  }

  //Register a new account
  app.post("/api/signup", function(req,res,next) {
    //Check for existing username
    var values = [req.body.username]
    var query = "SELECT * FROM account WHERE username = $1"
    sqlDB.query(query, values, (err, sqlres) => {
      if(err)
        throw err;
      if(sqlres.rowCount == 0){    
        passport.authenticate('local-signup', function (err,user) {
          if (err) {
            return next(err);
          }
          if (!user) {
            return res.send({succes: false, error: "email adress is already taken"})
          }else{
            var values = [req.body.email, req.body.username]
            var query = "UPDATE account SET username=$2 WHERE email=$1"
            sqlDB.query(query, values, (err) => {
              if(err)
                throw err;
            });
            req.logIn(user, function(err) {
              if (err){
                return next(err)
              }
              var token = generateToken(user)
              return res.send({
                succes: true, 
                error: null,
                token: token
              })
            });
          }
        })(req, res, next);
      }else{
        res.send({succes: false, error: "username is already taken"})
      }
    });
  });

  //Login into an excisting account
  app.post('/api/login', function (req, res, next) {
    passport.authenticate('local-login', {failureFlash: true}, function (err, user) {
      if (err) { 
        return next(err);
      }
      if (!user) { 
        return res.send({isLoggedIn: false, isAdmin: false});
      }
      req.logIn(user, function (err) {  
        if (err) { 
          return next(err);
        }
        var token = generateToken(user)
        return res.send({
          succes: true,
          token: token
        })
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
    jwt.verify(req.body.token, getSecret(), function(err, decoded){
      if(err){
        res.send({isLoggedIn: false, isAdmin: false})
      }else{
        res.send({isLoggedIn: true, isAdmin: decoded.admin})
      }
    });
  });
};
