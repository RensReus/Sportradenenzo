// set up ======================================================================
var http = require('http');
var express = require('express');
var app = express();
//var port     = process.env.PORT || 8080;
var fs = require('fs');

//Mongoose voor DB, rest voor authentication dingen
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var Etappe = require('./app/models/etappe')

var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var json = require('json-stringify-safe');
if (fs.existsSync('./config/database.js')) { //Kijken of er een config is
  var configDB = require('./config/database');
} else {
  var configDB = { 'url': process.env.DATABASE_LINK }; //Zo niet gebruik heroku ding
};

var schedule = require('node-schedule');

var functies = require('./functies');
var scrape = require('./scrape');

//Configuratie=======================================================
mongoose.connect(configDB.url, { useMongoClient: true, ssl: true }); // verbinden met sportradenenzo mongodb
mongoose.connection.on('error', function (err) {
  console.log(err);
});
require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.urlencoded({
  extended: true
}));// get information from html forms
app.use(bodyParser.json());       // to support JSON-encoded bodies

var girodata = require('./app/girodata'); //haal huidige etappe op

// required for passport
app.use(session({
  secret: 'speciaalbierishetlekkerstesoortbier',
  resave: true,
  saveUninitialized: true
})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public')) //map definieren voor plaatjes
app.set('view engine', 'ejs');

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
app.listen(process.env.PORT || 5000);
console.log('Ad portum ' + 5000 + ' magica accidit');

//experiment met het vergaren van userinfo en post info =========== user info lijkt te werken, postinfo niet
var User = require('./app/models/user');
app.post('/profile', bodyParser.urlencoded({ extended: true }), function (req, res) {
  console.log(req.body._favwielerField);
  var fanwiel = req.body._favwielerField;
  var fanclub = req.body._favclubField;
  app.get('/user', function (req, res) {
    User.findOne(req.user._id, function (err, user) {
      if (err) throw err;
      req.user.profieldata.favwieler = fanwiel;
      req.user.profieldata.favclub = fanclub;

      // save the user
      req.user.save(function (err) {
        if (err) throw err;

        console.log('User successfully updated!');
      });
    });
  });
  res.send(req.body);
});
//==================================================================================================================

app.get('/giro2018', function (req, res) {
  fs.readFile('giro.html', function (err, data) {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.write(data)
    res.end()
  })
})

app.get('/testpost', function (req, res) {
  fs.readFile('./views/testpost.ejs', function (err, data) {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.write(data)
    res.end()
  })
})

app.get('/test', function (req, res) {
  getStartlist(function(){
    res.send("test")
  })
})

var Renner = require('./app/models/renner');

//Teamselectie ontvangen==================================================================================
app.post('/giro/teamselectie', function (req, res) {
  if (req.body.toevoegen == true) { //kijk of er een renner wordt toegevoegd aan de selectie
    User.findOne(req.user._id, function (err, user) {
      if (user.teamselectie.userrenners.length < 20) { //kijken of er nog plek is
        Renner.findOne({ '_id': req.body.id }, 'naam team prijs', function (err, renner) {
          if (user.teamselectie.geld >= renner.prijs) { //kijken of er nog geld is
            //Kijken of de renner niet al gekozen is
            var dubbel = false;
            for (i = 0; i < user.teamselectie.userrenners.length; i++) {
              if (user.teamselectie.userrenners[i]._id == renner._id) {
                var dubbel = true;
                break;
              };
            };
            if (dubbel == false) {
              //Voeg de nieuwe renner toe op de laatste plek
              user.teamselectie.userrenners.push({ '_id': renner._id, 'naam': renner.naam, 'team': renner.team, 'prijs': renner.prijs });
              user.teamselectie.geld -= renner.prijs //prijs van het geld af halen
              //Sorteren op prijs van hoog naar laag
              user.teamselectie.userrenners.sort(function (a, b) { return (a.prijs < b.prijs) ? 1 : ((b.prijs < a.prijs) ? -1 : 0); });
              user.markModified('userrenners')
              user.save(function (err) {
                if (err) throw err;
              });
              res.json(user.teamselectie.userrenners);
            } else { res.send(); } //renner zit al in team  
          } else { res.send(); } //geen geld
        });
      } else { res.send(); } //geen plek
    });
  }
  if (req.body.toevoegen == false) { //renner wordt verwijderd uit selectie
    User.findOne(req.user._id, function (err, user) {
      if (req.body.id < user.teamselectie.userrenners.length) { //kijken of er een renner te verwijderen is
        var idverwijderde = user.teamselectie.userrenners[req.body.id]._id; //Nodig om de renner te deselecten zodat deze opnieuw kiesbaar is
        user.teamselectie.geld += user.teamselectie.userrenners[req.body.id].prijs;
        user.teamselectie.userrenners.splice(req.body.id, 1); //haal de renner weg
        user.markModified('userrenners')
        user.save(function (err) {
          if (err) throw err;
        });
        res.json(user.teamselectie.userrenners, idverwijderde);
      };
    });
  };
});

//Niet nodig?
app.post('/giro/etappe', function (req, res) {
});

//Goed doorverwijzen van /giro gebaseerd op welke etappe bezig is=========================================================
app.get('/giro', function (req, res) { //algemene giro pagina
  if (currentDisplay() === 0) {
    res.redirect('/giro/teamselectie');
  } else if (currentDisplay() === 22) {
    res.redirect('/giro/eindresultaat');
  } else {
    res.redirect('/giro/etappe' + currentDisplay());//go to currentDisplay etappe (opstelling of resultaten)
  }
});

app.post('/giro/etappes', function (req, res) {

  // Deadline is voorbij
  if (displayResults(req.body.etappe)) {
    console.log("deadline voorbij");
    res.send();
    return;
  }

  // Kijk of er een renner wordt toegevoegd aan de etappeselectie
  if (req.body.status == "toevoegen") {
    User.findOne(req.user._id)
      .exec()
      .then(user => {
        // Kijk of er nog plek is
        if (user.opstellingen[req.body.etappe - 1].opstelling._id.length > 8) {
          return Promise.reject();
        }

        // Kijk of de renner is uitgevallen
        return Promise.all([
          Promise.resolve(user),
          Renner.count({
            $and: [
              { 'uitgevallen': true },
              { '_id': user.teamselectie.userrenners[req.body.id]._id },
            ]
          }).exec()
        ]);
      })
      .then(([user, uitgevallen]) => {
        if (uitgevallen > 0) {
          return Promise.reject();
        }

        //Kijken of de renner niet al in het team zit
        if (user.opstellingen[req.body.etappe - 1].opstelling._id.indexOf(user.teamselectie.userrenners[req.body.id]._id) !== -1) {
          return Promise.reject();
        };

        //Voeg de naam en id van de renner toe
        user.opstellingen[req.body.etappe - 1].opstelling._id.push(user.teamselectie.userrenners[req.body.id]._id);
        user.opstellingen[req.body.etappe - 1].opstelling.naam.push(user.teamselectie.userrenners[req.body.id].naam);
        user.markModified('opstellingen')
        user.save(function (err) {
          if (err) throw err;
          res.json(user.opstellingen[req.body.etappe - 1].opstelling); //Stuur update terug naar de client
        });
      })
      .catch(err => {
        res.send();
      });
  };

  if (req.body.status == "verwijderen") { //renner wordt verwijderd uit selectie
    User.findOne(req.user._id)
      .exec()
      .then(user => {
        if (user.opstellingen[req.body.etappe - 1].opstelling._id[req.body.id] == undefined) { //Kijk of er iets is om te verwijderen
          res.send()
          return Promise.reject();
        }
        if (user.opstellingen[req.body.etappe - 1].opstelling._id[req.body.id] == user.opstellingen[req.body.etappe - 1].kopman) {
          user.opstellingen[req.body.etappe - 1].kopman = "" //Als renner==kopman, verwijder de kopman
        };
        var idverwijderde = user.opstellingen[req.body.etappe - 1].opstelling._id[req.body.id] //Nodig om te kijken wie unselected is
        user.opstellingen[req.body.etappe - 1].opstelling._id.splice(req.body.id, 1); //Verwijder de renner (id)
        user.opstellingen[req.body.etappe - 1].opstelling.naam.splice(req.body.id, 1); //Verwijder de renner (naam)
        user.markModified('opstellingen')
        user.save(function (err) {
          if (err) throw err;
        });
        res.json({ 'opstelling': user.opstellingen[req.body.etappe - 1].opstelling, 'idverwijderde': idverwijderde, 'kopman': user.opstellingen[req.body.etappe - 1].kopman }); //Stuur update terug naar user
      });
  };

  if (req.body.status == "laden") { //Het laden van de opstelling bij het laden van een etappe pagina
    User.findOne(req.user._id)
      .exec()
      .then(user => {
        return Promise.all([
          Promise.resolve(user),
          Renner.find({
            $and: [
              { '_id': { $in: user.teamselectie.userrenners } },
              { 'uitgevallen': true }
            ]
          }, '_id').exec() //Kijk of een renner is uitgevallen
        ]);
      })
      .then(([user, uitgevallen]) => {
        for (var i = 0; i < uitgevallen.length; i++) {
          if (user.opstellingen[req.body.etappe - 1].opstelling._id.indexOf(uitgevallen[i]) !== -1) {
            user.opstellingen[req.body.etappe - 1].opstelling._id.splice(user.opstellingen[req.body.etappe - 1].opstelling._id.indexOf(uitgevallen[i]))
            user.opstellingen[req.body.etappe - 1].opstelling.naam.splice(user.opstellingen[req.body.etappe - 1].opstelling._id.indexOf(uitgevallen[i]))
          }
        }
        user.markModified('opstellingen')
        user.save(function (err) {
          if (err) throw err;
        });
        res.json({ 'opstellingen': user.opstellingen[req.body.etappe - 1], 'uitgevallen': uitgevallen });
      })
      .catch(err => {
        console.log(err)
      });
  };

  if (req.body.status == "kopman") { //Het kiezen van een kopman
    User.findOne(req.user._id)
      .exec()
      .then(user => {
        user.opstellingen[req.body.etappe - 1].kopman = user.opstellingen[req.body.etappe - 1].opstelling._id[req.body.id];
        user.markModified('opstellingen')
        user.save(function (err) {
          if (err) throw err;
          res.send();
        });
      });
  };
});

app.post('/giro/etapperesultaat', function (req, res) {
  if (req.body.status == "etapperesultaat") { //Laden van de resultatenpagina
    User.findOne(req.user._id, function (err, user) {
      Renner.find({ '_id': { "$in": user.opstellingen[req.body.etappe - 1].opstelling._id } }, '_id naam punten', function (err, renners) {
        if (err) throw err;
        res.json({ 'renners': renners, 'kopman': user.opstellingen[req.body.etappe - 1].kopman });
      });
    });
  }

  if (req.body.status == "teamspopup") { //Popup voor de teams
    if (req.user.groups.budget) { //Kijken of het een budgetaccount is
      User.find({ '$or': [{ 'local.username': 'BudgetBierfietsen' }, { 'local.username': 'YannickBudget' }, { 'local.username': 'rensBudget' }, { 'local.username': 'BudgetSam' }] }, 'local.username opstellingen', function (err, users) {
        if (err) throw err;
        res.send(users); //Stuur de data om in de popup te zetten
      });
    } else {
      //Het lukt niet om find te laten werken voor het eerste element in de etappe opstelling dus maar hardcoded op username
      User.find({ '$or': [{ 'local.username': 'Rens' }, { 'local.username': 'Bierfietsen' }, { 'local.username': 'Yannick' }, { 'local.username': 'Sam' }] }, 'local.username opstellingen', function (err, users) {
        if (err) throw err;
        res.send(users); //Stuur de data om in de popup te zetten
      });
    };
  };
});

app.get('/giro/renner/:rennerID', function (req, res) {
  console.log("renner exists: " + fs.existsSync('./views/giro/renner.ejs'));
  Renner.findOne({ _id: req.params.rennerID }, function (err, renner) {
    if (renner != undefined) {
      res.render('./giro/renner.ejs', {
        renner: renner,
        currentStage: currentDisplay()
      });
    } else {
      res.send("Renner not found");
    }
    ;
  })

});

app.get("/onderweg", function (req, res) {
  getTimetoFinish(currentDisplay(), function (togo) {
    res.send(togo);
  })
})

app.get('*', function (req, res) {
  console.log(req.originalUrl);
  res.redirect('/profile');
});

var resultsRule = new schedule.RecurrenceRule()
var finished = false;
// checkt 1x of de etappe bijna gefinisht is en stelt de benodige frequentie in
getTimetoFinish(function (timeFinish) {// check hoe lang nog tot the finish
  finished = timeFinish[0]; // returns boolean
  resultsRule = timeFinish[1]; // returns ieder uur als de finish nog verweg is, ieder 5 min indien dichtbij en iedere min na de finish
  scrapeResults.reschedule(resultsRule);  //update new schedule
})


var scrapeResults = schedule.scheduleJob(resultsRule, function () {
  console.log("scrape run at: " + new Date().toTimeString());
  Etappe.findOne({ _id: currentDisplay() }, function (err, etappe) {
    if (!finished && !etappe.uitslagKompleet && displayResults(currentDisplay())) { // als de etappe niet gefinisht is
      getTimetoFinish(function (timeFinish) {// check hoe lang nog tot the finish
        finished = timeFinish[0]; // returns boolean
        resultsRule = timeFinish[1]; // returns ieder uur als de finish nog verweg is, ieder 5 min indien dichtbij en iedere min na de finish
        scrapeResults.reschedule(resultsRule);  //update new schedule
      })
    }
    if (finished) { // dit wordt iedere minuut na de finish uitgevoerd tot de resultaten compleet zijn
      if (!etappe.uitslagKompleet) {
        getResult(currentDisplay(), function () {
        });
      } else {
        resultsRule = new schedule.RecurrenceRule(); // geen update meer nadat de uitslag compleet is
        resultsRule.minute = 40;// minuut attribut overschrijven
        resultsRule.hour = 15;// gaat nu 1x om 15.40 maar wordt inprincipe door de copyopstelling al eerder herstart
        scrapeResults.reschedule(resultsRule);            
        finished = false;// zorgt ervoor dat de scrape gaat kijken of de etappe gefinisht is ipv uitslag ophalen
      }
    }
  })
});

var legeOpstellingRule = new schedule.RecurrenceRule();
legeOpstellingRule = girodata.etappetijden;

var copyOpstelling = schedule.scheduleJob(legeOpstellingRule, function () {
  resultsRule.hour = new schedule.Range(0, 23, 1); // na de start ieder uur checken tenzij frequentie wordt verhoogd door getTimeofFinish
  scrapeResults.reschedule(resultsRule);    
  var etappe = currentDisplay();
  User.find({}, function (err, users) {
    users.forEach(function (user) {
      if (!user.opstellingen[etappe - 1].opstelling.naam.length) {
        user.opstellingen.set(etappe - 1, user.opstellingen[etappe - 2]);
        user.save(function (err) {
          if (err) throw err;
        })
      }
    })
  })
});
