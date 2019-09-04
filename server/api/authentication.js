module.exports = function (app) {
  var passport = require('passport');
  const crypto = require('crypto')
  var refreshtoken = require('../db/Mongo/models/refreshtoken')
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

  function checkToken(){
    //get the token from the header if present
    const token = req.headers["x-access-token"] || req.headers["authorization"];
    //if no token found, return response (without going to the next middelware)
    if (!token) return res.status(401).send("Access denied. No token provided.");

    try {
      //if can verify the token, set req.user and pass to next middleware
      const decoded = jwt.verify(token);
      req.user = decoded;
      next();
    } catch (ex) {
      //if invalid token
      res.status(400).send("Invalid token.");
    }
  }

  function generateToken(user, refreshString){
    //Create the authentication token
    var payload = {
      account_id : user.account_id,
      email : user.email,
      admin : user.admin,
      refreshString : refreshString
    }
    return token = jwt.sign(payload, getSecret(), {expiresIn: 60*60}) //1 Minuut
  }

  function generateRefreshToken(user, refreshString){
    //Create the refrsh token
    var reftoken = new refreshtoken({
      account_id : user.account_id,
      refreshString : refreshString
    })
    console.log("Reftoken aangemaakt")
    console.log(reftoken)
    reftoken.save(function(err){
      if(err) throw err;
    })
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
              //Maak een refresh token aan
              refreshString = crypto.randomBytes(40).toString('hex');
              generateRefreshToken(user, refreshString)
              var token = generateToken(user, refreshString)
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
    console.log(req.headers)
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
        refreshtoken.find({ account_id : user.account_id }, function(err,result){
          if (err) throw err;
          if(!result){
            console.log("Geen token gevonden")
            //Als er geen refresh token is maak er een aan
            refreshString = crypto.randomBytes(40).toString('hex');
            generateRefreshToken(user, refreshString)
            //Maak de authtoken aan
            var token = generateToken(user, refreshString)
            return res.send({
              succes: true,
              token: token
            })
          }else{
            console.log("Refresh token gevonden, authtoken aanmaken")
            //Maak de authtoken aan met juiste string
            var token = generateToken(user, result.refreshString)
            return res.send({
              succes: true,
              token: token
            })
          }
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
        if(err.name='TokenExpiredError'){
          refreshtoken.find({ account_id : req.account_id }, function(err,result){
            if (err) throw err;
            if(!restult.length){
              //Als er geen refresh token is, user kan niet ingelogd worden
              res.send({isLoggedIn: false, isAdmin: false})
            }else{
              console.log("authtoken created after expiry")
              //Maak de authtoken aan met juiste string
              var token = generateToken(user, result.refreshString)
              return res.send({
                isLoggedIn: true,
                token: token
              })
            }
          })
        }
      }else{
        res.send({isLoggedIn: true, isAdmin: decoded.admin})
      }
    });
  });
};
