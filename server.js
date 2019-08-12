const express = require("express");
const session = require('express-session');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors') //Zorgt voor authentication tussen proxy en server (snap het niet helemaal maar het werkt)
const app = express();
const functies = require('./server/functies');
const fs = require('fs')
app.use(cors({
  credentials: true
}))


//global vars
race_id_global = 6;
currentstage_global = 0;
functies.setCurrentStage()

//Mongo
if (fs.existsSync('./server/db/Mongo/link.js')) { //Kijken of er een config is
  var configDB = require('./server/db/Mongo/link.js');
} else {
  var configDB = { 'url': process.env.DATABASE_LINK }; //Zo niet gebruik heroku ding
};
var mongoose = require('mongoose');
mongoose.connect(configDB.url, { ssl: true }); // verbinden met sportradenenzo mongodb
mongoose.connection.on('error', function (err) {
  console.log(err);
});


//==Passport==
const passport = require('passport');
app.use(morgan('dev'));
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.urlencoded({
  extended: true
}));// get information from html forms
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(session({
  secret: 'speciaalbierishetlekkerstesoortbier',
  resave: true,
  saveUninitialized: false,
  cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());

// Express only serves static assets in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
  const path = require("path");
  app.get("*", (req,res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}else{
  app.get('*',(req,res) => {
    res.sendFile('./client/public/index.html', { root : __dirname})
  })
}

app.set("port", process.env.PORT || 3001);

app.listen(app.get("port"), () => {
  console.log(`Magicka accidit`);
});

var User = require('./server/db/Mongo/models/user');

User.find({'teamselectie.userrenners': {$size: 20}}, function (err, users) {
  if (err) throw err;

  var outputData = '';
  users.forEach(function (user, index) {//get all users
    // user.profieldata.totaalscore = 0;
    // user.profieldata.poulescore = new Array(22).fill(0);
    outputData += "$user " + user.local.username + '\n';
    user.teamselectie.userrenners.forEach(function (rider) {
      outputData += '$rider ' + rider._id + '\n';
    })
    outputData += '$opstellingen' + '\n';
    user.opstellingen.forEach(function (Opstelling) {
      outputData += "$opstelling" + '\n';
      outputData += "$kopman " + Opstelling.kopman + '\n';
      Opstelling.opstelling._id.forEach(function (rider) {
        outputData += "$rider " + rider + '\n';
      })
    })
    // user.teamselectie.userrenners = new Array(0).fill({ '_id': String, 'naam': String, 'team': String, 'prijs': Number }); //haal de renner weg
    // user.opstellingen =  new Array(21).fill({'kopman':String,'opstelling':{'_id':new Array(0),'naam':new Array(0)}}); //Opstellingen resetten
    // user.teamselectie.geld = 47000000;
    // user.markModified('userrenners, opstellingen, geld')
    // user.save(function (err) {
    //   if (err) throw err;
    // });
  })
  fs.writeFile('VueltaBackup.txt', outputData, (err) => { 
      
    // In case of a error throw err. 
    if (err) throw err; 
}) 
})



require('./server/passport')(passport);
require('./server/api/admin')(app)
require('./server/api/authentication')(app)
require('./server/api/manualupdate')(app)
require('./server/api/raceprogression')(app)
require('./server/api/racestatistics')(app)
require('./server/api/stageresults')(app)
require('./server/api/teamselection')(app)
require('./server/api/userparticipation')(app)