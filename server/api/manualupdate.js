const kScrape = require('../db/klassiekerScrape');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const sqlScrape = require('../SQLscrape');
const race_backup = require('../db/Mongo/models/race_backup.js')
const async = require('async');

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

  // app.post('/api/getresultsklassiek', function (req, res) {
  //   jwt.verify(req.body.token, getSecret(), function (err, decoded) {
  //     if(err)
  //       throw err;
  //     if(decoded.admin){
  //       var year = parseInt(req.body.year);
  //       var stage = parseInt(req.body.stage);
  //       kScrape.getResult(year,stage,function(){ 
  //         console.log("Got Results Klassieker year %s, stage %s", year,stage)
  //         functies.calculateUserScoresKlassieker(year,stage,function(err,arg){ //TODO calculate has changed location
  //           if(err) res.send("error");
  //           console.log("Caluculated userscores Klassieker year %s, stage %s", year,stage); 
  //           res.send("completed")
  //         })
  //       })
  //     }
  //   })
  // });

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
        if(req.body.stage === 'all'){
          var stages = Array.apply(null, {length: 22}).map(Number.call, Number);
          async.eachSeries(stages,function(stage,callback){
            sqlScrape.getResult(raceName,year,stage + 1,function(err,arg){ 
              if(err) res.send("error");
              console.log("Got results %s year %s stage %s",raceName, year, stage + 1)
              callback(null, !err)
            }, function(err, result) {
              res.send("completed")
          })
          })
        }else{
          var stage = parseInt(req.body.stage);
          sqlScrape.getResult(raceName,year,stage,function(err,arg){ 
            if(err) res.send("error");
            console.log("Got results %s year %s stage %s",raceName, year, stage)
            res.send("completed")
          })
        }
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
              WHERE account_participation_id = ${account_participation_id} AND NOT dnf
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
        var race_id = current_race_id;

        var currentStagenr = currentstage_global;
        var stage_id = `(SELECT stage_id FROM stage
                          WHERE stagenr = ${currentStagenr} AND race_id = ${race_id})`;
      
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

  app.post('/api/import', function (req, res) {
    jwt.verify(req.body.token, getSecret(), function (err, decoded) {
      if(err)
        throw err;
      if(decoded.admin){
        var race_idQuery = `SELECT race_id FROM race
          WHERE year = ${req.body.year} AND name = '${req.body.raceName}';\n`; 
          sqlDB.query(race_idQuery,function(err,results){
            if (err) {console.log("WRONG QUERY:",race_idQuery); throw err;}
            var race_id = results.rows[0].race_id;
            
            race_backup.findById(race_id,function(err,race){
              //result_points
              var results_pointsQuery = ''
              if(race.results_points.length) results_pointsQuery = 'INSERT INTO results_points VALUES'
              for(var i in race.results_points){
                if (i!=0) results_pointsQuery += ',';
                results_pointsQuery += '(';
                for(var prop in race.results_points[i]){
                  if(typeof race.results_points[i][prop] === 'string'){
                    results_pointsQuery += `'${race.results_points[i][prop]}',`

                  }else{
                    results_pointsQuery += race.results_points[i][prop] + ','
                  }
                }
                results_pointsQuery = results_pointsQuery.slice(0,-1) + ')'
              }
              if(race.results_points.length) results_pointsQuery += 'ON CONFLICT(stage_id,rider_participation_id) DO NOTHING;\n'
              //stage_selection_rider
              var stage_selection_riderQuery = ''
              if(race.stage_selection_rider.length) stage_selection_riderQuery = 'INSERT INTO stage_selection_rider VALUES'
              for(var i in race.stage_selection_rider){
                if (i!=0) stage_selection_riderQuery += ',';
                stage_selection_riderQuery += '(';
                for(var prop in race.stage_selection_rider[i]){
                  if(typeof race.stage_selection_rider[i][prop] === 'string'){
                    stage_selection_riderQuery += `'${race.stage_selection_rider[i][prop]}',`

                  }else{
                    stage_selection_riderQuery += race.stage_selection_rider[i][prop] + ','
                  }
                }
                stage_selection_riderQuery = stage_selection_riderQuery.slice(0,-1) + ')'
              }
              if(race.stage_selection_rider.length) stage_selection_riderQuery += 'ON CONFLICT(stage_selection_id,rider_participation_id) DO NOTHING;\n'
              //rider_participation
              var rider_participationQuery = ''
              if(race.rider_participation.length) rider_participationQuery = 'INSERT INTO rider_participation VALUES'
              for(var i in race.rider_participation){
                if (i!=0){rider_participationQuery += ','};
                rider_participationQuery += '(';
                for(var prop in race.rider_participation[i]){
                  if(typeof race.rider_participation[i][prop] === 'string'){
                    rider_participationQuery += `'${race.rider_participation[i][prop]}',`

                  }else{
                    rider_participationQuery += race.rider_participation[i][prop] + ','
                  }
                }
                rider_participationQuery = rider_participationQuery.slice(0,-1) + ')'
              }
              if(race.rider_participation.length) rider_participationQuery += ' ON CONFLICT(race_id,rider_id) DO NOTHING;\n'
              var totalQuery = rider_participationQuery + results_pointsQuery + stage_selection_riderQuery;
              sqlDB.query(totalQuery,function(err,results2){
                if (err) {console.log("WRONG QUERY:",totalQuery); throw err;}
                console.log("IMPORTED ",req.body.raceName,req.body.year)
                console.log(results2)
                res.send('Import Succesful')
              })
            })
          })
      }
    })
  });


  app.post('/api/export', function (req, res) {
    jwt.verify(req.body.token, getSecret(), function (err, decoded) {
      if(err)
        throw err;
      if(decoded.admin){
        var race_idQuery = `SELECT race_id FROM race
          WHERE year = ${req.body.year} AND name = '${req.body.raceName}';\n`; 
        var race_id = `(SELECT race_id FROM race
        WHERE year = ${req.body.year} AND name = '${req.body.raceName}')`
        var results_pointsQuery = `SELECT results_points.* FROM results_points
        INNER JOIN stage USING(stage_id)
        WHERE race_id = ${race_id};\n`
        var stage_selection_riderQuery = `SELECT stage_selection_rider.* FROM stage_selection_rider
        INNER JOIN stage_selection USING(stage_selection_id)
        INNER JOIN stage USING(stage_id)
        WHERE race_id = ${race_id};\n` 
        var rider_participationQuery = `SELECT rider_participation.* FROM rider_participation
        WHERE race_id = ${race_id};\n`
        var totalQuery = race_idQuery + results_pointsQuery + stage_selection_riderQuery + rider_participationQuery;
        sqlDB.query(totalQuery,function(err,results){
          if (err) {console.log("WRONG QUERY:",totalQuery); throw err;}
          var raceToSave = new race_backup;
          raceToSave._id = results[0].rows[0].race_id;
          raceToSave.results_points = results[1].rows;
          raceToSave.stage_selection_rider = results[2].rows;
          raceToSave.rider_participation = results[3].rows;
          raceToSave.save()
          console.log(req.body.raceName,req.body.year,'Backed Up')
          res.send('Export Succesful')
          // data deleten moet voorlopig handmatig voor de veiligheid

          // console.log(req.body.raceName,req.body.year,'Removed From SQL')
        })
      }
    });
  })
}