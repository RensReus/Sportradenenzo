const express = require("express");
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors') //Zorgt voor authentication tussen proxy en server (snap het niet helemaal maar het werkt)
const app = express();
const fs = require('fs')
app.use(cors({
  credentials: true
}))


//global vars
var current_race_id = 15;
var current_racename = 'vuelta';
var current_year = 2019;
var current_stage = 0;
const scrape = require('./server/scrape');
scrape.setCurrentStage(current_race_id)

//Mongo
var configDB;
if (fs.existsSync('./src/server/db/Mongo/link.js')) { //Kijken of er een config is
  configDB = require('./server/db/Mongo/link.js');
} else {
  configDB = { 'url': process.env.DATABASE_LINK }; //Zo niet gebruik heroku ding
};
var mongoose = require('mongoose');
mongoose.connect(configDB.url, { ssl: true, useNewUrlParser: true }); // verbinden met sportradenenzo mongodb
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
app.use(passport.initialize());

// Express only serves static assets in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static("build/client/build"));
  const path = require("path");
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "build", "client", "build", "index.html"));
  });
} else {
  app.get('*', (req, res) => {
    res.sendFile('./src/client/public/index.html', { root: __dirname })
  })
}

app.set("port", process.env.PORT || 3001);

app.listen(app.get("port"), () => {
  console.log(`Magicka accidit`);
});

require('./server/passport')(passport);
require('./server/api/authorization')(app) //Belangrijk! Moet bovenaan de lijst staan
require('./server/api/admin')(app)
require('./server/api/authentication')(app)
require('./server/api/manualupdate')(app, current_race_id)
require('./server/api/raceprogression')(app, current_racename, current_year, current_stage)
require('./server/api/racestatistics')(app, current_race_id)
require('./server/api/stageresults')(app)
require('./server/api/teamselection')(app, current_race_id, current_stage)
require('./server/api/userparticipation')(app, current_race_id)