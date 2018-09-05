// load all the things we need
const LocalStrategy   = require('passport-local').Strategy;
const { Pool } = require('pg')
const bcrypt = require('bcrypt')

// expose this function to our app using module.exports
module.exports = function(passport) {
    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize accounts out of session

    // used to serialize the account for the session
    passport.serializeUser(function(account, done) {
        console.log("USER SERIALIZED")
        done(null, account.id);
    });

    // used to deserialize the account
    passport.deserializeUser(function(id, done) {
        console.log("USER DESERIALIZED")
        var pool = new pg.Pool()
        pool.connect(connection, function (err, client) {
            var account = {};
            var query = client.query("SELECT * FROM account WHERE id = $1", [id]);
        
            query.on('row', function (row) {
              account = row;
              done(null, account);
            });
        
            // After all data is returned, close connection and return results
            query.on('end', function () {
                client.end();
            });
        
            // Handle Errors
            if (err) {
                console.log(err);
            }
        });
    });
    
    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password'
    },
    function(email, password, done) {
        //generate password hash
        password = bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
        const pool = new Pool()
        pool.connect((err, client, release) => {
            if (err) {
              return console.error('Error acquiring client', err.stack)
            }
            console.log('EM: ' + email)
            console.log('PW: ' + password)
            client.query(
                "INSERT INTO account(username,email,password) VALUES(req.body.username,req.body.email,password)", 
                "ON CONFLICT(username) ABORT",
                "ON CONFLICT(email) ABORT"
            );
            query.on('error', function(err){
                console.log(err);
            })
            query.on('end', function(){
                response.sendStatus(200);
                client.end();
            })
        });  
    }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'
        
    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true  //allows us to pass back the entire request to the callback
    },
    function(req, username, password, done){
        const pool = new Pool()
        pool.connect(function (err, client) {
            var account = {};
    
            var query = client.query("SELECT * FROM account WHERE email = $1", [email]);
            query.on('row', function (row) {
                account = row;
                if(password == account.password){
                    done(null, account);
                } else {
                    done(null, false, { message: 'Incorrect email or password.' });
                }
            });
      
            // After all data is returned, close connection and return results
            query.on('end', function () {
                client.end();
            });
      
            // Handle Errors
            if (err) {
                console.log(err);
            }
        });
    }));
};