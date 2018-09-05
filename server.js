const express = require("express");
const session = require('express-session');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();

//==Passport==
const passport = require('passport');
app.use(morgan('dev'));
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.urlencoded({
  extended: true
}));// get information from html forms
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: false,
  cookie: { maxAge: 60000, secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());

//==SQL DB==
const { Client } = require('pg');
const sqlDB = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});
sqlDB.connect();

// Express only serves static assets in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}

app.set("port", process.env.PORT || 3001);

app.listen(app.get("port"), () => {
  console.log(`Magicka accidit`);
});

require('./passport')(passport);
require('./routes.js')(app) //ALLE APP.GET FUNCTIES --> ROUTES.JS
require('./api.js')(app)    //ALLE APP.USE FUNCTIES --> API.JS


