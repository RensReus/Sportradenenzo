const express = require("express");
const session = require('express-session');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const sqlDBlink = require('./server/db/sqlDBlink')
const cors = require('cors') //Zorgt voor authentication tussen proxy en server (snap het niet helemaal maar het werkt)
const app = express();
app.use(cors({
  credentials: true
}))

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
  cookie: { maxAge: 600000, secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());

//==SQL DB==
var fs = require('fs');
if (fs.existsSync('./server/db/sqlDBlink.js')) {
    var sqlDBstring = require('./server/db/sqlDBlink.js');
} else {
    var sqlDBstring = process.env.DATABASE_URL;
}
const { Client } = require('pg');
const sqlDB = new Client({
  connectionString: sqlDBstring,
  ssl: true
});
sqlDB.connect()

// Express only serves static assets in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
  const path = require("path");
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}else{
  app.get('*',(res) => {
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
require('./server/api/riders')(app)
require('./server/api/teamselection')(app)
