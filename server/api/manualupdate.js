const kScrape = require('../db/klassiekerScrape');
const functies = require('../functies');

module.exports = function (app) {
  const sqlDB = require('../db/sqlDB')

  app.post('/api/getstartlistklassiek', function (req, res) {
    if (req.user.admin) {
      var year = parseInt(req.body.year);
      var stage = parseInt(req.body.stage);
      kScrape.getStartlist(year,stage,function(){ 
        console.log("Got startlist Klassieker year %s, stage %s", year,stage)
        res.send("done")})
    }
  })

  app.post('/api/getresultsklassiek', function (req, res) {
    if (req.user.admin) {
      var year = parseInt(req.body.year);
      var stage = parseInt(req.body.stage);
      kScrape.getResult(year,stage,function(){ 
        console.log("Got Results Klassieker year %s, stage %s", year,stage)
        functies.calculateUserScoresKlassieker(year,stage,function(err,arg){ 
          console.log("Caluculated userscores Klassieker year %s, stage %s", year,stage); 
          res.send("done")
        })
      })
    }
  });

  app.post('/api/getstartlistklassiek', function (req, res) {
    if (req.user.admin) {
      var year = parseInt(req.body.year);
      var stage = parseInt(req.body.stage);
      kScrape.getStartlist(year,stage,function(){ 
        console.log("Got startlist Klassieker year %s, stage %s", year,stage)
        res.send("done")})
    }
  })

  app.post('/api/getstartlist', function (req, res) {
    if (req.user.admin) {
      var year = parseInt(req.body.year);
      var raceName = req.body.raceName;
      res.send("doet nog niks")
    }
  });

  app.post('/api/getresults', function (req, res) {
    if (req.user.admin) {
      var year = parseInt(req.body.year);
      var raceName = req.body.raceName;
      var stage = parseInt(req.body.stage);
      res.send("doet nog niks")
    }
  });
}