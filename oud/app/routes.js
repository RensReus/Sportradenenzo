var scrape = require('./../scrape');
var async = require('async');
var SQLread = require('./../SQLread')


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
        res.redirect('/temp'); // scheelt iedere keer weer klikken en de index pagina istoch kaal
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
        var redirectURL = '/temp';
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
                users: users //[{id,local{username}},...]
            });
        });
    });

    app.get('/temp', isLoggedIn, function(req,res){
        res.render('giro.ejs',{
            account: req.account
        })
    })

    app.get('/:race/:year/teamselectie', isLoggedIn, function (req, res) {
        if (!currentDisplay()) {//returns 0 before start
            async.auto({
                userSelection:  SQLread.getTeamSelection(req.params.race,req.params.year,req.account.account_id,callback),
                allRiders:      SQLread.getAllRiders(req.params.race,req.params.year,callback),
                race:           SQLread.getRace(req.params.race,req.params.year,callback)
            },function(err,results){
                if(err) throw err;
                var totalBudget = results.race.budget;
                var bugdetRemaining = totalBudget - sum(results.userSelection.rows.map(rider => rider.price));
                res.render('./giro/teamselectie.ejs', {
                    renners: results.allRiders.rows,
                    userrenners: results.userSelection.rows,
                    bugdetRemaining
                });
            });
        } else {
            res.redirect(`/${req.params.race}/${req.params.year}`);
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

    
    app.get('/:race/:year/etappe/:stage', isLoggedIn, function(req, res){
        if (!currentDisplay()) { // geen redirect als de ronde begonnen is
            SQLread.getTeamSelection(req.params.race,req.params.year,req.account.account_id,function(err,teamSelection){
                if(teamSelection.length <20) res.redirect("/:race/:year/teamselectie");
            })
        }else{
            
            if (isNaN(stage)|| stage < 1 || stage > 21) { //Kijken of het een nummer is en of het geen ongeldig nummer is
                res.redirect("/:race/:year")//TODO redirect vergelijkbaar met /giro
            }
            if(displayResults(stage)){//display stage results
                async.auto({
                    stageSelections:    SQLread.getStageSelections()
                },function(err,results){
                    if(err) throw err;
                    
                });
            }else{// display stage selection
                async.auto({
                    
                },function(err,results){
                    if(err) throw err;
                    
                });
            }
        }
    })

    app.get('/:race/:year/etappe/:stage/:user', isLoggedIn, function(req, res){
    })

    //Voor de aanvraag van een etappe pagina------------------------------------------
    app.get('/giro/etappe/:etappe', isLoggedIn, function (req, res) {
        if (req.user.teamselectie.userrenners.length < 20 && !currentDisplay()) { // geen redirect als de ronde begonnen is
            res.redirect("/giro/teamselectie");
        }
        //Request de url en zoek het nummer om te weten welke etappe wordt gevraagd, knippen na etappe
        var etappe = parseInt(req.params.etappe); //String omzetten naar int (decimaal)
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

    app.get('/giro/etappe/:etappe/:user', isLoggedIn, function (req, res) {
        //Request de url en zoek het nummer om te weten welke etappe wordt gevraagd, knippen na etappe
        var etappe = parseInt(req.params.etappe); //String omzetten naar int (decimaal)
        User.findOne({ "local.username": req.params.user }, function (err, user) {
            if (err) throw err;
            if (user == null || user == "") {
                res.redirect('/')
            } else {
                if (isNaN(etappe)|| etappe < 1 || etappe > 21) { //Kijken of het een nummer is en of het geen ongeldig nummer is
                    res.redirect("/giro")//send to currentDisplay
                } else {
                    if (displayResults(etappe)) { //returns true if etappe finished
                        Etappe.findOne({ '_id': etappe }, 'uitslagen creationTime', function (err, uitslag) {
                            if (err) throw err;
                            User.find({ 'profieldata.poulescore': { $exists: true } }, 'local.username profieldata.poulescore profieldata.totaalscore', { sort: { 'profieldata.totaalscore': -1 } }, function (err, users) {
                                var dagscore = users.map(user => user.profieldata.poulescore[etappe - 1]);
                                var teamrenners = user.teamselectie.userrenners.map(renner => renner._id)
                                if (err) throw err;
                                res.render('./giro/etapperesultaat.ejs', {
                                    opstelling: user.opstellingen[etappe - 1].opstelling.naam,
                                    opstellingIDs: user.opstellingen[etappe - 1].opstelling._id,
                                    huidig: currentDisplay(),
                                    etappe,
                                    uitslagen: uitslag.uitslagen,
                                    user: user, // get the user out of session and pass to template
                                    users, //[{id,local{username}},...]
                                    dagscore,
                                    teamrenners,
                                    otheruser: true
                                });
                            });
                        });
                    } else {// if false redirect to opstelling
                        res.redirect(`/giro/etappe/${req.params.etappe}`);
                    };
                };
            }
        })
    });


    app.get('/:race/:year/eindresultaat', isLoggedIn, function (req, res) {
        async.auto({
            userSelection:  SQLread.getTeamSelection(req.params.race,req.params.year,req.account.account_id,callback),
            allRiders:      SQLread.getAllRiders(req.params.race,req.params.year,callback),
            race:           SQLread.getRace(req.params.race,req.params.year,callback)
        },function(err,results){
            if(err) throw err;
            var totalBudget = results.race.budget;
            var bugdetRemaining = totalBudget - sum(results.userSelection.rows.map(rider => rider.price));
            res.render('./giro/eindresultaat.ejs', {
                stage: 22,
                teamnamen,
                uitslagen: uitslag.uitslagen,
                user: req.user, // get the user out of session and pass to template
                users, //[{id,local{username}},...]
                dagscore,
                teamrenners
            });
        });
    })

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

    app.get('/:raceName/:year/overzicht/:account', function(req,res){
        async.auto({
            userSelection:  SQLread.getTeamSelection(req.params.race,req.params.year,req.params.account,function(err,results){
                console.log("userselection")
                console.log(results)
            }),
            allRiders:      SQLread.getAllRiders(req.params.race,req.params.year,function(err,results){
                console.log("allRiders")
                console.log(results)
            })
        },function(err,results){
            if(err) throw err;
            res.render('./giro/eindresultaat.ejs', {
                stage: 22,
                teamnamen,
                uitslagen: uitslag.uitslagen,
                user: req.user, // get the user out of session and pass to template
                users, //[{id,local{username}},...]
                dagscore,
                teamrenners
            });
        });
    })

    app.get('/giro/overzicht', function (req, res) {//een lijst van alle renners met prijs aantalpunten en hoe vaak gekozen
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

    app.get('/giro/overzicht/:user', function (req, res) {//per user alle geselecteerde renners en opgeleverde punten
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

    app.get('/manualupdate/:race/:year/etappe/:id', isLoggedIn, function (req, res) {
        if (req.account.admin) {
            getResult(req.params.race, req.params.year, req.params.id, function () {
                res.status(404).send("Manually updated etappe " + req.params.id);
            });
        } else {
            res.redirect('/')
        }
    })

    app.get('/manualupdate/:race/:year/alle', isLoggedIn, function (req, res) {
        if (req.account.admin) {
            for(var i = 1; i<22;i++){
                getResult(req.params.race, req.params.year, i, function () {
                    
                    console.log("Manually updated etappe " + i);
                });
            }
        res.status(404).send("Manually updated alle etappes");
        } else {
            res.redirect('/')
        }
    })

    app.get('/admin', isLoggedIn, function (req, res) {
        if (req.account.admin) {
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
