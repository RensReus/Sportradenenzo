module.exports = (app) => {
  const sqlDB = require('../db/sqlDB');

  app.post('/api/getHomePageInfo', async (req, res) => {
    const finishedRacesQuery = `SELECT DISTINCT stagenr, complete,race_id,name,year, race.finished FROM stage 
      INNER JOIN race USING(race_id)
      INNER JOIN account_participation USING (race_id)
      WHERE race.finished AND type = 'FinalStandings' AND account_id = ${req.user.account_id}
      ORDER BY year, name; \n`;
    const activeRacesQuery = `SELECT DISTINCT race_id, CASE WHEN COUNT(stage_id) > 0 THEN 1 ELSE 0 END FROM race
      INNER JOIN stage USING(race_id)
      INNER JOIN account_participation USING(race_id)
      WHERE race.finished = false AND account_id = ${req.user.account_id}
      GROUP BY race_id
      UNION 
      SELECT race_id, 1 FROM race
      INNER JOIN stage USING(race_id)
      WHERE stagenr = 1 and starttime > now(); \n`
    const query = finishedRacesQuery + activeRacesQuery;
    const results = await sqlDB.query(query);
    let activeRacesResults = results[1];
    if (activeRacesResults.rows.length === 0) {
      res.send({ 
        finishedRaces: results[0].rows,
        activeRaces: []
      })
    } else {

      var currentStagesQuery = activeRacesResults.rows.reduce((query, race) => query + `SELECT stagenr + CASE WHEN complete THEN 1 ELSE 0 END AS stagenr,race_id,name,year FROM stage 
        INNER JOIN race USING(race_id)
        WHERE starttime < now() AT TIME ZONE 'Europe/Paris' AND race.race_id = ${race.race_id}
        UNION 
        SELECT 0 AS stagenr,race_id,name,year FROM stage
        INNER JOIN race USING(race_id)
        WHERE stagenr = 1 AND race.race_id = ${race.race_id}
        ORDER BY stagenr DESC
        LIMIT 1;\n `, '')
      const currentStagesResults = await sqlDB.query(currentStagesQuery);
      let activeRaces: Array<any>;
      if (activeRacesResults.rows.length === 1) {
        activeRaces = currentStagesResults.rows
      } else {
        activeRaces = currentStagesResults.map(x => x.rows[0]);
      }
      res.send({ 
        finishedRaces: results[0].rows,
        activeRaces
      });
    }
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
