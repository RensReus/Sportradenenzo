module.exports = (app) => {
  const sqlDB = require('../db/sqlDB');

  // const current_race_id = current_race.id;

  app.post('/api/getracepartcipation', (req, res) => {
    const query = `SELECT race_id FROM account_participation
        WHERE account_id = ${req.user.account_id} AND finalscore=0 AND budgetparticipation=false`;
    sqlDB.query(query, (err, results) => {
      if (err) {
        console.log("WRONG QUERY:", query);
        throw err;
      } else {
        res.send({ participations: results.rows });
      }
    });
  });

  app.post('/api/getactiveraces', (req, res) => {
    let activeRacesQuery = `SELECT race_id, COUNT(stage_id) FROM race
    INNER JOIN stage USING(race_id)
    WHERE race.finished = false AND name IN ('giro','tour','vuelta')
    GROUP BY race_id;`

    sqlDB.query(activeRacesQuery, (err, activeRacesResults) => {
      if (err) {
        console.log("WRONG QUERY:", activeRacesQuery);
        throw err;
      } else if (activeRacesResults.rows.length === 0) { 
          res.send({activeRaces:[]})
      } else {
        
        var currentStagesQuery = activeRacesResults.rows.reduce((query, race) => query + `SELECT stagenr + CASE WHEN complete THEN 1 ELSE 0 END as stagenr,race_id,name,year FROM stage 
        INNER JOIN race USING(race_id)
        WHERE starttime < now() AT TIME ZONE 'Europe/Paris' AND race.race_id=${race.race_id}
        ORDER BY stagenr DESC
        LIMIT 1;\n `,'')
        sqlDB.query(currentStagesQuery, (err, currentStagesResults) => {
          if (err) {
            console.log("WRONG QUERY:", activeRacesQuery);
            throw err;
          }
          let activeRaces: Array<any>;
          if (activeRacesResults.rows.length === 1) {
            activeRaces = currentStagesResults.rows
          } else {
             activeRaces = currentStagesResults.map(x => x.rows[0]);
          }
          res.send({ activeRaces });
        })
      }
    });
  })

  app.post('/api/getfinishedraces', (req, res) => {
    // let query = `SELECT finalscore, name, year, race_id FROM account_participation
    // INNER JOIN race USING(race_id)
    // WHERE finished AND account_id = ${req.user.account_id}`;
    let query = `SELECT stagenr, complete,race_id,name,year, race.finished FROM stage 
    INNER JOIN race USING(race_id)
    WHERE race.finished AND type = 'FinalStandings'`;
    sqlDB.query(query, (err, results2) => {
      if (err) {
        console.log("WRONG QUERY:", query);
        throw err;
      } else {
        const finishedRaces = results2.rows;
        res.send({ finishedRaces });
      }
    });
  })

  // app.post('/api/addparticipation',function(req,res){
  //     if(!req.user){
  //         res.send(false)
  //         res.redirect('/')
  //     }else{
  //         var account_id = req.user.account_id;
  //         var race_id = current_race_id;
  //         query = `INSERT INTO account_participation (account_id, race_id, budgetParticipation) 
  //         VALUES($1, $2, FALSE),($1, $2, TRUE)
  //         ON CONFLICT (account_id, race_id, budgetParticipation) DO NOTHING`
  //         var values = [account_id,race_id];

  //         sqlDB.query(query, values, (err) => {
  //             if (err) {console.log("WRONG QUERY:",query); throw err;}
  //             else{
  //                 res.send("added")
  //             }
  //         });
  //     }
  // })

  // app.post('/api/getprofiledata', (req, res) => {
  //     console.log(req.body);
  //     let account_id;
  //     if (req.body.account_id) { // Als het geen nummer is, ga er vanuit dat het een username is
  //         account_id = req.body.account_id;
  //     }
  //     if (req.body.username) {
  //         account_id = `(SELECT account_id FROM account
  //                 WHERE username ILIKE '${req.body.username}')`;
  //     }
  //     const accountQuery = `SELECT * FROM account
  //             WHERE account_id = ${account_id};\n `;
  //     const participationsQuery = `SELECT * FROM account_participation
  //             WHERE account_id = ${account_id};\n `;
  //     const rankQuery = `(SELECT account_id, race_id, rank() over (PARTITION BY race_id ORDER BY finalscore DESC) FROM account_participation
  //                 INNER JOIN account USING (account_id)
  //                 WHERE budgetparticipation = false) sub`;
  //     const racePointsQuery = `SELECT  CONCAT('/',name,'-',year,'/stage/22') AS "Race_link", CONCAT(INITCAP(name),' ',year) AS race, finalscore, rank FROM
  //             (SELECT * FROM account_participation
  //             INNER JOIN race USING(race_id)
  //             INNER JOIN ${rankQuery} USING(race_id,account_id)
  //             WHERE account_id = ${account_id} AND budgetparticipation = false
  //             ORDER BY year, name) a`;
  //     const totalQuery = accountQuery + participationsQuery + racePointsQuery;
  //     sqlDB.query(totalQuery, (err, results) => {
  //         if (err) {
  //             console.log('WRONG QUERY:', totalQuery);
  //             throw err;
  //         } else {
  //             console.log(results[0].rows)
  //             if (results[0].rows.length === 0) {
  //                 res.status(404).send('User not found')
  //             } else {
  //                 const username = results[0].rows[0].username;
  //                 const scores = results[2].rows;
  //                 res.send({
  //                     userNotFound: false,
  //                     username,
  //                     scores,
  //                 });
  //             }
  //         }
  //     });
  // });
};
