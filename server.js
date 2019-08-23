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
current_race_id = 15;
current_racename = 'vuelta';
current_year = 2019;
currentstage_global = 0;
functies.setCurrentStage()

//Mongo
if (fs.existsSync('./server/db/Mongo/link.js')) { //Kijken of er een config is
  var configDB = require('./server/db/Mongo/link.js');
} else {
  var configDB = { 'url': process.env.DATABASE_LINK }; //Zo niet gebruik heroku ding
};
var mongoose = require('mongoose');
mongoose.connect(configDB.url, { ssl: true, useNewUrlParser: true  }); // verbinden met sportradenenzo mongodb
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

require('./server/passport')(passport);
require('./server/api/admin')(app)
require('./server/api/authentication')(app)
require('./server/api/manualupdate')(app)
require('./server/api/raceprogression')(app)
require('./server/api/racestatistics')(app)
require('./server/api/stageresults')(app)
require('./server/api/teamselection')(app)
require('./server/api/userparticipation')(app)