const LocalStrategy     = require('passport-local').Strategy;
const SQLread           = require('./db/SQLread')
const SQLwrite          = require('./db/SQLwrite')
const bcrypt            = require('bcrypt-nodejs')

module.exports = function(passport) {
    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize accounts out of session

    // used to serialize the user for the session
    passport.serializeUser(function(account, done) {
        done(null, account.account_id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(account_id, done) {
        SQLread.getAccount(account_id,done);
    });
    
    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        session: false,
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {
        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        SQLread.getLogin(email.toLowerCase(),function(err,result){
            if (err){
                return done(err, false);
            }
            if(result != null){ //email is already taken
                return done(null, false);
            }else{
                //still available make new user
                var passwordToStore = bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
                var emailToStore    = email.toLowerCase();
                SQLwrite.addAccount(emailToStore,passwordToStore,function(err,account){
                    if(err)
                        throw err;
                    return done(null, account)
                })
            }
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
        session: false,
        passReqToCallback : true  //allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form
        SQLread.getLogin(email.toLowerCase(),function(err,account){
            if (err)
                return done(err);

            if (account == null) //no account with that email
                return done(null, false);
            
            if (!bcrypt.compareSync(password, account.password)) //incorrect password
                return done(null, false);
            
            return done(null,account)

        })
    }));
};