// set up ======================================================================
var http = require('http');
var express = require('express');
var app = express();
//var port     = process.env.PORT || 8080;
var fs = require('fs');

//Mongoose voor DB, rest voor authentication dingen
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var Etappe   = require('./app/models/etappe')

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var json         = require('json-stringify-safe');
if (fs.existsSync('./config/database.js')){ //Kijken of er een config is
  var configDB = require('./config/database');
}else{
  var configDB = { 'url' : process.env.DATABASE_LINK}; //Zo niet gebruik heroku ding
};

var schedule = require('node-schedule');

var functies = require('./functies');
var scrape = require('./scrape');

//Configuratie=======================================================
mongoose.connect(configDB.url,{useMongoClient:true,ssl:true}); // verbinden met sportradenenzo mongodb
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
app.use( bodyParser.json() );       // to support JSON-encoded bodies

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
app.set('view engine','ejs');

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
app.listen(process.env.PORT || 5000);
console.log('Die Magie passiert am Tor ' + 5000);

//experiment met het vergaren van userinfo en post info =========== user info lijkt te werken, postinfo niet
var User = require('./app/models/user');
app.post('/profile', bodyParser.urlencoded({ extended: true }), function(req, res) {
  console.log(req.body._favwielerField);
  var fanwiel = req.body._favwielerField;
  var fanclub = req.body._favclubField;
  app.get('/user', function(req, res){
    User.findOne(req.user._id, function(err, user) {
      if (err) throw err;
      req.user.profieldata.favwieler = fanwiel;
      req.user.profieldata.favclub   = fanclub;
    
      // save the user
      req.user.save(function(err) {
        if (err) throw err;
    
        console.log('User successfully updated!');
      });
    });
    });
    res.send(req.body);
});
//==================================================================================================================

app.get('/giro2018', function(req,res) {
  fs.readFile('giro.html', function(err, data){
    res.writeHead(200, {'Content-Type': 'text/html'})
    res.write(data)
    res.end()
  })
})

app.get('/testpost', function(req,res){ 
  fs.readFile('./views/testpost.ejs', function(err, data){
    res.writeHead(200, {'Content-Type': 'text/html'})
    res.write(data)
    res.end()
  })
})

app.get('/test', function(req, res){
  res.redirect('/login');
})

var Renner = require('./app/models/renner');

//Teamselectie ontvangen==================================================================================
app.post('/giro/teamselectie',function(req,res){
  if(req.body.toevoegen==true){ //kijk of er een renner wordt toegevoegd aan de selectie
  User.findOne(req.user._id, function(err, user) {
    if(user.teamselectie.userrenners.length<20){ //kijken of er nog plek is
    Renner.findOne({'_id' : req.body.id}, 'naam team prijs', function(err,renner){
    if(user.teamselectie.geld>=renner.prijs){ //kijken of er nog geld is
    //Kijken of de renner niet al gekozen is
    var dubbel=false;
    for(i=0;i<user.teamselectie.userrenners.length;i++){
      if(user.teamselectie.userrenners[i]._id==renner._id){
        var dubbel=true;
        break;
      };
    };
    if(dubbel==false){
    //Voeg de nieuwe renner toe op de laatste plek
    user.teamselectie.userrenners.push({'_id':renner._id,'naam':renner.naam,'team':renner.team,'prijs':renner.prijs});
    user.teamselectie.geld-=renner.prijs //prijs van het geld af halen
    //Sorteren op prijs van hoog naar laag
    user.teamselectie.userrenners.sort(function(a,b) {return (a.prijs < b.prijs) ? 1 : ((b.prijs < a.prijs) ? -1 : 0);});
    user.markModified('userrenners')
    user.save(function(err) {
      if (err) throw err;
    });
    res.json(user.teamselectie.userrenners);
    }else{res.send();} //renner zit al in team  
    }else{res.send();} //geen geld
    });
    }else{res.send();} //geen plek
  });
  }
  if(req.body.toevoegen==false){ //renner wordt verwijderd uit selectie
    User.findOne(req.user._id, function(err, user) {
      if(req.body.id<user.teamselectie.userrenners.length){ //kijken of er een renner te verwijderen is
      var idverwijderde = user.teamselectie.userrenners[req.body.id]._id; //Nodig om de renner te deselecten zodat deze opnieuw kiesbaar is
      user.teamselectie.geld+=user.teamselectie.userrenners[req.body.id].prijs;
      user.teamselectie.userrenners.splice(req.body.id,1); //haal de renner weg
      user.markModified('userrenners')
      user.save(function(err){
        if(err) throw err;
      });
      res.json(user.teamselectie.userrenners,idverwijderde);
      };
    });
  };
});

