import express = require('express');
import morgan = require('morgan');
import bodyParser = require('body-parser');
import cookieParser = require('cookie-parser');
import fs = require('fs');
import path = require('path');
const app = express();

// Global vars
const current_race = {id: 15, name: 'vuelta', year: 2019};
var current_stage = 0;
import scrape = require('./server/scrape');
scrape.setCurrentStage(current_race.id);

// Mongo
let configDB: string;
if (fs.existsSync('./src/server/db/Mongo/link.js')) { // Kijken of er een config is
  configDB = require('./server/db/Mongo/link.js');
} else {
  configDB = process.env.DATABASE_LINK; // Zo niet gebruik heroku env var
}
import mongoose = require('mongoose');
mongoose.connect(configDB, { ssl: true, useNewUrlParser: true }); // verbinden met sportradenenzo mongodb
mongoose.connection.on('error', (err) => {
  console.log(err);
});


// Passport
import passport = require('passport');
app.use(morgan('dev'));
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.urlencoded({
  extended: true,
})); // get information from html forms
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(passport.initialize());

// Express only serves static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('build/client/build'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'build', 'client', 'build', 'index.html'));
  });
} else {
  app.get('*', (req, res) => {
    res.sendFile('./src/client/public/index.html', { root: __dirname });
  });
}

app.set('port', process.env.PORT || 3001);

app.listen(app.get('port'), () => {
  console.log(`Magicka accidit`);
});

require('./server/passport')(passport);
require('./server/api/authorization')(app); // Belangrijk! Moet bovenaan de lijst staan
require('./server/api/admin')(app);
require('./server/api/authentication')(app);
require('./server/api/manualupdate')(app, current_race);
require('./server/api/raceprogression')(app, current_race, current_stage);
require('./server/api/racestatistics')(app, current_race);
require('./server/api/stageresults')(app);
require('./server/api/teamselection')(app, current_race, current_stage);
require('./server/api/userparticipation')(app, current_race);
