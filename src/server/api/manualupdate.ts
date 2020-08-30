
module.exports = (app, current_race) => {
  const race_backup = require('../db/Mongo/models/race_backup.js');
  const async = require('async');
  const sqlDB = require('../db/sqlDB');
  const race_id = current_race.id;
  const scrape = require('../scrape')

  // app.post('/api/getstartlistklassiek', function (req, res) { //TODO change to new scrape
  //   jwt.verify(req.body.token, getSecret(), function (err, decoded) {
  //     if(err)
  //       throw err;
  //     if(decoded.admin){
  //       var year = parseInt(req.body.year);
  //       var stage = parseInt(req.body.stage);
  //       scrape.getStartlist(year,stage,function(err,arg){
  //         if(err) res.send("error");
  //         console.log("Got startlist Klassieker year %s, stage %s", year,stage)
  //         res.send("completed")
  //       })
  //     }
  //   })
  // });

  // app.post('/api/getresultsklassiek', function (req, res) {
  //   jwt.verify(req.body.token, getSecret(), function (err, decoded) {
  //     if(err)
  //       throw err;
  //     if(decoded.admin){
  //       var year = parseInt(req.body.year);
  //       var stage = parseInt(req.body.stage);
  //       scrape.getResult(year,stage,function(){
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

  app.post('/api/getstartlist', (req, res) => {
    if (req.user.admin) {
      const year = parseInt(req.body.year, 10);
      const raceName = req.body.raceName;
      var race = { raceName: raceName, year: year };
      scrape.getStartlist(race, (err, arg) => {
        if (err) { res.send('error'); }
        console.log('Got startlist %s year %s', raceName, year);
        res.send('loaded startlist');
      });
    } else {
      return res.status(401).send('Access denied. No admin');
    }
  });

  app.post('/api/getresults', (req, res) => {
    if (req.user.admin) {
      const year = parseInt(req.body.year, 10);
      const name = req.body.raceName;
      const race = {name, year}
      const stage = parseInt(req.body.stage, 10);
      if (req.body.stage === 'all') {
        const stages = Array.apply(null, { length: 22 }).map(Number.call, Number);
        async.eachSeries(stages, (stage, callback) => {
          scrape.getResult(race, stage + 1, (err, arg) => {
            if (err) { res.send('error'); }
            console.log('Got results %s year %s stage %s', race, stage + 1);
            callback(null, !err);
          }, (err, result) => {
            res.send('completed');
          });
        });
      } else {
        scrape.getResult(race, stage, (err, arg) => {
          if (err) { res.send('error'); }
          console.log('Got results %s year %s stage %s', race, stage);
          res.send('completed')
        });
      }
    } else {
      return res.status(401).send('Access denied. No admin');
    }
  });

  app.post('/api/copyTeamSelectionsFinalStage', (req, res) => {
    if (req.user.admin) {
      const race_id = `(SELECT race_id FROM race WHERE name = '${req.body.raceName}' AND year = ${req.body.year})`;
      const accountParticipationsQuery = `SELECT * FROM account_participation WHERE race_id = ${race_id}`;
      const stage_id = `(SELECT stage_id FROM stage WHERE race_id = ${race_id} AND stagenr = 22)`;
      sqlDB.query(accountParticipationsQuery, (err, participations) => {
        if (err) { console.log('WRONG QUERY:', accountParticipationsQuery); throw err; }
        var copyTeamQuery = `DELETE FROM stage_selection_rider
          WHERE stage_selection_id IN (SELECT stage_selection_id FROM stage_selection WHERE stage_id = ${stage_id});`;
        for (const i of Object.keys(participations.rows)) {
          const account_participation_id = participations.rows[i].account_participation_id;
          const stage_selection_id = `(SELECT stage_selection_id FROM stage_selection
              WHERE stage_id = ${stage_id} AND account_participation_id = ${account_participation_id})`;
          const copyQuery = `INSERT INTO stage_selection_rider(stage_selection_id,rider_participation_id)
              SELECT ${stage_selection_id}, rider_participation_id FROM team_selection_rider
              INNER JOIN rider_participation USING (rider_participation_id)
              WHERE account_participation_id = ${account_participation_id} AND NOT dnf
              ON CONFLICT DO NOTHING;`;
          copyTeamQuery += copyQuery;
        }
        sqlDB.query(copyTeamQuery, (err, results) => {
          if (err) { console.log('WRONG QUERY:', copyTeamQuery); throw err; }
          res.send('Copied Teams');
        });
      });
    } else {
      return res.status(401).send('Access denied. No admin');
    }
  });

  app.post('/api/copyTeamIfSelectionEmpty', (req, res) => {
    if (req.user.admin) {
      const currentStagenr = 0;
      const stage_id = `(SELECT stage_id FROM stage
                          WHERE stagenr = ${currentStagenr} AND race_id = ${race_id})`;

      const prevStage_id = `(SELECT stage_id FROM stage WHERE race_id = ${race_id} and stagenr = ${currentStagenr} - 1)`;
      const accountsWithoutSelectionQuery = `SELECT account_participation_id, stage_selection_id FROM stage_selection
                                            LEFT JOIN stage_selection_rider USING (stage_selection_id)
                                            WHERE stage_id = ${stage_id}
                                            GROUP BY account_participation_id, stage_selection_id
                                            HAVING COUNT(rider_participation_id) = 0`;
      sqlDB.query(accountsWithoutSelectionQuery, (err, res) => {
        if (err) { console.log('WRONG QUERY:', accountsWithoutSelectionQuery); throw err; }
        let totalQuery: string;
        for (const i of Object.keys(res.rows)) {// for each account_participation with an empty stage_selection for the stage that just started
          const prevStage_selection_id = `(SELECT stage_selection_id FROM stage_selection WHERE stage_id = ${prevStage_id} AND account_participation_id = ${res.rows[i].account_participation_id})`;
          // SELECT all riders from previous stage selection and insert into current stage
          const insertPrevSelection = `INSERT INTO stage_selection_rider(stage_selection_id, rider_participation_id)
              SELECT ${res.rows[i].stage_selection_id}, rider_participation_id FROM stage_selection_rider WHERE stage_selection_id = ${prevStage_selection_id};\n`;
          const prevKopman_id = `(SELECT kopman_id FROM stage_selection WHERE stage_selection_id = ${prevStage_selection_id})`;
          const insertPrevKopman = `UPDATE stage_selection SET kopman_id = ${prevKopman_id} WHERE stage_selection_id = ${res.rows[i].stage_selection_id};\n`;
          totalQuery += insertPrevSelection + insertPrevKopman;
        }

        if (res.rows.length) {
          sqlDB.query(totalQuery, (err, results) => {
            if (err) { console.log('WRONG QUERY:', totalQuery); throw err; }
            console.log('Copied selections', res.rowCount);
          });
        }
      });
    } else {
      return res.status(401).send('Access denied. No admin');
    }
  });

  app.post('/api/import', (req, res) => {
    // TODO Rens remove rider participation and add team selection rider
    if (req.user.admin) {
      const race_idQuery = `SELECT race_id FROM race
          WHERE year = ${req.body.year} AND name = '${req.body.raceName}';\n`;
      sqlDB.query(race_idQuery, (err, results) => {
        if (err) { console.log('WRONG QUERY:', race_idQuery); throw err; }
        const race_id = results.rows[0].race_id;

        race_backup.findById(race_id, (err, race) => {
          // result_points
          let results_pointsQuery: string;
          if (race.results_points.length) { results_pointsQuery = 'INSERT INTO results_points VALUES'; }
          for (const i of Object.keys(race.results_points)) {
            if (i !== '0') { results_pointsQuery += ','; }
            results_pointsQuery += '(';
            for (var prop in race.results_points[i]) {
              if (typeof race.results_points[i][prop] === 'string') {
                results_pointsQuery += `'${race.results_points[i][prop]}',`;
              } else {
                results_pointsQuery += race.results_points[i][prop] + ',';
              }
            }
            results_pointsQuery = results_pointsQuery.slice(0, -1) + ')';
          }
          if (race.results_points.length) { results_pointsQuery += 'ON CONFLICT(stage_id,rider_participation_id) DO NOTHING;\n'; }
          // stage_selection_rider
          let stage_selection_riderQuery: string;
          if (race.stage_selection_rider.length) { stage_selection_riderQuery = 'INSERT INTO stage_selection_rider VALUES'; }
          for (const i of Object.keys(race.stage_selection_rider)) {
            if (i !== '0') { stage_selection_riderQuery += ','; }
            stage_selection_riderQuery += '(';
            for (var prop in race.stage_selection_rider[i]) {
              if (typeof race.stage_selection_rider[i][prop] === 'string') {
                stage_selection_riderQuery += `'${race.stage_selection_rider[i][prop]}',`
              } else {
                stage_selection_riderQuery += race.stage_selection_rider[i][prop] + ','
              }
            }
            stage_selection_riderQuery = stage_selection_riderQuery.slice(0, -1) + ')'
          }
          if (race.stage_selection_rider.length) { stage_selection_riderQuery += 'ON CONFLICT(stage_selection_id,rider_participation_id) DO NOTHING;\n'; }
          // rider_participation
          let rider_participationQuery: string;
          if (race.rider_participation.length) { rider_participationQuery = 'INSERT INTO rider_participation VALUES'; }
          for (const i of Object.keys(race.rider_participation)) {
            if (i !== '0') { rider_participationQuery += ','; }
            rider_participationQuery += '(';
            for (var prop in race.rider_participation[i]) {
              if (typeof race.rider_participation[i][prop] === 'string') {
                rider_participationQuery += `'${race.rider_participation[i][prop]}',`;
              } else {
                rider_participationQuery += race.rider_participation[i][prop] + ',';
              }
            }
            rider_participationQuery = rider_participationQuery.slice(0, -1) + ')';
          }
          if (race.rider_participation.length) { rider_participationQuery += ' ON CONFLICT(race_id,rider_id) DO NOTHING;\n'; }
          const totalQuery = results_pointsQuery + stage_selection_riderQuery;
          sqlDB.query(totalQuery, (err, results2) => {
            if (err) { console.log('WRONG QUERY:', totalQuery); throw err; }
            console.log('IMPORTED ', req.body.raceName, req.body.year);
            console.log(results2);
            res.send('Import Succesful');
          });
        });
      });
    } else {
      return res.status(401).send('Access denied. No admin');
    }
  });


  app.post('/api/export', (req, res) => {
    if (req.user.admin) {
      const race_idQuery = `SELECT race_id FROM race
          WHERE year = ${req.body.year} AND name = '${req.body.raceName}';\n`;
      const race_id = `(SELECT race_id FROM race
        WHERE year = ${req.body.year} AND name = '${req.body.raceName}')`;
      const results_pointsQuery = `SELECT results_points.* FROM results_points
        INNER JOIN stage USING(stage_id)
        WHERE race_id = ${race_id};\n`;
      const stage_selection_riderQuery = `SELECT stage_selection_rider.* FROM stage_selection_rider
        INNER JOIN stage_selection USING(stage_selection_id)
        INNER JOIN stage USING(stage_id)
        WHERE race_id = ${race_id};\n`;
      const team_selection_riderQuery = `SELECT team_selection_rider.* FROM team_selection_rider
        INNER JOIN account_participation USING(account_participation_id)
        WHERE race_id = ${race_id};\n`;

      const totalQuery = race_idQuery + results_pointsQuery + stage_selection_riderQuery + team_selection_riderQuery;
      sqlDB.query(totalQuery, (err, results) => {
        if (err) { console.log('WRONG QUERY:', totalQuery); throw err; }
        // race_backup.updateOne({_id:results[0].rows[0].race_id},{
        //   $set: {"raceName":req.body.raceName,"year":req.body.year}
        // },
        // function(err, result) {
        //   console.log(" updated",req.body.raceName)
        // })
        const raceToSave = new race_backup;
        raceToSave._id = results[0].rows[0].race_id;
        raceToSave.results_points = results[1].rows;
        raceToSave.stage_selection_rider = results[2].rows;
        raceToSave.team_selection_rider = results[3].rows;
        raceToSave.save(
          function (err) {
            if (err) {
              console.log(req.body.raceName, req.body.year, 'Not Backed Up');
              res.send(err.toString())
            } else {
              console.log(req.body.raceName, req.body.year, 'Backed Up');
              res.send('Export Succesful');
            }
          }
        )
        // data deleten moet voorlopig handmatig voor de veiligheid

        // console.log(req.body.raceName,req.body.year,'Removed From SQL')
      });
    } else {
      return res.status(401).send('Access denied. No admin');
    }
  });
}