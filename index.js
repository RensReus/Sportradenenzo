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
var MongoStore = require('connect-mongo')(session);
var json = require('json-stringify-safe');
if (fs.existsSync('./config/database.js')) { //Kijken of er een config is
  var configDB = require('./config/database');
} else {
  var configDB = { 'url': process.env.DATABASE_LINK }; //Zo niet gebruik heroku ding
};

if(fs.existsSync('./config/sqlDB.js')){
  var sqlDBstring = require('./config/sqlDB.js');
}else{
  var sqlDBstring = process.env.DATABASE_URL;
}

const { Client } = require('pg');

const sqlDB = new Client({
  connectionString: sqlDBstring,
  ssl: true,
});

sqlDB.connect();

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

var starttijden = require('./app/starttijden'); //haal huidige etappe op

// required for passport
app.use(session({
  secret: 'speciaalbierishetlekkerstesoortbier',
  resave: true,
  saveUninitialized: true,
  store: new MongoStore({ mongooseConnection: mongoose.connection })
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

app.get('/getstartlist/:race', function (req, res) {
  getStartlist(req.params.race,function () {
    res.send("test")
  })
  console.log("getstartlist")
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
    if (req.user.opstellingen[req.body.etappe - 1].opstelling._id.length > 8) { //Kijk of er nog plek is
      res.send();
      return;
    };
    if (req.user.opstellingen[req.body.etappe - 1].opstelling._id.indexOf(req.body.id) !== -1) { //Kijk of de renner niet al in het team zit
      res.send()
      return;
    }
    for (var i = 0; i < req.user.teamselectie.userrenners.length; i++) { //Kijk of de renner in de teamselectie zit
      if (req.user.teamselectie.userrenners[i]._id === req.body.id) {
        found = true;
        break;
      }
    }
    if (!found) {
      res.send()
      return;
    }
    //Voeg de naam en id van de renner toe
    req.user.opstellingen[req.body.etappe - 1].opstelling._id.push(req.body.id);
    req.user.opstellingen[req.body.etappe - 1].opstelling.naam.push(req.body.naam);
    req.user.markModified('opstellingen')
    req.user.save(function (err) {
      if (err) console.log("User.save error: " + err);
    });
    res.json({ 'id': req.body.id, 'naam': req.body.naam, 'etappe': req.body.etappe }); //Stuur update terug naar de client
  };

  if (req.body.status == "verwijderen") { //renner wordt verwijderd uit selectie
    if (req.user.opstellingen[req.body.etappe - 1].opstelling._id.indexOf(req.body.id) === -1) { //Kijk of er iets is om te verwijderen
      res.send()
      return;
    }
    if (req.body.id == req.user.opstellingen[req.body.etappe - 1].kopman) {
      req.user.opstellingen[req.body.etappe - 1].kopman = "" //Als renner==kopman, verwijder de kopman
    };
    req.user.opstellingen[req.body.etappe - 1].opstelling.naam.splice(req.user.opstellingen[req.body.etappe - 1].opstelling._id.indexOf(req.body.id), 1); //Verwijder de renner (naam)
    req.user.opstellingen[req.body.etappe - 1].opstelling._id.splice(req.user.opstellingen[req.body.etappe - 1].opstelling._id.indexOf(req.body.id), 1); //Verwijder de renner (id)
    req.user.markModified('opstellingen')
    req.user.save(function (err) {
      if (err) console.log("User.save error: " + err);
    });
    res.json({ 'id': req.body.id, 'naam': req.body.naam, 'kopman': req.user.opstellingen[req.body.etappe - 1].kopman, 'etappe': req.body.etappe }); //Stuur update terug naar user 
  };

  if (req.body.status == "laden") { //Het laden van de opstelling bij het laden van een etappe pagina
    res.json({ 'opstellingen': req.user.opstellingen[req.body.etappe - 1], 'team': req.user.teamselectie.userrenners, 'etappe': req.body.etappe }); //Stuur opstelling en etappenummer door
  };

  if (req.body.status == "kopman") { //Het kiezen van een kopman
    if (req.user.opstellingen[req.body.etappe - 1].opstelling._id.indexOf(req.body.id) !== -1) { //Kijk of de kopman in de opstelling zit
      req.user.opstellingen[req.body.etappe - 1].kopman = req.body.id; //Voeg toe
      req.user.markModified('opstellingen')
      req.user.save(function (err) {
        if (err) console.log("User.save error: " + err);
      });
    };
    res.send(); //Hoeft geen data terug
  };
});

app.post('/giro/etapperesultaat', function (req, res) {
  if (req.body.status == "eindresultaat") { //Laden van de resultatenpagina
    Renner.find({ '_id': { "$in": req.user.teamselectie.userrenners.map(renner => renner._id) } }, '_id naam punten', function (err, renners) {
      if (err) throw err;
      res.json({ 'renners': renners});
    });
  }
  if (req.body.status == "etapperesultaat") { //Laden van de resultatenpagina
    Renner.find({ '_id': { "$in": req.user.opstellingen[req.body.etappe - 1].opstelling._id } }, '_id naam punten', function (err, renners) {
      if (err) throw err;
      res.json({ 'renners': renners, 'kopman': req.user.opstellingen[req.body.etappe - 1].kopman });
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

app.post('/admin', function (req, jsres) {
  console.log(req.body.data);
  var sqlQuery = req.body.data;
  if (req.user.local.admin) {
    sqlDB.query(sqlQuery,
      (err,sqlres)=>{
        if (err){
          throw err;
        }
        console.log(sqlres);
        
        switch(sqlres.command){
          case 'SELECT':
          var output = "";
          var cols = new Array();
          for (var i in sqlres.fields){
            output += sqlres.fields[i].name + "\t";
            cols[i] = sqlres.fields[i].name;
          }
          output += "\n";
          for(var i in sqlres.rows){
            var row = sqlres.rows[i];
            for(var j in cols)
            output += row[cols[j]] + "\t";
            output += "\n";
          }
          jsres.json({'data': output});
          break;
          default:
          jsres.json({ 'data': JSON.stringify(sqlres.command) + " return not yet implemented\n" + JSON.stringify(sqlres)})
        }
      })
  }
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

app.get("/giro/charts/", function (req, res) {
  User.find({},'profieldata.poulescore local.username groups', function (err, users) {
    if (err) throw err;
    if (users == null || users == "") {
      res.redirect('/')
    } else {
      users=users.slice(0,8);
      var usernames = users.map(user => user.local.username);
      var scores = [];
      users.forEach(function (user, index) {
        scores.push(user.profieldata.poulescore);
      })
      console.log(scores.length)
      res.render('./giro/charts.ejs', {
        scores,
        usernames
      });;
    }
  })
})

app.get('/trivia', function (req, res) {
  console.log("trivia");
  res.render('./trivia');
});

app.get('/export', function (req, res) {
  User.find({}, function (err, users) {
    if (err) throw err;
    users.forEach(function (user, index) {//get all users

        console.log("$user " + user.local.username);
        user.teamselectie.userrenners.forEach(function(rider){
            console.log('$rider ' + rider._id);
        })
        console.log('$opstellingen')
        user.opstellingen.forEach(function(Opstelling){
            console.log("$opstelling")
            console.log("$kopman" + Opstelling.kopman);
            Opstelling.opstelling._id.forEach(function(rider){
                console.log("$rider " + rider);
            })
        })
        user.teamselectie.userrenners = new Array(0).fill({'_id':String,'naam':String,'team':String,'prijs':Number}); //haal de renner weg
        user.teamselectie.geld = 56000000;
        user.markModified('userrenners, geld')
        user.save(function (err) {
          if (err) throw err;
        });
    })
})
});

app.get('*', function (req, res) {
  console.log(req.originalUrl);
  res.redirect('/profile');
});

var resultsRule = new schedule.RecurrenceRule()
var finished = false;
// checkt 1x of de etappe bijna gefinisht is en stelt de benodige frequentie in
getTimetoFinish(function (timeFinish) {// check hoe lang nog tot the finish
  console.log("first run");
  finished = timeFinish[0]; // returns boolean
  resultsRule = timeFinish[1]; // returns ieder uur als de finish nog verweg is, ieder 5 min indien dichtbij en iedere min na de finish
  scrapeResults.reschedule(resultsRule);  //update new schedule
})


var scrapeResults = schedule.scheduleJob(resultsRule, function () {
  console.log("scrape run at: " + new Date().toTimeString());
  var etNR = currentDisplay();
  if(currentDisplay() === 22){
    etNR = 21;
  }
  Etappe.findOne({ _id: etNR }, function (err, etappe) {
    if (!finished && !etappe.uitslagKompleet && displayResults(etNR)) { // als de etappe niet gefinisht is
      getTimetoFinish(function (timeFinish) {// check hoe lang nog tot the finish
        finished = timeFinish[0]; // returns boolean
        resultsRule = timeFinish[1]; // returns ieder uur als de finish nog verweg is, ieder 5 min indien dichtbij en iedere min na de finish
        scrapeResults.reschedule(resultsRule);  //update new schedule
      })
    }
    if (finished) { // dit wordt iedere minuut na de finish uitgevoerd tot de resultaten compleet zijn
      if (!etappe.uitslagKompleet) {
        getResult('tour', etNR, function () {
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
legeOpstellingRule = starttijden.etappetijden;

var copyOpstelling = schedule.scheduleJob(legeOpstellingRule, function () {
  resultsRule.hour = new schedule.Range(0, 23, 1); // na de start ieder uur checken tenzij frequentie wordt verhoogd door getTimeofFinish
  scrapeResults.reschedule(resultsRule);
  var etappe = currentDisplay();
  if(etappe<22 && etappe>0){
  User.find({}, function (err, users) {
    if (err) throw err;
    if(users.length){
      users.forEach(function (user) {
        if (!user.opstellingen[etappe - 1].opstelling.naam.length) {
          user.opstellingen.set(etappe - 1, user.opstellingen[etappe - 2]);
          user.save(function (err) {
            if (err) throw err;
          })
        }
      })
    }
  })
}
});
