const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const app = express();

// Global vars
const current_race = { id: 17, name: 'tour', year: 2020 };
let current_stage = 0;
// Get current stage
const scrape = require('./server/scrape');
// current_stage = scrape.setCurrentStage(current_race) //TODO rens fix require and promise combination
//   .then((res) => {
//     current_stage = res;
//   })
//   .catch((res) => {
//     console.log(res);
//   });

// Mongo
let configDB;
if (fs.existsSync('./src/server/db/Mongo/link.js')) { // Kijken of er een config is
  configDB = require('./server/db/Mongo/link.js');
} else {
  configDB = process.env.DATABASE_LINK; // Zo niet gebruik heroku env var
}
const mongoose = require('mongoose');
mongoose.connect(configDB, { ssl: true, useUnifiedTopology: true, useNewUrlParser: true }); // verbinden met sportradenenzo mongodb
mongoose.connection.on('error', (err) => {
  console.log(err);
});


// Passport
const passport = require('passport');
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

// Load the api
require('./server/passport')(passport);
require('./server/api/authorization')(app); // Belangrijk! Moet bovenaan de lijst staan
require('./server/api/admin')(app);
require('./server/api/authentication')(app);
require('./server/api/manualupdate')(app, current_race);
require('./server/api/raceprogression')(app, current_race, current_stage);
require('./server/api/racestatistics')(app);
require('./server/api/charts')(app);
require('./server/api/stageresults')(app, current_race);
require('./server/api/teamselection')(app, current_race, current_stage);
require('./server/api/userparticipation')(app, current_race);