const kScrape = require('../db/klassiekerScrape');
const functies = require('../functies');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const sqlScrape = require('../SQLscrape');

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
        sqlScrape.getStartlist(raceName,year,function(err,arg){ 
          if(err) res.send("error");
          console.log("Got startlist %s year %s",raceName, year)
          res.send("loaded startlist")
        })
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
        sqlScrape.getResult(raceName,year,stage,function(err,arg){ 
          if(err) res.send("error");
          console.log("Got results %s year %s stage %s",raceName, year, stage)
          res.send("completed")
        })
      }
    })
  });

  app.post('/api/copyTeamSelectionsFinalStage', function (req, res) {
    jwt.verify(req.body.token, getSecret(), function (err, decoded) {
      if(err)
        throw err;
      if(decoded.admin){
        var race_id = `(SELECT race_id FROM race WHERE name = '${req.body.raceName}' AND year = ${req.body.year})`;
        var accountParticipationsQuery = `SELECT * FROM account_participation WHERE race_id = ${race_id}`;
        var stage_id = `(SELECT stage_id FROM stage WHERE race_id = ${race_id} AND stagenr = 22)`;
        sqlDB.query(accountParticipationsQuery,function(err,participations){
          if (err) {console.log("WRONG QUERY:",accountParticipationsQuery); throw err;}          
          var copyTeamQuery = `DELETE FROM stage_selection_rider 
          WHERE stage_selection_id IN (SELECT stage_selection_id FROM stage_selection WHERE stage_id = ${stage_id}); `
          for (var i in participations.rows){
              var account_participation_id = participations.rows[i].account_participation_id;
              var stage_selection_id = `(SELECT stage_selection_id FROM stage_selection
              WHERE stage_id = ${stage_id} AND account_participation_id = ${account_participation_id})`;
              var copyQuery = `INSERT INTO stage_selection_rider(stage_selection_id,rider_participation_id)
              SELECT ${stage_selection_id}, rider_participation_id FROM team_selection_rider
              INNER JOIN rider_participation USING (rider_participation_id)
              WHERE account_participation_id = ${account_participation_id}
              ON CONFLICT DO NOTHING; `
              copyTeamQuery += copyQuery;
          }
          sqlDB.query(copyTeamQuery,function(err,results){
            if (err) {console.log("WRONG QUERY:",copyTeamQuery); throw err;}          
            res.send("Copied Teams");
          })
        })
      }
    })
  });

  app.post('/api/copyTeamIfSelectionEmpty', function (req, res) {
    jwt.verify(req.body.token, getSecret(), function (err, decoded) {
      if(err)
        throw err;
      if(decoded.admin){
        var race_id = race_id_global;

        var stage_id = `(SELECT stage_id FROM stage
                          WHERE starttime < NOW() AT TIME ZONE 'Europe/Paris' AND race_id = ${race_id}
                          ORDER BY stagenr DESC
                          LIMIT 1)`;
        var currentStagenr = `(SELECT stagenr FROM stage
                      WHERE starttime < NOW() AT TIME ZONE 'Europe/Paris' AND race_id = ${race_id}
                      ORDER BY stagenr DESC
                      LIMIT 1)`;
      
        var prevStage_id = `(SELECT stage_id FROM stage WHERE race_id = ${race_id} and stagenr = ${currentStagenr} - 1)`;
        var accountsWithoutSelectionQuery = `SELECT account_participation_id, stage_selection_id FROM stage_selection
                                            LEFT JOIN stage_selection_rider USING (stage_selection_id)
                                            WHERE stage_id = ${stage_id} 
                                            GROUP BY account_participation_id, stage_selection_id
                                            HAVING COUNT(rider_participation_id) = 0`;
        sqlDB.query(accountsWithoutSelectionQuery,function(err,res){
          if (err) {console.log("WRONG QUERY:",accountsWithoutSelectionQuery); throw err;}
          var totalQuery = '';
          for(var i in res.rows){//for each account_participation with an empty stage_selection for the stage that just started
              var prevStage_selection_id = `(SELECT stage_selection_id FROM stage_selection WHERE stage_id = ${prevStage_id} AND account_participation_id = ${res.rows[i].account_participation_id})`;
              //SELECT all riders from previous stage selection and insert into current stage
              var insertPrevSelection = `INSERT INTO stage_selection_rider(stage_selection_id, rider_participation_id)
              SELECT ${res.rows[i].stage_selection_id}, rider_participation_id FROM stage_selection_rider WHERE stage_selection_id = ${prevStage_selection_id};\n`;
              var prevKopman_id = `(SELECT kopman_id FROM stage_selection WHERE stage_selection_id = ${prevStage_selection_id})`;
              var insertPrevKopman = `UPDATE stage_selection SET kopman_id = ${prevKopman_id} WHERE stage_selection_id = ${res.rows[i].stage_selection_id};\n`;
            totalQuery += insertPrevSelection + insertPrevKopman;
          }
      
          if(res.rows.length){
            sqlDB.query(totalQuery,function(err,results){
              if (err) {console.log("WRONG QUERY:",totalQuery); throw err;}
              console.log("Copied selections",res.rowCount);
            })
          }
        })
      }
    })
  });



}