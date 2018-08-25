var scrape = require('./../scrape');
module.exports = function (app, passport) {
    var User = require('./models/user');
    var starttijden = require('./starttijden');
    var Renners = require('./models/renner');
    var Etappe = require('./models/etappe');

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function (req, res) {
        // res.render('index.ejs'); // load the index.ejs file
        res.redirect('/giro'); // scheelt iedere keer weer klikken en de index pagina istoch kaal
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function (req, res) {
        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage'), url: req.originalUrl });
    });

    // process the login form
    // app.post('/login', passport.authenticate('local-login', {
    //     successRedirect : 'giro', // scheelt ook weer een keer klikken
    //     failureRedirect : '/login', // redirect back to the signup page if there is an error
    //     failureFlash : true // allow flash messages
    // })); 
    app.post('/login', function (req, res, next) {
        var redirectURL = '/giro';
        if (req.query.redir != undefined) redirectURL = req.query.redir;
        passport.authenticate('local-login', {
            successRedirect: redirectURL, // scheelt ook weer een keer klikken
            failureRedirect: '/login', // redirect back to the signup page if there is an error
            failureFlash: true // allow flash messages
        })(req, res, next);
    });
    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function (req, res) {
        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function (req, res) {
        User.find({ 'profieldata.poulescore': { $exists: true } }, 'local.username profieldata.poulescore profieldata.totaalscore', { sort: { 'profieldata.totaalscore': -1 } }, function (err, users) {
            if (err) throw err;
            res.render('profile.ejs', {
                user: req.user, // get the user out of session and pass to template
                users: users, //[{id,local{username}},...]
            });
        });
    });

    app.get('/giro/teamselectie', isLoggedIn, function (req, res) {
        if (!currentDisplay()) {//returns 0 before start
            Renners.find({ 'prijs': { $exists: true } }, '_id naam team prijs', { sort: { 'prijs': -1 } }, function (err, renners) {
                if (err) throw err;
                res.render('./giro/teamselectie.ejs', {
                    user: req.user,
                    renners: renners,
                    huidig: currentDisplay(),
                    geld: req.user.teamselectie.geld,
                    userrenners: req.user.teamselectie.userrenners
                });
            });
        } else {
            res.redirect("/");
        }
    });

    app.get('/giro/etappewinsten',isLoggedIn,function(req,res){
        returnEtappeWinnaars(req.user.groups.poules[0],function(rankings,rankingsUsers){
            res.render('./giro/etappeoverwinningen.ejs',{
                rankings,
                rankingsUsers
            });
        });
        
    })

    //Voor de aanvraag van een etappe pagina------------------------------------------
    app.get('/giro/etappe*', isLoggedIn, function (req, res) {
        if (req.user.teamselectie.userrenners.length < 20) {
            res.redirect("/giro/teamselectie")
        }
        //Request de url en zoek het nummer om te weten welke etappe wordt gevraagd, knippen na etappe
        var etappe = parseInt(req.originalUrl.substring(12)); //String omzetten naar int (decimaal)
        if (isNaN(etappe)|| etappe < 1 || etappe > 21) { //Kijken of het een nummer is en of het geen ongeldig nummer is
            res.redirect("/giro")//send to currentDisplay
        } else {
            if (displayResults(etappe)) { //returns true if etappe finished
                Etappe.findOne({ '_id': etappe }, 'uitslagen creationTime', function (err, uitslag) {
                    if (err) throw err;
                    User.find({ 'profieldata.poulescore': { $exists: true } }, 'local.username profieldata.poulescore profieldata.totaalscore', { sort: { 'profieldata.totaalscore': -1 } }, function (err, users) {
                        var dagscore = users.map(user => user.profieldata.poulescore[etappe - 1]);
                        var teamrenners = req.user.teamselectie.userrenners.map(renner => renner._id)
                        if (err) throw err;
                        res.render('./giro/etapperesultaat.ejs', {
                            opstelling: req.user.opstellingen[etappe - 1].opstelling.naam,
                            opstellingIDs: req.user.opstellingen[etappe - 1].opstelling._id,
                            huidig: currentDisplay(),
                            etappe,
                            uitslagen: uitslag.uitslagen,
                            user: req.user, // get the user out of session and pass to template
                            users, //[{id,local{username}},...]
                            dagscore,
                            teamrenners
                        });
                    });
                });
            } else {// if false display opstelling selectie
                Etappe.find({ //Zoeken naar uitslag voor de klassementen
                    'uitslagen.dag' :  { $exists: true, $not: {$size: 0} }       
                },'_id uitslagen')
                .exec()
                .then(uitslag=>{
                    uitslag.sort(function(a,b) {return (parseInt(a._id) > parseInt(b._id)) ? -1 : ((parseInt(b._id) > parseInt(a._id)) ? 1 : 0);} );
                    return Promise.all([
                        Promise.resolve(uitslag),
                        Renners.find({ //Ook zoeken naar de uitgevallen renners
                            $and: [
                                { '_id': { $in: req.user.teamselectie.userrenners } },
                                { 'uitgevallen': true}
                            ]
                        },'_id').exec()
                    ])
                })
                .then(([uitslag, uitgevallen])=>{ //Beide promises doorsturen naar de pagina
                    res.render('./giro/etappe.ejs', {
                        user: req.user,
                        huidig: currentDisplay(),
                        etappe: etappe,
                        deadline: stageStart(etappe),
                        uitgevallen:uitgevallen,
                        uitslagen:uitslag[0].uitslagen
                    });
                })
                .catch(err=>{
                    console.log(err)
                });
            };
        };
    });

    app.get('/giro/eindresultaat', isLoggedIn, function (req, res) {
        var etappe = 21;
        Etappe.findOne({ '_id': etappe }, 'uitslagen creationTime', function (err, uitslag) {
            if (err) throw err;
            User.find({ 'profieldata.poulescore': { $exists: true } }, 'local.username profieldata.poulescore profieldata.totaalscore', { sort: { 'profieldata.totaalscore': -1 } }, function (err, users) {
                var dagscore = users.map(user => user.profieldata.poulescore[etappe]);
                var teamrenners = req.user.teamselectie.userrenners.map(renner => renner._id)
                var teamnamen = req.user.teamselectie.userrenners.map(renner => renner.naam)
                if (err) throw err;
                res.render('./giro/eindresultaat.ejs', {
                    etappe: 22,
                    teamnamen,
                    uitslagen: uitslag.uitslagen,
                    user: req.user, // get the user out of session and pass to template
                    users, //[{id,local{username}},...]
                    dagscore,
                    teamrenners
                });
            });
        });
    });

    app.get('/giro/overzicht', function (req, res) {
        Renners.find({ 'prijs': { $exists: true } }, 'naam team prijs punten', { sort: { 'prijs': -1 } }, function (err, renners) {
            if (err) throw err;
            User.find({ '_id': { $exists: true },'teamselectie.userrenners': {$size: 20} }, 'teamselectie.userrenners local.username groups.budget', function (err, users) {
                if (err) throw err;
                res.render('./giro/overzicht.ejs', {
                    renners: renners,
                    user: req.user,
                    users: users
                });
            });
        });
    });

    app.get('/giro/overzicht/:user', function (req, res) {
        User.findOne({ "local.username": req.params.user }, function (err, user) {
            if (err) throw err;
            if (user == null || user == "") {
                res.redirect('/')
            } else {
                Renners.find({ '_id': { $in: user.teamselectie.userrenners } }, function (err, renners) {
                    var rennersPunten = new Array(20).fill(0);
                    for (i in renners) {
                        for (var j = 0;j<21;j++){
                            if(user.opstellingen[j].opstelling._id.includes(renners[i]._id)){
                                rennersPunten[i]+=renners[i].punten.totaal[j];
                                if(user.groups.budget)
                                    rennersPunten[i]-=renners[i].punten.team.totaal[j];
                            }
                            if(user.opstellingen[j].kopman==renners[i]._id)
                                rennersPunten[i]+=renners[i].punten.dag[j]*.5;
                        }
                        rennersPunten[i]+=renners[i].punten.totaal[21];//eindklassement
                        if(user.groups.budget)
                                    rennersPunten[i]-=renners[i].punten.team.totaal[21];
                    };
                    res.render('./giro/overzichtUser.ejs',{
                        renners,
                        rennersPunten,
                        username: req.params.user
                    })
                });
            }
        })
    })

    app.get('/manualupdate/:race/etappe/:id', isLoggedIn, function (req, res) {
        if (req.user.local.admin) {
            getResult(req.params.race,req.params.id, function () {
                res.status(404).send("Manually updated etappe " + req.params.id);
            });
        } else {
            res.redirect('/')
        }
    })
    app.get('/admin', isLoggedIn, function (req, res) {
        if (req.user.local.admin) {
            res.render('./admin.ejs')
        }else{
            res.redirect('/')}
    })

    app.get('/giro/gemistepunten/:user',isLoggedIn,function(req,res){
        User.findOne({ "local.username": req.params.user }, function (err, user) { 
            if (user == null || user == "") {
                res.redirect('/')
            }
            else{
                optimaleScoresUser(user.teamselectie.userrenners,currentDisplay(),function(bestPossible){
                    var actualPoints = user.profieldata.poulescore.slice(0, currentDisplay());
                    var missedPoints = new Array();
                    for(i in bestPossible){
                        missedPoints[i] = bestPossible[i]-actualPoints[i];
                    }
                    res.render('./giro/gemistePunten.ejs', {
                        missedPoints,
                        actualPoints,
                        bestPossible,
                        username: req.params.user
                    });
                });
            }
        });

    })

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function (req, res) {
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
    res.redirect('/login/?redir=' + encodeURIComponent(req.originalUrl));
}