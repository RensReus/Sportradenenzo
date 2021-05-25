module.exports = (app) => {
  const passport = require('passport');
  const crypto = require('crypto');
  const refreshtoken = require('../db/Mongo/models/refreshtoken');
  const sqlDB = require('../db/sqlDB');
  const fs = require('fs');
  const jwt = require('jsonwebtoken');

  function getSecret() {
    let secret: string;
    if (fs.existsSync('./src/server/jwtsecret.js')) {
      secret = require('../jwtsecret');
    } else {
      secret = process.env.JWT_SECRET;
    }
    return secret;
  }

  function generateToken(user, refreshString) {
    let token;
    // Create the authentication token
    const payload = {
      account_id: user.account_id,
      email: user.email,
      admin: user.admin,
      refreshString,
    };
    token = jwt.sign(payload, getSecret(), { expiresIn: 60 * 60 }); // 1 Uur
    return token;
  }

  function generateRefreshToken(user, refreshString) {
    // Create the refrsh token
    const reftoken = new refreshtoken({
      account_id: user.account_id,
      refreshString,
    });
    reftoken.save((err) => {
      if (err) { throw err; }
    });
  }

  // Register a new account
  app.post('/api/signup', async (req, res, next) => {
    // Check for existing username
    const usernameValue = [req.body.username];
    const usernameQuery = 'SELECT * FROM account WHERE username ILIKE $1';
    let results = await sqlDB.query(usernameQuery, usernameValue);
    if (results.rowCount === 0) {
      passport.authenticate('local-signup', async (user) => {
        if (!user) {
          return res.send({ succes: false, error: 'email adress is already taken' });
        } else {
          const userData = [req.body.email, req.body.username];
          const addUsernameQuery = 'UPDATE account SET username=$2 WHERE email=$1';
          await sqlDB.query(addUsernameQuery, userData);
          req.logIn(user, (err) => {
            if (err) {
              return next(err);
            }
            // Maak een refresh token aan
            const refreshString = crypto.randomBytes(40).toString('hex');
            generateRefreshToken(user, refreshString);
            const token = generateToken(user, refreshString);
            return res.send({
              succes: true,
              error: null,
              token,
            });
          });
        }
      })(req, res, next);
    } else {
      res.send({ succes: false, error: 'username is already taken' });
    }
  });

  // Login into an excisting account
  app.post('/api/login', (req, res, next) => {
    passport.authenticate('local-login', { failureFlash: true }, (user) => {
      if (!user) {
        return res.send({ isLoggedIn: false, isAdmin: false });
      }
      req.logIn(user, (errLoggingIn) => {
        if (errLoggingIn) {
          return next(errLoggingIn);
        }
        refreshtoken.find({ account_id: user.account_id }, (errFindingToken, result) => {
          if (errFindingToken) { throw errFindingToken; }
          let refreshString: string;
          if (!result) {
            // Als er geen refresh token is maak er een aan
            refreshString = crypto.randomBytes(40).toString('hex');
            generateRefreshToken(user, refreshString);
          } else {
            // Gebruik anders de gevonden string
            refreshString = result.refreshString;
          }
          // Maak de authtoken aan
          const token = generateToken(user, refreshString);
          res.append('authorization', token);
          return res.send({
            succes: true,
            token,
          });
        });
      });
    })(req, res, next);
  });

  app.post('/api/getlogin', (req, res) => {
    const token = req.body.token;
    const expiredToken = jwt.decode(token); // Lees de info uit de expired token
    jwt.verify(token, getSecret(), (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          refreshtoken.find({ account_id: expiredToken.account_id }, (err2, result) => {
            if (err2) { throw err; }
            if (!result) {
              return res.send({ isLoggedIn: false, admin: false });
            } else {
              // Maak de authtoken aan met juiste string
              const newToken = jwt.sign({
                account_id: expiredToken.account_id,
                email: expiredToken.email,
                admin: expiredToken.admin,
                refreshString: result.refreshString,
              }, getSecret(), { expiresIn: 60 * 60 });
              return res.send({ isLoggedIn: true, admin: expiredToken.admin });
            }
          });
        }
      } else {
        return res.send({ isLoggedIn: true, admin: decoded.admin });
      }
    });
  });

  // Logout
  app.post('/api/logout', (req, res) => {
    if (!req.user) {
      res.send(false);
    } else {
      req.logout();
      res.send(true);
    }
  });
};
