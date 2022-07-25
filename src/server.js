import { startSchedule } from "./server/scrape";
const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const app = express();

// Get start autoscrape
startSchedule()

// Mongo
let configDB;
if (fs.existsSync('./src/server/db/Mongo/link.js') || fs.existsSync('./build/server/db/Mongo/link.js')) {
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
app.use(express.urlencoded({
  extended: true,
})); // get information from html forms
app.use(express.json());       // to support JSON-encoded bodies
app.use(passport.initialize());

// Express only serves static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('build/client/build'));
  app.get('*', (_, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
} else {
  app.get('*', (_, res) => {
    res.sendFile('./client/public/index.html', { root: __dirname });
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
require('./server/api/manualupdate')(app);
require('./server/api/racestatistics')(app);
require('./server/api/raceEndStatistics')(app);
require('./server/api/charts')(app);
require('./server/api/stageresults')(app);
require('./server/api/stageselection')(app);
require('./server/api/teamselection')(app);
require('./server/api/userparticipation')(app);