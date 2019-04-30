const kScrape = require('../db/klassiekerScrape');
const functies = require('../functies');
const jwt = require('jsonwebtoken');
const fs = require('fs');

function getSecret() {
    if (fs.existsSync('./server/jwtsecret.js')) {
        return secret = require('../jwtsecret');
    } else {
        return secret = process.env.JWT_SECRET;
    }
}

module.exports = function (app) {
  const sqlDB = require('../db/sqlDB')

  app.post('/api/getstartlistklassiek', function (req, res) {
    jwt.verify(req.body.token, getSecret(), function (err, decoded) {
      if(err)
        throw err;
      if(decoded.admin){
        var year = parseInt(req.body.year);
        var stage = parseInt(req.body.stage);
        kScrape.getStartlist(year,stage,function(err,arg){ 
          if(err) res.send("error");
          console.log("Got startlist Klassieker year %s, stage %s", year,stage)
          res.send("completed")
        })
      }
    })
  });

  app.post('/api/getresultsklassiek', function (req, res) {
    jwt.verify(req.body.token, getSecret(), function (err, decoded) {
      if(err)
        throw err;
      if(decoded.admin){
        var year = parseInt(req.body.year);
        var stage = parseInt(req.body.stage);
        kScrape.getResult(year,stage,function(){ 
          console.log("Got Results Klassieker year %s, stage %s", year,stage)
          functies.calculateUserScoresKlassieker(year,stage,function(err,arg){ 
            if(err) res.send("error");
            console.log("Caluculated userscores Klassieker year %s, stage %s", year,stage); 
            res.send("completed")
          })
        })
      }
    })
  });

  app.post('/api/getstartlist', function (req, res) {
    jwt.verify(req.body.token, getSecret(), function (err, decoded) {
      if(err)
        throw err;
      if(decoded.admin){
        var year = parseInt(req.body.year);
        var raceName = req.body.raceName;
        res.send("doet nog niks")
      }
    })
  });

  app.post('/api/getresults', function (req, res) {
    jwt.verify(req.body.token, getSecret(), function (err, decoded) {
      if(err)
        throw err;
      if(decoded.admin){
        var year = parseInt(req.body.year);
        var raceName = req.body.raceName;
        var stage = parseInt(req.body.stage);
        res.send("doet nog niks")
      }
    })
  });
}