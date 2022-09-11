module.exports = (app) => {
  const sqlDB = require('../db/sqlDB');
  app.post('/api/wrapup', async (req, res) => {
    const riderpoints = await getriderpointsall(req.body.race_id);
    res.send(riderpoints);
  });

  const getriderpointsall = async (race_id: number) => {
    var userCount = "count(DISTINCT username)";

    const notSelectedRiders = `UNION 
      SELECT ${riderpointsallColumns(1, false)}
      0 AS "Usercount", '' AS "Users" FROM rider_participation
      LEFT JOIN results_points USING (rider_participation_id)
      INNER JOIN rider USING(rider_id)
      WHERE rider_participation.race_id = ${race_id} AND NOT rider_participation_id IN (SELECT rider_participation_id FROM team_selection_rider INNER JOIN account_participation USING (account_participation_id) WHERE budgetparticipation = ${false})
      GROUP BY "Name", "Team ", "Price", dnf`;

    const allpointsQuery = `SELECT ${riderpointsallColumns(userCount, false)}
      ${userCount} AS "Usercount", string_agg(DISTINCT username, ', ') AS "Users" FROM rider_participation
      LEFT JOIN results_points USING (rider_participation_id)
      INNER JOIN rider USING(rider_id)
      INNER JOIN team_selection_rider on rider_participation.rider_participation_id = team_selection_rider.rider_participation_id
      INNER JOIN account_participation USING(account_participation_id)
      INNER JOIN account USING (account_id)
      WHERE rider_participation.race_id = ${race_id} AND rider_participation.rider_participation_id in (select rider_participation_id from team_selection_rider) AND budgetparticipation = ${false}
      GROUP BY "Name", "Team ", "Price", dnf
      ${notSelectedRiders}
      ORDER BY "Total" DESC;\n `

    const notSelectedRidersWithoutTeampoints = `UNION 
      SELECT ${riderpointsallColumns(1, true)}
      0 AS "Usercount", '' AS "Users" FROM rider_participation
      LEFT JOIN results_points USING (rider_participation_id)
      INNER JOIN rider USING(rider_id)
      WHERE rider_participation.race_id = ${race_id} AND NOT rider_participation_id IN (SELECT rider_participation_id FROM team_selection_rider INNER JOIN account_participation USING (account_participation_id) WHERE budgetparticipation = ${false})
      GROUP BY "Name", "Team ", "Price", dnf`;

    const noTeampointsQuery = `SELECT ${riderpointsallColumns(userCount, true)}
      ${userCount} AS "Usercount", string_agg(DISTINCT username, ', ') AS "Users" FROM rider_participation
      LEFT JOIN results_points USING (rider_participation_id)
      INNER JOIN rider USING(rider_id)
      INNER JOIN team_selection_rider on rider_participation.rider_participation_id = team_selection_rider.rider_participation_id
      INNER JOIN account_participation USING(account_participation_id)
      INNER JOIN account USING (account_id)
      WHERE rider_participation.race_id = ${race_id} AND rider_participation.rider_participation_id in (select rider_participation_id from team_selection_rider) AND budgetparticipation = ${false}
      GROUP BY "Name", "Team ", "Price", dnf
      ${notSelectedRidersWithoutTeampoints}
      ORDER BY "Total" DESC;\n `

    var query = allpointsQuery + noTeampointsQuery

    return await sqlDB.query(query);
  }

  const riderpointsallColumns = (userCount, withoutTeampoints) => {
    const rider_name = `CONCAT(firstname, ' ', lastname) AS "Name"`
    const totalscoreVal = withoutTeampoints ? `totalscore - teamscore` : `totalscore `;
    const PPM = `COALESCE(ROUND(SUM(${totalscoreVal})/${userCount}*1e6/price,0),0) AS "PPM"`;
    const totalScore = `COALESCE(SUM(${totalscoreVal})/${userCount},0) AS "Total"`;
    return `${rider_name}, team AS "Team ", price AS "Price", ${totalScore}, 
    ${PPM}, CASE WHEN dnf THEN 'DNF' ELSE '' END AS "dnf",`
  }
}