var scrape = require('./../scrape');
module.exports = function(app, passport) {
    var User = require('./models/user');
    var girodata = require('./girodata');
    var Renners = require('./models/renner');
    var Etappe = require('./models/etappe');

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
    res.render('index.ejs'); // load the index.ejs file
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {

    // render the page and pass in any flash data if it exists
    res.render('login.ejs', { message: req.flash('loginMessage') }); 
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
    successRedirect : '/profile', // redirect to the secure profile section
    failureRedirect : '/login', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
    }));    
    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {

    // render the page and pass in any flash data if it exists
    res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/profile', // redirect to the secure profile section
    failureRedirect : '/signup', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
    }));

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req, res) {
    User.find({ 'profieldata.poulescore' : {$exists: true} }, 'local.username profieldata.poulescore',{sort: {'profieldata.poulescore': -1}}, function (err, users) {
        var totaalscore = [];
        for(var i=0;i<users.length;i++){
            totaalscore.push(users[i].profieldata.poulescore.reduce((a, b) => a + b, 0));
        }
        if (err) throw err;
        res.render('profile.ejs', {
            user : req.user, // get the user out of session and pass to template
            scoretabel : users, //[{id,local{username}},...]
            totaalscore:totaalscore
        });
    });
    });

    app.get('/giro/teamselectie', isLoggedIn, function(req, res) {
    if(!currentDisplay()){//returns 0 before start
        Renners.find({'prijs' : {$exists: true}},'_id naam team prijs', {sort: {'prijs': -1}}, function (err, renners) {
            if (err) throw err;
            res.render('./giro/teamselectie.ejs', {
                user : req.user,
                renners : renners,
                huidig: currentDisplay(),
                geld : req.user.teamselectie.geld,
                userrenners: req.user.teamselectie.userrenners
            });
        });
    }else{
        res.redirect("/");
    }
    });
    //Voor de aanvraag van een etappe pagina------------------------------------------
    app.get('/giro/etappe*', isLoggedIn, function(req, res){
        User.findOne(req.user._id, function(err, user) {
            if(user.teamselectie.userrenners.length<20){
                res.redirect("/giro/teamselectie")
            }
        });
        //Request de url en zoek het nummer om te weten welke etappe wordt gevraagd, knippen na etappe
        var queryStart = req.originalUrl.indexOf("etappe") + 6;
        var queryEnd   = req.originalUrl.length + 1; //Query eindigen op einde url
        var query = req.originalUrl.slice(queryStart, queryEnd - 1); //Het nummer isoleren 
        var etappe = parseInt(query,10); //String omzetten naar int (decimaal)
        if (isNaN(etappe)==true || etappe<1 || etappe>21){ //Kijken of het een nummer is en of het geen ongeldig nummer is
            res.redirect("/giro")//send to currentDisplay
        }else{ 
            if(displayResults(etappe)){ //returns true if etappe finished
                Etappe.findOne({'_id' : etappe},'uitslagen creationTime', function (err, uitslag) {
                    if (err) throw err;
                    if(uitslag.creationTime + 5*60*1000 < new Date().getTime() || uitslag == null){
                        getResult(etappe,function(){
                            User.find({ 'profieldata.poulescore' : {$exists: true} }, 'local.username profieldata.poulescore',{sort: {'profieldata.poulescore': -1}}, function (err, users) {
                                var totaalscore = [];
                                for(var i=0;i<users.length;i++){
                                    totaalscore.push(users[i].profieldata.poulescore.reduce((a, b) => a + b, 0));
                                }
                                if (err) throw err;
                                res.render('./giro/etapperesultaat.ejs', {
                                    opstelling:req.user.opstellingen[etappe-1].opstelling.naam,
                                    huidig:currentDisplay(),
                                    etappe:etappe,
                                    uitslagen:uitslag.uitslagen,
                                    user : req.user, // get the user out of session and pass to template
                                    scoretabel : users, //[{id,local{username}},...]
                                    totaalscore:totaalscore
                                });
                            });
                        });
                    }else{
                        User.find({ 'profieldata.poulescore' : {$exists: true} }, 'local.username profieldata.poulescore',{sort: {'profieldata.poulescore': -1}}, function (err, users) {
                            var totaalscore = [];
                            for(var i=0;i<users.length;i++){
                                totaalscore.push(users[i].profieldata.poulescore.reduce((a, b) => a + b, 0));
                            }
                            if (err) throw err;
                            res.render('./giro/etapperesultaat.ejs', {
                                opstelling:req.user.opstellingen[etappe-1].opstelling.naam,
                                huidig:currentDisplay(),
                                etappe:etappe,
                                uitslagen:uitslag.uitslagen,
                                user : req.user, // get the user out of session and pass to template
                                scoretabel : users, //[{id,local{username}},...]
                                totaalscore:totaalscore
                            });
                        });
                    }
                });
            }else{// if false display opstelling selectie
                User.findOne(req.user._id, function(err, user) { //user zoeken voor edits
                    res.render('./giro/etappe.ejs', {
                        user:req.user,
                        opstelling:req.user.opstellingen[etappe-1].opstelling.naam,
                        huidig:currentDisplay(),
                        etappe:etappe,
                        deadline:stageStart(etappe)
                    });
                });
            }
        };
    });

    app.get('/giro/overzicht', function(req,res){
    Renners.find({'prijs' : {$exists: true}},'naam team prijs punten', {sort: {'prijs': -1}}, function (err, renners) {
        if(err) throw err;
        res.render('./giro/overzicht.ejs', {
        renners : renners
        });    
    });
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();   
        res.redirect('/');
    });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}