//Niet nodig?
app.post('/giro/etappe', function(req,res){
});

//Goed doorverwijzen van /giro gebaseerd op welke etappe bezig is=========================================================
app.get('/giro', function(req, res) { //algemene giro pagina
  if(currentDisplay()===0){
    res.redirect('/giro/teamselectie');
  }else if (currentDisplay()===22){
    res.redirect('/giro/eindresultaat');
  }else{
    res.redirect('/giro/etappe'+currentDisplay());//go to currentDisplay etappe (opstelling of resultaten)
  }
});

app.post('/giro/etappe*', function(req, res){
//Posts van etappe.ejs heeft hetzelfde adres als etapperesultaat.ejs=======================================================
  var queryStart = req.originalUrl.indexOf("etappe") + 6;
  var queryEnd   = req.originalUrl.length + 1; //Query eindigen op einde url
  var query = req.originalUrl.slice(queryStart, queryEnd - 1); //Het nummer isoleren 
  var etappe = parseInt(query,10); //String omzetten naar int (decimaal)
  if(!displayResults(req.body.etappe)){ //Kijken of de deadline nog niet is geweest
    if(req.body.toevoegen==true){ //kijk of er een renner wordt toegevoegd aan de etappeselectie
      User.findOne(req.user._id, function(err, user) {
        //Zorgen dat er een array is om de functies op uit te voeren
        if(user.opstellingen[req.body.etappe-1].opstelling._id.length<9){ //kijken of er nog plek is
        var dubbel=false; //Kijken of de renner niet al in het team zit
        for(i=0;i<user.opstellingen[req.body.etappe-1].opstelling._id.length;i++){
          if(user.opstellingen[req.body.etappe-1].opstelling._id[i]==user.teamselectie.userrenners[req.body.id]._id){
            var dubbel=true;
            break;
          };
        };
        if(dubbel==false){
          //Voeg de naam en id van de renner toe
          user.opstellingen[req.body.etappe-1].opstelling._id.push(user.teamselectie.userrenners[req.body.id]._id);
          user.opstellingen[req.body.etappe-1].opstelling.naam.push(user.teamselectie.userrenners[req.body.id].naam);
          user.markModified('opstellingen') 
          user.save(function(err) {
            if (err) throw err;
          });
        }else{res.send();} //Renner zit al in selectie
        }else{res.send();} //Team zit vol
        res.json(user.opstellingen[req.body.etappe-1].opstelling); //Stuur update terug naar de client
      });
    }
    if(req.body.toevoegen==false){ //renner wordt verwijderd uit selectie
      User.findOne(req.user._id, function(err, user) {
        if(user.opstellingen[req.body.etappe-1].opstelling._id[req.body.id]!=undefined){ //Kijk of er iets is om te verwijderen
        if(user.opstellingen[req.body.etappe-1].opstelling._id[req.body.id]==user.opstellingen[req.body.etappe-1].kopman){
          user.opstellingen[req.body.etappe-1].kopman="" //Als renner==kopman, verwijder de kopman
        };
        var idverwijderde=user.opstellingen[req.body.etappe-1].opstelling._id[req.body.id] //Nodig om te kijken wie unselected is
        user.opstellingen[req.body.etappe-1].opstelling._id.splice(req.body.id, 1); //Verwijder de renner
        user.opstellingen[req.body.etappe-1].opstelling.naam.splice(req.body.id, 1); //Verwijder de renner
        user.markModified('opstellingen')
        user.save(function(err){
          if(err) throw err;
          res.json({'opstelling':user.opstellingen[req.body.etappe-1].opstelling,'idverwijderde':idverwijderde,'kopman':user.opstellingen[req.body.etappe-1].kopman}); //Stuur update terug naar user
        });
      };
      });
    };
    if(req.body.toevoegen=="laden"){ //Het laden van de opstelling bij het laden van een etappe pagina
      User.findOne(req.user._id, function(err, user) {
        if(err) throw err;
        res.json(user.opstellingen[req.body.etappe-1]);
      }); 
    };
    if(req.body.toevoegen=="kopman"){ //Het kiezen van een kopman
      User.findOne(req.user._id, function(err, user) {
        user.opstellingen[req.body.etappe-1].kopman = user.opstellingen[req.body.etappe-1].opstelling._id[req.body.id];
        user.markModified('opstellingen')
        user.save(function(err){
          if(err) throw err;
          res.send(req.body);
        });
      }); 
    }
//Posts van etapperesultaat.ejs heeft hetzelfde adres als etappe.ejs=======================================================
  }else{
    if(req.body.toevoegen=="etapperesultaat"){
      User.findOne(req.user._id, function(err, user) {
        Renner.find({'_id' : {"$in" : user.opstellingen[req.body.etappe-1].opstelling._id}},'_id naam punten', function(err,renners){
          if(err) throw err;
          res.json({'renners' : renners, 'kopman' : user.opstellingen[req.body.etappe-1].kopman});
        });
      });
    }else{
    if(req.body.toevoegen=="teamspopup"){
      if(req.user.local.username=="BudgetBierfietsen" || req.user.local.username=="YannickBudget" || req.user.local.username=="rensBudget" || req.user.local.username=="BudgetSam"){ //Budget usernames toevoegen <+V
          User.find({'$or' :[{'local.username': 'BudgetBierfietsen'},{'local.username':'YannickBudget'},{'local.username':'rensBudget'},{'local.username':'BudgetSam'}]}, 'local.username opstellingen', function(err, users) {
          if(err) throw err;
          res.send(users); //Stuur de data om in de popup te zetten
        });  
      }else{
      //Het lukt niet om find te laten werken voor het eerste element in de etappe opstelling dus maar hardcoded op username
      //Evt. te weinig ruimte op de pagina voor budgetteams
      User.find({'$or' :[{'local.username': 'Rens'},{'local.username':'Bierfietsen'},{'local.username':'Yannick'},{'local.username':'Sam'}]}, 'local.username opstellingen', function(err, users) {
        if(err) throw err;
        res.send(users); //Stuur de data om in de popup te zetten
      });
      };
    }else{console.log('Deadline voorbij!')}} //Deadline is voorbij
   }
});

