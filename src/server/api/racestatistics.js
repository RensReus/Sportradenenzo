//In dit bestand staan alle calls die betrekking hebben tot de resultaten van een stage

module.exports = (app) => {
  // sql constants
  var name_link = `CONCAT('/rider/',rider_participation.rider_id) AS "Name_link"`
  var rider_name = `CONCAT(firstname, ' ', lastname) AS "Name"`
  const sqlDB = require('../db/sqlDB');

  app.post('/api/statistics', async (req, res) => {
    var race_id = req.body.race_id;
    var budgetparticipation = req.body.budgetparticipation;
    const results = await getData(req.body.selection, race_id, budgetparticipation, req.user.account_id, req.body.details, req.body.showSelectedOnly)
    res.send(results);
  })

  getData = async (selection, race_id, budgetparticipation, account_id, details, showSelectedOnly) => {
    if (selection === "rondewinsten") return await gettourvictories(budgetparticipation);
    var raceHasStartedQuery = `SELECT * FROM STAGE
    INNER JOIN race USING (race_id)
    WHERE (starttime < now() AT TIME ZONE 'Europe/Paris' OR race.finished) AND race_id = ${race_id}
    ORDER BY stagenr DESC
    LIMIT 1`;
    const results = await sqlDB.query(raceHasStartedQuery);
    if (results.rows.length === 0) {
      return { mode: '404' };
    }
    switch (selection) {
      case "etappewinsten": return await getstagevictories(race_id, budgetparticipation);
      case "allriders": return await getriderpointsall(race_id, budgetparticipation, showSelectedOnly);
      case "selectedriders": return await getriderpointsselected(race_id, budgetparticipation);
      case "missedpoints": return await missedpoints(race_id, budgetparticipation, account_id);
      case "missedpointsall": return await missedpointsall(race_id, budgetparticipation);
      case "teams": return await teams(race_id, budgetparticipation, account_id, details);
      case "teamcomparisons": return await teamcomparisons(race_id, budgetparticipation);
      case "overigestats": return await getadditionalstats(race_id, budgetparticipation);
    }
  }


  gettourvictories = async (budgetparticipation) => {
    // var poule_id = req.body.poule_id;
    var subquery = `(SELECT username, finalscore, CONCAT(year, ' ', name) AS race, rank() over (PARTITION BY race ORDER BY finalscore DESC) FROM account_participation
            INNER JOIN account USING (account_id)
            INNER JOIN race USING(race_id)
            WHERE budgetparticipation = ${budgetparticipation} AND NOT name = 'classics' AND finished = TRUE AND year > 2014) AS subquery`
    var rankQuery = `SELECT ARRAY_AGG(username ORDER BY finalscore DESC) as usernames, ARRAY_AGG(finalscore ORDER BY finalscore DESC) as scores, race FROM ${subquery} GROUP BY race; `;//ranking per stage
    var countQuery = `SELECT username, ARRAY_AGG(rank) as ranks, ARRAY_AGG(count) as rankcounts FROM 
            (SELECT username, rank, COUNT(rank) FROM ${subquery} GROUP BY username,rank) b
            GROUP BY username; \n`//aantal keer per ranking

    var low = `COUNT(CASE WHEN finalscore < 4000 THEN 1 END) AS "<4K"`
    var second = `COUNT(CASE WHEN finalscore >= 4000 AND finalscore < 4500 THEN 1 END) AS "4K"`
    var third = `COUNT(CASE WHEN finalscore >= 4500 AND finalscore < 5000 THEN 1 END) AS "4.5K"`
    var high = `COUNT(CASE WHEN finalscore >= 5000 THEN 1 END) AS ">5K"`
    var orderby = `ORDER BY ">5K" DESC, "4.5K" DESC, "4K" DESC, "<4K" DESC`
    if (budgetparticipation) {
      low = `COUNT(CASE WHEN finalscore < 500 THEN 1 END) AS "<500"`
      second = `COUNT(CASE WHEN finalscore >= 500 AND finalscore < 750 THEN 1 END) AS "500 "`
      third = `COUNT(CASE WHEN finalscore >= 750 AND finalscore < 1000 THEN 1 END) AS "750 "`
      high = `COUNT(CASE WHEN finalscore >= 1000 THEN 1 END) AS ">1K"`
      orderby = `ORDER BY ">1K" DESC, "750 " DESC, "500 " DESC, "<500" DESC`
    }
    var scoreCountQuery = `SELECT username AS "User", ${low}, ${second}, ${third}, ${high} from account_participation
                INNER JOIN account USING(account_id)
                INNER JOIN race USING(race_id)
                WHERE budgetparticipation = ${budgetparticipation} AND NOT name = 'classics' AND finished
                GROUP BY username
                ${orderby}`

    var query = rankQuery + countQuery + scoreCountQuery;
    return await processVictoriesQuery(query, "Race")
  }

  getstagevictories = async (race_id, budgetparticipation) => {
    var subquery = `(SELECT username, stagescore, stagenr, rank() over (PARTITION BY stagenr ORDER BY stagescore DESC) FROM stage_selection
    INNER JOIN account_participation USING (account_participation_id)
    INNER JOIN account USING (account_id)
    INNER JOIN stage USING (stage_id)
    WHERE stage.race_id = ${race_id} AND NOT username = 'tester' AND budgetparticipation = ${budgetparticipation} AND stage.finished) AS subquery`
    var query1 = `SELECT ARRAY_AGG(username ORDER BY stagescore DESC) as usernames, ARRAY_AGG(stagescore ORDER BY stagescore DESC) as scores, stagenr FROM ${subquery} GROUP BY stagenr; `;//ranking per stage
    var query2 = `SELECT username, ARRAY_AGG(rank) as ranks, ARRAY_AGG(count) as rankcounts FROM 
    (SELECT username, rank, COUNT(rank) FROM ${subquery} GROUP BY username,rank) b
    GROUP BY username; \n`//aantal keer per ranking

    var first = `COUNT(CASE WHEN stagescore < 50 THEN 1 END) AS "50-"`
    var second = `COUNT(CASE WHEN stagescore >= 50 AND stagescore < 100 THEN 1 END) AS "50 "`
    var third = `COUNT(CASE WHEN stagescore >= 100 AND stagescore < 200 THEN 1 END) AS "100 "`
    var fourth = `COUNT(CASE WHEN stagescore >= 200 AND stagescore < 300 THEN 1 END) AS "200 "`
    var last = `COUNT(CASE WHEN stagescore >= 300 THEN 1 END) AS "300+"`
    var orderby = `ORDER BY "300+" DESC, "200 " DESC, "100 " DESC, "50 " DESC, "50-" DESC`

    if (budgetparticipation) {
      first = `COUNT(CASE WHEN stagescore < 10 THEN 1 END) AS "10-"`
      second = `COUNT(CASE WHEN stagescore >= 10 AND stagescore < 30 THEN 1 END) AS "10 "`
      third = `COUNT(CASE WHEN stagescore >= 30 AND stagescore < 50 THEN 1 END) AS "30 "`
      fourth = `COUNT(CASE WHEN stagescore >= 50 AND stagescore < 100 THEN 1 END) AS "50 "`
      last = `COUNT(CASE WHEN stagescore >= 100 THEN 1 END) AS "100+"`
      orderby = `ORDER BY "100+" DESC, "50 " DESC, "30 " DESC, "10 " DESC, "10-" DESC`
    }
    var scoreCountQuery = `SELECT username AS "User", ${first}, ${second}, ${third}, ${fourth}, ${last} from stage_selection
                INNER JOIN account_participation USING(account_participation_id)
                INNER JOIN account USING(account_id)
                INNER JOIN stage USING(stage_id)
                WHERE budgetparticipation = ${budgetparticipation} AND stage.race_id = ${race_id} AND account_participation.race_id = ${race_id} AND finished AND NOT type = 'FinalStandings'
                GROUP BY username
                ${orderby}`

    var query = query1 + query2 + scoreCountQuery;
    return await processVictoriesQuery(query, "Stage")
  }

  processVictoriesQuery = async (query, rankTitle) => {
    const results = await sqlDB.query(query);
    var headersRank = [rankTitle];
    var headersCount = ["User"];
    var rowsRank = [];
    var rowsCount = [];

    var userCount = results[1].rows.length
    for (var i in results[0].rows) {//ranking per stage
      let row;
      if (rankTitle === "Stage") {
        row = [results[0].rows[i].stagenr];
      }
      if (rankTitle === "Race") {
        row = [results[0].rows[i].race];
      }
      for (var j in results[0].rows[i].usernames) {
        row.push(results[0].rows[i].usernames[j] + " (" + results[0].rows[i].scores[j] + ")");
      }
      rowsRank.push(row);
    }

    for (var i in results[1].rows) {//aantal keer per ranking
      var user = results[1].rows[i];
      var row = new Array(userCount + 1).fill(0)
      row[0] = user.username;
      for (var j in user.ranks) {
        row[user.ranks[j]] = user.rankcounts[j];
      }
      rowsCount.push(row);
    }

    //make headers
    for (var i = 1; i < userCount + 1; i++) {
      headersRank.push(i + "e");
      headersCount.push(i + "e");
    }

    //sort rowsCount
    rowsCount.sort(function (a, b) {
      for (var i = 1; i < userCount + 1; i++) {
        if (a[i] > b[i]) return false;
        if (a[i] < b[i]) return true;
      }
      return false;
    })

    var rankTable = []
    for (let i in rowsRank) {
      let newRow = {};
      for (let j in headersRank) {
        newRow[headersRank[j]] = rowsRank[i][j]
      }
      rankTable.push(newRow)
    }

    var countTable = []
    for (let i in rowsCount) {
      let newRow = {};
      for (let j in headersCount) {
        newRow[headersCount[j]] = rowsCount[i][j]
      }
      countTable.push(newRow)
    }

    let titleVar
    if (rankTitle === "Stage") {
      titleVar = "Etappe";
    }
    if (rankTitle === "Race") {
      titleVar = "Ronde";
    }

    var tables = []
    tables.push({ tableData: rankTable, title: `${titleVar} Uitslagen` })
    tables.push({ tableData: countTable, title: "Hoe vaak welke positie" })
    tables.push({ tableData: results[2].rows, title: "Score verdelingen" })
    return { tables, title: `${titleVar} Winsten Overzicht` };
  }

  getriderpointsall = async (race_id, budgetparticipation, showSelectedOnly) => {
    var userCount = "count(DISTINCT username)";
    var userCountNS = "1";
    var teamscore = ` SUM(teamscore)/${userCount} AS "Team",`
    var teamscoreNS = ` SUM(teamscore)/${userCountNS} AS "Team",`
    var totalscoreVal = `totalscore `
    if (budgetparticipation) {
      teamscore = '';
      teamscoreNS = '';
      totalscoreVal = `totalscore - teamscore `
    }
    var onlySelected = "";
    if (showSelectedOnly) {
      onlySelected = ""
    }
    var stageScore = `COALESCE(SUM(stagescore)/${userCount}, 0) AS "Etappe"`;
    var gcScore = `COALESCE(SUM(gcscore)/${userCount}, 0) AS "AK"`;
    var pointsScore = `COALESCE(SUM(pointsscore)/${userCount}, 0) AS "Punten"`;
    var komScore = `COALESCE(SUM(komscore)/${userCount}, 0) AS "Berg"`;
    var youthScore = `COALESCE(SUM(yocscore)/${userCount}, 0) AS "Jong"`;
    var klassementScore = `COALESCE((SUM(gcscore) + SUM(pointsscore) + SUM(komscore) + SUM(yocscore))/${userCount}, 0) AS "Klassement"`;
    var PPM = `COALESCE(ROUND(SUM(${totalscoreVal})/${userCount}*1e6/price,0),0) AS "PPM"`;
    var totalScore = `COALESCE(SUM(${totalscoreVal})/${userCount},0) AS "Total"`;
    var stageScoreNS = `COALESCE(SUM(stagescore)/${userCountNS}, 0) AS "Etappe"`;
    var gcScoreNS = `COALESCE(SUM(gcscore)/${userCountNS}, 0) AS "AK"`;
    var pointsScoreNS = `COALESCE(SUM(pointsscore)/${userCountNS}, 0) AS "Punten"`;
    var komScoreNS = `COALESCE(SUM(komscore)/${userCountNS}, 0) AS "Berg"`;
    var youthScoreNS = `COALESCE(SUM(yocscore)/${userCountNS}, 0) AS "Jong"`;
    var klassementScoreNS = `COALESCE((SUM(gcscore) + SUM(pointsscore) + SUM(komscore) + SUM(yocscore))/${userCountNS}, 0) AS "Klassement"`;
    var PPMNS = `COALESCE(ROUND(SUM(${totalscoreVal})/${userCountNS}*1e6/price,0),0) AS "PPM"`;
    var totalScoreNS = `COALESCE(SUM(${totalscoreVal})/${userCountNS},0) AS "Total"`;
    var notSelectedRiders = `UNION 
      SELECT ${name_link}, ${rider_name}, team AS "Team ", price AS "Price", 
      ${stageScoreNS},${gcScoreNS}, ${pointsScoreNS}, ${komScoreNS}, ${youthScoreNS},
      ${klassementScoreNS}, ${teamscoreNS} ${totalScoreNS}, 
      ${PPMNS}, CASE WHEN dnf THEN 'DNF' ELSE '' END AS "dnf",
      0 AS "Usercount", '' AS "Users" FROM rider_participation
      LEFT JOIN results_points USING (rider_participation_id)
      INNER JOIN rider USING(rider_id)
      WHERE rider_participation.race_id = ${race_id} ${onlySelected} AND NOT rider_participation_id IN (SELECT rider_participation_id FROM team_selection_rider) AND price < 750000
      GROUP BY "Name", "Name_link", "Team ", "Price", dnf`;
    if (showSelectedOnly) {
      notSelectedRiders = ""
    }
    var query = `SELECT ${name_link}, ${rider_name}, team AS "Team ", price AS "Price", 
      ${stageScore},${gcScore}, ${pointsScore}, ${komScore}, ${youthScore},
      ${klassementScore}, ${teamscore} ${totalScore}, 
      ${PPM}, CASE WHEN dnf THEN 'DNF' ELSE '' END AS "dnf",
      ${userCount} AS "Usercount", string_agg(DISTINCT username, ', ') AS "Users" FROM rider_participation
      LEFT JOIN results_points USING (rider_participation_id)
      INNER JOIN rider USING(rider_id)
      INNER JOIN team_selection_rider on rider_participation.rider_participation_id = team_selection_rider.rider_participation_id
      INNER JOIN account_participation USING(account_participation_id)
      INNER JOIN account USING (account_id)
      WHERE rider_participation.race_id = ${race_id} AND rider_participation.rider_participation_id in (select rider_participation_id from team_selection_rider) AND budgetparticipation = ${budgetparticipation}
      GROUP BY "Name", "Name_link", "Team ", "Price", dnf
      ${notSelectedRiders}
      ORDER BY "Total" DESC`
    //0 for string 1 for number
    var coltype = { "Name": 0, "Team ": 0, "Price": 1, "Etappe": 1, "AK": 1, "Punten": 1, "Berg": 1, "Jong": 1, "Klassement": 1, "Team": 1, "Total": 1, "PPM": 1, "Usercount": 1 };
    var hiddenCols = ["AK", "Punten", "Berg", "Jong", "PPM", "Usercount"];

    const results = await sqlDB.query(query);
    let tables = [{
      tableData: results.rows,
      coltype,
      hiddenCols,
      title: showSelectedOnly ? "Alle Geselecteerde Renners" : "Alle Renners"
    }]
    return { tables, title: "Alle Renners Overzicht" };
  }

  getriderpointsselected = async (race_id, budgetparticipation) => {
    var query = getSelectedRidersClassificationsQuery(race_id, budgetparticipation);

    const results = await sqlDB.query(query);
    let tables = [];

    var classificationNames = ["AK", "Punten", "Berg", "Jong"];

    for (const i = 0; i < results.length; i++) {
      tables.push({
        tableData: results[i].rows,
        title: classificationNames[i]
      })
    }

    return { tables, title: "Klassementen" };
  }

  function getSelectedRidersClassificationsQuery(race_id, budgetparticipation) {
    var mostRecentStage_id = `(SELECT stage_id from results_points 
      INNER JOIN stage USING(stage_id)
      WHERE race_id = ${race_id}
      GROUP BY stage_id
      ORDER BY stage_id DESC
      LIMIT 1)`
    var query = ``;
    var classifications = ["gcpos", "pointspos", "kompos", "yocpos"];
    for (const classification of classifications) {
      query += `SELECT ${classification} AS " ", ${name_link}, ${rider_name},price AS "Price", count(DISTINCT username) AS "Usercount", string_agg(DISTINCT username, ', ') AS "Users"
       FROM results_points 
       LEFT JOIN rider_participation USING (rider_participation_id)
       LEFT JOIN rider USING(rider_id)
       LEFT JOIN team_selection_rider on rider_participation.rider_participation_id = team_selection_rider.rider_participation_id 
       AND team_selection_rider.account_participation_id IN (SELECT account_participation_id FROM account_participation WHERE race_id = ${race_id} AND budgetparticipation = ${budgetparticipation})
       LEFT JOIN account_participation USING(account_participation_id)
       LEFT JOIN account USING (account_id)
       WHERE stage_id = ${mostRecentStage_id} AND NOT ${classification} = 0
       GROUP BY "Name", "Name_link", "Price", " "
       ORDER BY " "
       LIMIT 20; `
    }
    return query;
  }

  missedpoints = async (race_id, budgetparticipation, account_id) => {
    var account_participation_id = `(SELECT account_participation_id, FROM account_participation
                WHERE account_id = ${account_id} AND race_id = ${race_id} AND budgetparticipation = ${budgetparticipation})`
    const outputArray = await missedPointsUser(account_participation_id, budgetparticipation)
    var tables = [{
      tableData: outputArray,
      title: "Gemiste Punten"
    }]
    return { tables, title: "Gemiste Punten" };
  }

  missedpointsall = async (race_id, budgetparticipation) => {
    var usersQuery = `SELECT account_participation_id, username FROM account_participation 
                INNER JOIN account USING (account_id)
                WHERE race_id = ${race_id} AND budgetparticipation = ${budgetparticipation}
                ORDER BY account_id;`
    const results = await sqlDB.query(usersQuery);
    let tables = [];
    for (const account of results.rows) {
      const tableData = await missedPointsUser(account.account_participation_id, budgetparticipation);
      tables.push({ tableData, title: account.username });
    }
    return { tables, title: "Gemiste Punten Iedereen" };
  }

  missedPointsUser = async (account_participation_id, budgetparticipation) => {
    var teamselection = `SELECT rider_participation_id FROM team_selection_rider
                WHERE account_participation_id = ${account_participation_id}\n `
    var totalscore = 'totalscore';
    if (budgetparticipation) totalscore = 'totalscore - teamscore';
    var ridersQuery = `SELECT stagenr, ARRAY_AGG(JSON_BUILD_OBJECT('id',rider_participation_id,'stage', stagescore,'total',${totalscore}) ORDER BY ${totalscore} DESC) AS points FROM results_points 
                INNER JOIN stage USING(stage_id)
                WHERE rider_participation_id IN (${teamselection})
                GROUP BY stagenr;\n `;
    var resultsQuery = `SELECT stagescore FROM stage_selection 
                INNER JOIN stage USING(stage_id) WHERE account_participation_id = ${account_participation_id}
                ORDER BY stagenr;\n `
    var totalQuery = ridersQuery + resultsQuery;
    const results = await sqlDB.query(totalQuery);
    var outputArray = [];
    var actualPoints = results[1].rows.map(a => a.stagescore);
    var optimalTotal = 0;
    var actualTotal = 0;
    var missedTotal = 0;
    for (var i = 0; i < results[0].rows.length; i++) {
      optimalPoints = 0;
      var totalscores = results[0].rows[i].points.map(scores => ({ score: scores.total, id: scores.id }));
      var stagescores = results[0].rows[i].points.map(scores => ({ score: scores.stage, id: scores.id }));
      stagescores.sort(function (a, b) { return b.score - a.score })
      var bestId = stagescores[0].id;
      var pos = attrIndex(totalscores, 'index', bestId)
      var forRenners = 9;
      if (pos > 8) forRenners = 8;

      for (var j = 0; j < forRenners; j++) {
        if (totalscores[j] == undefined) continue;
        optimalPoints += totalscores[j].score;
        if (totalscores[j].id === bestId) {
          optimalPoints += stagescores[0].score * .5;
        }
      }
      if (forRenners === 8) {
        outputArray.push({ Behaald: "Zeg tegen Rens", Optimaal: "dat er iets", Gemist: "speciaals gebeurt is" })
      } else {
        if (i === 21) {
          outputArray.push({ Etappe: i + 1, Behaald: actualPoints[i], Optimaal: actualPoints[i], Gemist: 0 })
        } else {
          outputArray.push({ Etappe: i + 1, Behaald: actualPoints[i], Optimaal: optimalPoints, Gemist: optimalPoints - actualPoints[i] })
        }
        optimalTotal += optimalPoints;
        actualTotal += actualPoints[i];
        missedTotal += optimalPoints - actualPoints[i];
      }
    }
    outputArray.push({ Etappe: "Totaal", Behaald: actualTotal, Optimaal: optimalTotal, Gemist: missedTotal })
    return outputArray;
  }

  function attrIndex(array, attr, value) {
    for (var i = 0; i < array.length; i += 1) {
      if (array[i][attr] === value) {
        return i;
      }
    }
    return -1;
  }

  teams = async (race_id, budgetparticipation, account_id, details) => {
    var usersQuery = `SELECT account_participation_id, username FROM account_participation 
                INNER JOIN account USING (account_id)   
                WHERE race_id = ${race_id} AND budgetparticipation = ${budgetparticipation}
                ORDER BY account_id;`
    var main_account_participation_id = `(SELECT account_participation_id FROM account_participation 
      WHERE race_id = ${race_id} AND budgetparticipation = ${budgetparticipation} AND account_id = ${account_id})`
    const results = await sqlDB.query(usersQuery);
    const tables = [];
    for (const account of results.rows) {
      const teamoverzicht = await teamoverzichtuser(main_account_participation_id, account.account_participation_id, budgetparticipation, details, race_id);
      if (details) {
        tables.push({ tableData: teamoverzicht.tableData, title: account.username, coltype: teamoverzicht.coltype })
      } else {
        tables.push({ riders: teamoverzicht.tableData, username: account.username, coltype: teamoverzicht.coltype })
      }
    };

    if (!details) {
      tables = selectionsPopUp(tables);
    }
    return { tables, title: "Team Overzicht Iedereen" };
  }

  teamoverzichtuser = async (main_account_participation_id, account_participation_id, budgetparticipation, details, race_id) => {
    var selected_riders_stages = `(SELECT rider_participation_id, kopman_id, stage_id FROM stage_selection_rider
        INNER JOIN stage_selection USING(stage_selection_id)
        INNER JOIN stage USING (stage_id)
        WHERE account_participation_id = ${account_participation_id} AND NOW() > starttime
        UNION
        SELECT rider_participation_id, null, (SELECT stage_id FROM stage WHERE type = 'FinalStandings' AND race_id = ${race_id}) FROM team_selection_rider 
        INNER JOIN rider_participation USING (rider_participation_id)
        WHERE account_participation_id = ${account_participation_id} AND NOT dnf) a`
    var inteam = `CASE WHEN rider_participation.rider_participation_id IN (SELECT rider_participation_id FROM team_selection_rider WHERE account_participation_id = ${main_account_participation_id}) THEN 'bold black' ELSE '' END`
    var rowClassName = `${inteam} AS "rowClassName"`;
    var totalscore = `CASE WHEN a.kopman_id = a.rider_participation_id THEN totalscore + stagescore * .5 ELSE totalscore END`
    var stagescore = `CASE WHEN a.kopman_id = a.rider_participation_id THEN stagescore * 1.5 ELSE stagescore END`
    var teamscore = `,  COALESCE(SUM(teamscore),0) AS "Team"`;
    var notSelectedteamscore = `,  0 AS "Team"`;
    if (budgetparticipation) {
      totalscore = `CASE WHEN a.kopman_id = a.rider_participation_id THEN totalscore + stagescore * .5 - teamscore ELSE totalscore - teamscore END`
      teamscore = '';
      notSelectedteamscore = '';
    }
    var columns = `${name_link}, ${rider_name}, COALESCE(SUM(${stagescore}),0) AS "Stage", COALESCE(SUM(gcscore),0) AS "AK", COALESCE(SUM(pointsscore),0) AS "Punten", COALESCE(SUM(komscore),0) AS "Berg", COALESCE(SUM(yocscore),0) AS "Jong" ${teamscore}, COALESCE(SUM(${totalscore}),0) AS "Total", CASE WHEN dnf THEN 'DNF' ELSE '' END AS "dnf", COALESCE(COUNT(rider_participation_id),0) AS "Selected", COALESCE(ROUND(SUM(${totalscore})/COUNT(rider_participation_id),0),0) AS "Per Etappe"`
    var notSelectedColumns = `${name_link}, ${rider_name}, 0 AS "Stage", 0 AS "AK", 0 AS "Punten", 0 AS "Berg", 0 AS "Jong" ${notSelectedteamscore}, 0 AS "Total", CASE WHEN dnf THEN 'DNF' ELSE '' END AS "dnf", 0 AS "Selected", 0 AS "Per Etappe"`
    var coltype = { "Name": 0, "Stage": 1, "AK": 1, "Punten": 1, "Berg": 1, "Jong": 1, "Team": 1, "Total": 1, "Selected": 1, "Per Etappe": 1, "dnf": 0 };
    var orderBy = `"Total"`
    if (!details) {
      orderBy = `"Score"`
      coltype = {};
      columns = `${name_link}, ${rider_name}, COALESCE(SUM(${totalscore}),0) AS "Score"`
      notSelectedColumns = `${name_link}, ${rider_name}, 0 AS "Score"`
    }
    var alreadyFound = `SELECT rider_participation_id FROM rider
      INNER JOIN rider_participation USING(rider_id)
      RIGHT JOIN ${selected_riders_stages} USING (rider_participation_id)
      LEFT JOIN results_points USING(stage_id,rider_participation_id)`
    var query = `SELECT ${columns}, ${rowClassName} FROM rider
      INNER JOIN rider_participation USING(rider_id)
      RIGHT JOIN ${selected_riders_stages} USING (rider_participation_id)
      LEFT JOIN results_points USING(stage_id,rider_participation_id)
      GROUP BY "Name", "Name_link", "rowClassName", dnf
      UNION
      SELECT ${notSelectedColumns}, ${rowClassName} from team_selection_rider 
      INNER JOIN rider_participation USING(rider_participation_id)
      INNER JOIN rider USING(rider_id)
      WHERE rider_participation_id NOT IN (${alreadyFound}) AND account_participation_id = ${account_participation_id}
      ORDER BY ${orderBy} DESC`

    const results = await sqlDB.query(query);
    return { tableData: results.rows, coltype };
  }

  getadditionalstats = async (race_id, budgetparticipation) => {
    var selectedRidersQuery = `SELECT stagenr as "Etappe", COUNT(DISTINCT rider_participation) as "Renners" from stage_selection_rider
                INNER JOIN stage_selection USING(stage_selection_id)
                INNER JOIN rider_participation USING(rider_participation_id)
                INNER JOIN account_participation USING (account_participation_id)
                INNER JOIN stage USING(stage_id)
                WHERE stage.race_id = ${race_id} AND budgetparticipation = ${budgetparticipation} AND starttime < now() AT TIME ZONE 'Europe/Paris'
                GROUP BY stagenr; `;

    var uitgevallenQuery = `SELECT username AS "User", COUNT(rider_participation_id) AS "Uitvallers", SUM(price) AS "Waarde" FROM rider_participation
                INNER JOIN team_selection_rider USING(rider_participation_id)
                INNER JOIN account_participation USING(account_participation_id)
                INNER JOIN account USING(account_id)
                WHERE rider_participation.race_id = ${race_id} AND dnf AND budgetparticipation = ${budgetparticipation}
                GROUP BY "User"
                ORDER BY "Uitvallers" DESC; `

    var betereUniekheidsQuery = `SELECT username AS "User", SUM("Usercount") AS "Uniekheid", ROUND(SUM("Usercount"*"Price")/1000000,2) AS "Uniekheid (Geld)" FROM (
                    SELECT  ${rider_name}, rider_participation.rider_participation_id, team AS "Team ",price AS "Price",  
                                ABS(COUNT(DISTINCT username)-4) AS "Usercount", ARRAY_AGG(DISTINCT username) AS "Users" FROM rider_participation
                                INNER JOIN rider USING(rider_id)
                                LEFT JOIN team_selection_rider USING(rider_participation_id)
                                LEFT JOIN account_participation USING(account_participation_id)
                                LEFT JOIN account USING (account_id)
                                WHERE rider_participation.race_id = ${race_id} AND rider_participation.rider_participation_id in (SELECT rider_participation_id FROM team_selection_rider) AND NOT username = 'tester' AND budgetparticipation = ${budgetparticipation}
                                GROUP BY "Name", "Team ", "Price", rider_participation.rider_participation_id
                    ORDER BY "Usercount" DESC, "Users") as a
                    INNER JOIN team_selection_rider USING(rider_participation_id)
                    INNER JOIN account_participation USING(account_participation_id)
                    INNER JOIN account USING(account_id)
                    WHERE budgetparticipation = ${budgetparticipation}
                    GROUP BY "User"
                    ORDER BY "Uniekheid" DESC; `

    var totalQuery = selectedRidersQuery + uitgevallenQuery + betereUniekheidsQuery;
    var titles = ['Verschillende Gekozen Renners', 'Uitgevallen Renners', `Uniekste team`, `Uniekste team(beter)`]
    var coltypes = [{}, { "Uitvallers": 1, "Waarde": 1 }, {}, { "Uniekheid": 1, "Uniekheid (Geld)": 1 }]
    const results = await sqlDB.query(totalQuery);
    var tables = [];
    for (var i in results) {
      tables.push({ title: titles[i], tableData: results[i].rows, coltype: coltypes[i] })
    }
    let title = "Overige Statistieken";
    return { tables, title };
  }

  teamcomparisons = async (race_id, budgetparticipation) => {
    var usersQuery = `SELECT username, ARRAY_AGG(json_build_object('price', price, 'rider_participation_id', rider_participation_id)) AS riders FROM team_selection_rider 
    INNER JOIN rider_participation USING (rider_participation_id)
    INNER JOIN account_participation USING (account_participation_id)
    INNER JOIN account USING (account_id)
    WHERE rider_participation.race_id = ${race_id} AND budgetparticipation = ${budgetparticipation}
    GROUP BY username;
    SELECT budget FROM race WHERE race_id = ${race_id}`
    const results = await sqlDB.query(usersQuery);
    var countAbs = [];
    var countRel = [];
    var budgetAbs = [];
    var budgetRel = [];
    var coltype = { ' ': 0 }
    var budget = results[1].rows[0].budget / 1000000;
    if (budgetparticipation) budget = 11.5;
    for (var i in results[0].rows) {
      var team1 = results[0].rows[i].riders;
      var user1 = results[0].rows[i].username
      coltype[user1] = 1;
      var row = { ' ': user1 };
      var rowRel = { ' ': user1 };
      var rowBudget = { ' ': user1 };
      var rowBudgetRel = { ' ': user1 };
      for (var j in results[0].rows) {
        var user2 = results[0].rows[j].username
        var sameRiders = 0;
        var sameBudget = 0;
        if (i === j) {
          row[user2] = 'X';
          rowBudget[user2] = 'X';
          rowRel[user2] = 'X';
          rowBudgetRel[user2] = 'X';
          continue;
        }
        var team2 = results[0].rows[j].riders;
        for (var k in team1) {
          for (var l in team2) {
            if (team1[k].rider_participation_id === team2[l].rider_participation_id) {
              sameRiders++;
              sameBudget += team1[k].price / 1000000;
              break;
            }
          }
        }
        row[user2] = sameRiders;
        rowBudget[user2] = sameBudget;
        rowRel[user2] = Math.round(sameRiders / 20 * 100);
        rowBudgetRel[user2] = Math.round(sameBudget / budget * 100)
      }
      countAbs.push(row)
      budgetAbs.push(rowBudget)
      countRel.push(rowRel)
      budgetRel.push(rowBudgetRel)
    }
    var tables = []
    tables.push({ title: "Renners Absoluut", tableData: countAbs, coltype })
    tables.push({ title: `Budget (${budget}M) Absoluut`, tableData: budgetAbs, coltype })
    tables.push({ title: "Renners Relatief", tableData: countRel, coltype })
    tables.push({ title: `Budget Relatief`, tableData: budgetRel, coltype })
    var title = "Vergelijking van Selecties"
    return { tables, title };
  }

  //for the individual rider page
  app.post('/api/getriderresults', async (req, res) => {

    var riderQuery = `SELECT country, name, year, CONCAT(firstname, ' ', lastname) AS ridername, rider_participation_id, team  FROM rider_participation
    INNER JOIN race USING(race_id)
    INNER JOIN rider USING(rider_id)
    WHERE rider_id = ${req.body.rider_id}
    ORDER BY year, name; `

    const riderResults = await sqlDB.query(riderQuery);
    const riderName = riderResults.rows[0].ridername;
    const country = riderResults.rows[0].country;
    const races = riderResults.rows;
    let totalQuery = '';
    for (let i in riderResults.rows) {
      totalQuery += `SELECT stagenr AS "Etappe", stagepos AS "Dag", gcpos AS "Ak", pointspos AS "Punten", kompos AS "Berg", yocpos AS "Jong" FROM results_points
        INNER JOIN stage USING(stage_id)
        WHERE rider_participation_id = ${riderResults.rows[i].rider_participation_id}
        ORDER BY "Etappe";\n `
      totalQuery += `SELECT stagenr AS "Etappe", stagescore AS "Dag", gcscore AS "Ak", pointsscore AS "Punten", komscore AS "Berg", yocscore AS "Jong", teamscore AS "Team", totalscore AS "Totaal" FROM results_points
        INNER JOIN stage USING(stage_id)
        WHERE rider_participation_id = ${riderResults.rows[i].rider_participation_id}
        UNION all
        SELECT 100 AS "Etappe", SUM(stagescore) AS "Dag", SUM(gcscore) AS "Ak", SUM(pointsscore) AS "Punten", SUM(komscore) AS "Berg", SUM(yocscore) AS "Jong", SUM(teamscore) AS "Team", SUM(totalscore) AS "Totaal" FROM results_points
        INNER JOIN stage USING(stage_id)
        WHERE rider_participation_id = ${riderResults.rows[i].rider_participation_id}
        GROUP BY "Etappe"
        ORDER BY "Etappe";\n `
    }
    const results = await sqlDB.query(totalQuery);
    let pointsData = [];
    let posData = [];
    for (let i = 0; i < results.length; i += 2) {
      let newPointsData = results[i + 1].rows
      if (newPointsData.length) newPointsData[newPointsData.length - 1]["Etappe"] = "Totaal";
      pointsData.push(newPointsData)
      let newPosData = results[i].rows;
      for (let k in newPosData) {
        for (let j in newPosData[k]) {
          if (newPosData[k][j] === 0) {
            newPosData[k][j] = '-'
          }
        }
      }
      posData.push(newPosData)
    }
    res.send({
      posData,
      pointsData,
      riderName,
      country,
      races
    })
  })
}