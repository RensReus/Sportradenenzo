module.exports = (app) => {
  const sqlDB = require('../db/sqlDB');
  app.post('/api/racestatistics/25', async (req, res) => {
    const raceId = 25;
    const riderpoints = await getriderpointsall(raceId);
    res.send(riderpoints);
  });

  const getriderpointsall = async (race_id: number) => {
    var userCount = "count(DISTINCT username)";

    const notSelectedRiders = `UNION 
      SELECT ${riderpointsallColumns(1)}
      0 AS "Usercount", '' AS "Users" FROM rider_participation
      LEFT JOIN results_points USING (rider_participation_id)
      INNER JOIN rider USING(rider_id)
      WHERE rider_participation.race_id = ${race_id} AND NOT rider_participation_id IN (SELECT rider_participation_id FROM team_selection_rider INNER JOIN account_participation USING (account_participation_id) WHERE budgetparticipation = ${false})
      GROUP BY "Name", "Team ", "Price", dnf`;

    const query = `SELECT ${riderpointsallColumns(userCount)}
      ${userCount} AS "Usercount", string_agg(DISTINCT username, ', ') AS "Users" FROM rider_participation
      LEFT JOIN results_points USING (rider_participation_id)
      INNER JOIN rider USING(rider_id)
      INNER JOIN team_selection_rider on rider_participation.rider_participation_id = team_selection_rider.rider_participation_id
      INNER JOIN account_participation USING(account_participation_id)
      INNER JOIN account USING (account_id)
      WHERE rider_participation.race_id = ${race_id} AND rider_participation.rider_participation_id in (select rider_participation_id from team_selection_rider) AND budgetparticipation = ${false}
      GROUP BY "Name", "Team ", "Price", dnf
      ${notSelectedRiders}
      ORDER BY "Total" DESC`
    //0 for string 1 for number
    const coltype = {
      "Name": 0, 
      "Team ": 0, 
      "Price": 1, 
      "Total": 1,
      "PPM": 1,
      "EPPM": 1,
      "Usercount": 1 
    };

    const results = await sqlDB.query(query);
    return results.rows;
  }

  const riderpointsallColumns = (userCount) => {
    const rider_name = `CONCAT(firstname, ' ', lastname) AS "Name"`
    const totalscoreVal = `totalscore `;
    const PPM = `COALESCE(ROUND(SUM(${totalscoreVal})/${userCount}*1e6/price,0),0) AS "PPM"`;
    const totalScore = `COALESCE(SUM(${totalscoreVal})/${userCount},0) AS "Total"`;
    return `${rider_name}, team AS "Team ", price AS "Price", ${totalScore}, 
    ${PPM}, CASE WHEN dnf THEN 'DNF' ELSE '' END AS "dnf",`
  }
}