app.get('/giro/renner/:rennerID', function(req, res){
  console.log("renner exists: "+ fs.existsSync('./views/giro/renner.ejs'));
  Renner.findOne({_id:req.params.rennerID},function(err,renner){
    if(renner!= undefined){
      res.render('./giro/renner.ejs',{
        renner:renner,
        currentStage:currentDisplay()
      });
    }else{
      res.send("Renner not found");
    }
    ;
  })
  
});

app.get('*', function(req, res){
  console.log(req.originalUrl);
  res.redirect('/profile');
});

var scrapeResults = schedule.scheduleJob(' 0 */5 * * * *', function(){
  if(displayResults(currentDisplay())){
    Etappe.findOne({_id:currentDisplay()},function(err,etappe){
      if(!etappe.uitslagKompleet){
        getResult(currentDisplay(),function(){
        });
      }
    })
  }
});

var rule = new schedule.RecurrenceRule();
rule = girodata.etappetijden;

var copyOpstelling = schedule.scheduleJob(rule,function(){
  var etappe = currentDisplay();
  User.find({},function(err,users){
    users.forEach(function(user){
      if(!user.opstellingen[etappe-1].opstelling.naam.length){
        user.opstellingen.set(etappe-1,user.opstellingen[etappe-2]);
        user.save(function(err) {
          if (err) throw err;
        })
      }
    })
  })
});



//app.listen(app.get('port'), function() {
  //console.log("Node app is running at localhost:" + app.get('port'))
//})