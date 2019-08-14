const kScrape = require('../db/klassiekerScrape');
const functies = require('../functies');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const sqlScrape = require('../SQLscrape');
const race_backup = require('../db/Mongo/models/race_backup.js')

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
        var race_id = race_id_global;

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
        // import from textfile ongeveer
        // var race_id = 1;
        // // textfile import
        // fs.readFile(`./server/db/Backups/${race_id}/selecties_opstellingen.txt`,'utf8',function(err,data){
        //   if (err) {
        //     throw err;
        // }
        // var arr = data.split('\n')
        // var account_participation_id = 0;
        // var i = 0;
        // var stage_selection_riderQuery = `INSERT INTO stage_selection_rider(stage_selection_id,rider_participation_id)
        // VALUES`
        // console.log('import')
        // var stage = 0;
        // while(i<arr.length-1){
        //   if(arr[i].startsWith('$account_participation')){
        //     var spatie = arr[i].indexOf(' ');
        //     account_participation_id = parseInt(arr[i].substring(spatie+1))
        //     i++
        //     while(arr[i].startsWith('$rider')){i++}
        //   }
        //   if(arr[i].startsWith('$opstellingen')){
        //     i++;
        //     stage = 0;
        //   }
        //   if(arr[i].startsWith('$opstelling')){
        //     stage++;
        //     i++
        //     var stage_selection_id = `(SELECT stage_selection_id FROM stage_selection 
        //     INNER JOIN stage USING(stage_id)
        //     WHERE stagenr = ${stage} AND race_id = ${race_id} AND account_participation_id = ${account_participation_id})`
        //     if(arr[i].startsWith('$kopman')){i++}
        //     while(arr[i].startsWith('$rider')){
        //       spatie = arr[i].indexOf(' ');
        //       var pcs_id = arr[i].substring(spatie+1)
        //       var rider_participation_id = `(SELECT rider_participation_id FROM rider_participation INNER JOIN rider USING(rider_id) WHERE pcs_id = '${pcs_id}' AND race_id = ${race_id})`
        //       stage_selection_riderQuery += `(${stage_selection_id},${rider_participation_id}),`
        //       i++
        //     }
            
        //   }
        // }
        // stage_selection_riderQuery = stage_selection_riderQuery.slice(0,-1) +  ` ON CONFLICT (stage_selection_id,rider_participation_id) 
        // DO NOTHING;\n `;
        // var totalQuery = stage_selection_riderQuery;
        // sqlDB.query(totalQuery,function(err,results){
        //   if (err) {console.log("WRONG QUERY:",totalQuery); throw err;}
        //   console.log("RESULTS",results)
        // })
    
        // })
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
          raceToSave.race_id = results[0].rows[0].race_id;
          raceToSave.results_points = results[1].rows;
          raceToSave.stage_selection_rider = results[2].rows;
          raceToSave.rider_participation = results[3].rows;
          raceToSave.save()
          //TODO remove data from sql
        })
      }
    });
  })

  app.get('/export', function (req, res) {
    console.log("export")

    User.find({'teamselectie.userrenners': {$size: 20}}, function (err, users) {
      if (err) throw err;
      console.log("export",users.length)

      users.forEach(function (user, index) {//get all users
        // user.profieldata.totaalscore = 0;
        // user.profieldata.poulescore = new Array(22).fill(0);
        console.log("$user " + user.local.username);
        user.teamselectie.userrenners.forEach(function (rider) {
          console.log('$rider ' + rider._id);
        })
        console.log('$opstellingen')
        user.opstellingen.forEach(function (Opstelling) {
          console.log("$opstelling")
          console.log("$kopman" + Opstelling.kopman);
          Opstelling.opstelling._id.forEach(function (rider) {
            console.log("$rider " + rider);
          })
        })
        // user.teamselectie.userrenners = new Array(0).fill({ '_id': String, 'naam': String, 'team': String, 'prijs': Number }); //haal de renner weg
        // user.opstellingen =  new Array(21).fill({'kopman':String,'opstelling':{'_id':new Array(0),'naam':new Array(0)}}); //Opstellingen resetten
        // user.teamselectie.geld = 47000000;
        // user.markModified('userrenners, opstellingen, geld')
        // user.save(function (err) {
        //   if (err) throw err;
        // });
      })
    })
  });


}