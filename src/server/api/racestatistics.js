//In dit bestand staan alle calls die betrekking hebben tot de resultaten van een stage

module.exports = (app) => {
  const sqlDB = require('../db/sqlDB');
  const async = require('async');

  app.post('/api/statistics', function (req, res) {
    var race_id = req.body.race_id;
    var budgetparticipation = req.body.budgetparticipation;
    if (!req.body.alwaysget) {
      var raceHasStartedQuery = `SELECT * FROM STAGE
      INNER JOIN race USING (race_id)
      WHERE (starttime < now() AT TIME ZONE 'Europe/Paris' OR race.finished) AND race_id = ${race_id}
      ORDER BY stagenr DESC
      LIMIT 1`;
      sqlDB.query(raceHasStartedQuery, (err, results) => {
        if (err) { console.log("WRONG QUERY:", raceHasStartedQuery); console.log(err.toString()) }
        if (results.rows.length === 0) {
          res.send({ mode: '404' })
        } else {
          getData(req.body.selection, race_id, budgetparticipation, req.user.account_id, function (err, results) {
            if (err) { console.log(err.toString()) }
            res.send(results);
          })
        }
      })
    } else {
      getData(req.body.selection, race_id, budgetparticipation, req.user.account_id, function (err, results) {
        if (err) { console.log(err.toString()) }
        res.send(results);
      })
    }
  })

  async function getData(selection, race_id, budgetparticipation, account_id, callback) {
    switch (selection) {
      case "getstagevictories": getstagevictories(race_id, budgetparticipation, callback); break;
      case "gettourvictories": gettourvictories(budgetparticipation, callback); break;
      case "getriderpointsall": getriderpointsall(race_id, budgetparticipation, callback); break;
      case "getriderpointsselected": getriderpointsselected(race_id, budgetparticipation, callback); break;
      case "missedpoints": missedpoints(race_id, budgetparticipation, account_id, callback); break;
      case "missedpointsall": missedpointsall(race_id, budgetparticipation, callback); break;
      case "teamoverzicht": teamoverzicht(race_id, budgetparticipation, account_id, callback); break;
      case "teamoverzichtall": teamoverzichtall(race_id, budgetparticipation, callback); break;
      case "teamoverzichtallsimple": teamoverzichtallsimple(race_id, budgetparticipation, callback); break;
      case "teamcomparisons": teamcomparisons(race_id, budgetparticipation, callback); break;
      case "getadditionalstats": getadditionalstats(race_id, budgetparticipation, callback); break;
    }
  }

  function getstagevictories (race_id, budgetparticipation, callback) {
    var subquery = `(SELECT username, stagescore, stagenr, rank() over (PARTITION BY stagenr ORDER BY stagescore DESC) FROM stage_selection
    INNER JOIN account_participation USING (account_participation_id)
    INNER JOIN account USING (account_id)
    INNER JOIN stage USING (stage_id)
    WHERE stage.race_id = ${race_id} AND NOT username = 'tester' AND budgetparticipation = ${budgetparticipation} AND stage.finished) AS subquery`
    var query1 = `SELECT ARRAY_AGG(username ORDER BY stagescore DESC) as usernames, ARRAY_AGG(stagescore ORDER BY stagescore DESC) as scores, stagenr FROM ${subquery} GROUP BY stagenr; `;//ranking per stage
    var query2 = `SELECT username, ARRAY_AGG(rank) as ranks, ARRAY_AGG(count) as rankcounts FROM 
    (SELECT username, rank, COUNT(rank) FROM ${subquery} GROUP BY username,rank) b
    GROUP BY username`//aantal keer per ranking
    var query = query1 + query2;
    sqlDB.query(query, (err, res) => {
      if (err) { console.log("WRONG QUERY:", query); callback(err, {}) }
      else {
        var headersRank = ["Stage"];
        var headersCount = ["User"];
        var rowsRank = [];
        var rowsCount = [];

        var userCount = res[1].rows.length
        for (var i in res[0].rows) {//ranking per stage
          var row = [parseInt(i) + 1];
          for (var j in res[0].rows[i].usernames) {
            row.push(res[0].rows[i].usernames[j] + " (" + res[0].rows[i].scores[j] + ")");
          }
          rowsRank.push(row);
        }

        for (var i in res[1].rows) {//aantal keer per ranking
          var user = res[1].rows[i];
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
        var tables = []
        tables.push({ tableData: rankTable, title: "Etappe Uitslagen" })
        tables.push({ tableData: countTable, title: "Hoe vaak welke positie" })
        callback(err, { tables, title: "Etappe Winsten Overzicht" })
      }
    })
  }

  function gettourvictories (budgetparticipation, callback) {
    // var poule_id = req.body.poule_id;
    var subquery = `(SELECT username, finalscore, CONCAT(year, ' ', name) AS race, rank() over (PARTITION BY race ORDER BY finalscore DESC) FROM account_participation
            INNER JOIN account USING (account_id)
            INNER JOIN race USING(race_id)
            WHERE budgetparticipation = ${budgetparticipation} AND NOT name = 'classics' AND finished = TRUE) AS subquery`
    var rankQuery = `SELECT ARRAY_AGG(username ORDER BY finalscore DESC) as usernames, ARRAY_AGG(finalscore ORDER BY finalscore DESC) as scores, race FROM ${subquery} GROUP BY race; `;//ranking per stage
    var countQuery = `SELECT username, ARRAY_AGG(rank) as ranks, ARRAY_AGG(count) as rankcounts FROM 
            (SELECT username, rank, COUNT(rank) FROM ${subquery} GROUP BY username,rank) b
            GROUP BY username; \n`//aantal keer per ranking

    var low = `COUNT(CASE WHEN finalscore < 4000 THEN 1 END) AS "<4K"`
    var medium = `COUNT(CASE WHEN finalscore > 4000 AND finalscore < 5000 THEN 1 END) AS "4K"`
    var high = `COUNT(CASE WHEN finalscore > 5000 THEN 1 END) AS ">5K"`
    var orderby = `ORDER BY ">5K" DESC, "4K" DESC, "<4K" DESC`
    if (budgetparticipation) {
      low = `COUNT(CASE WHEN finalscore < 500 THEN 1 END) AS "<500"`
      medium = `COUNT(CASE WHEN finalscore > 500 AND finalscore < 1000 THEN 1 END) AS "500 "`
      high = `COUNT(CASE WHEN finalscore > 1000 THEN 1 END) AS ">1K"`
      orderby = `ORDER BY ">1K" DESC, "500 " DESC, "<500" DESC`
    }
    var thousandsQuery = `SELECT username AS "User", ${low}, ${medium}, ${high} from account_participation
                INNER JOIN account USING(account_id)
                INNER JOIN race USING(race_id)
                WHERE budgetparticipation = ${budgetparticipation} AND NOT name = 'classics' AND finished
                GROUP BY username
                ${orderby}`

    var query = rankQuery + countQuery + thousandsQuery;
    sqlDB.query(query, (err, results) => {
      if (err) { console.log("WRONG QUERY:", query); callback(err, {}) }
      else {
        var headersRank = ["Race"];
        var headersCount = ["User"];
        var rowsRank = [];
        var rowsCount = [];

        var userCount = results[1].rows.length
        for (var i in results[0].rows) {//ranking per stage
          var row = [results[0].rows[i].race];
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
        var tables = []
        tables.push({ tableData: rankTable, title: "Ronde Uitslagen" })
        tables.push({ tableData: countTable, title: "Hoe vaak welke positie" })
        tables.push({ tableData: results[2].rows, title: "Score verdelingen" })
        callback(err, { tables, title: "Ronde Winsten Overzicht" })
      }
    })
  }

  function getriderpointsall (race_id, budgetparticipation, callback) {
    var teamscore = `SUM(teamscore) AS "Team",`
    var totalscore = `SUM(totalscore)`
    var budgetFilter = ''
    if (budgetparticipation) {
      teamscore = '';
      totalscore = `SUM(totalscore - teamscore)`
      budgetFilter = 'AND price < 1000000'
    }
    var query = `SELECT  CONCAT('/rider/',rider_participation.rider_id) AS "Name_link", CONCAT(firstname, ' ', lastname) AS "Name", team AS "Team ", price AS "Price", SUM(stagescore) AS "Etappe",
      SUM(gcscore) AS "AK", SUM(pointsscore) AS "Punten", SUM(komscore) AS "Berg", SUM(yocscore) AS "Jong", 
      ${teamscore} ${totalscore} AS "Total", ROUND(${totalscore}*1e6/price,0) AS "Points per Million" FROM rider_participation  
      LEFT JOIN results_points USING (rider_participation_id)
      INNER JOIN rider USING(rider_id)
      WHERE rider_participation.race_id = ${race_id} ${budgetFilter}
      GROUP BY "Name", "Name_link", "Team ", "Price"
      ORDER BY "Total" DESC`
    //0 for string 1 for number
    var coltype = { "Name": 0, "Team ": 0, "Price": 1, "Etappe": 1, "AK": 1, "Punten": 1, "Berg": 1, "Jong": 1, "Team": 1, "Total": 1, "Points per Million": 1 };
    sqlDB.query(query, (err, results) => {
      if (err) { console.log("WRONG QUERY:", query); throw err; }
      let tables = [{
        tableData: results.rows,
        coltype: coltype,
        title: "Alle Renners"
      }]
      callback(err, { tables, title: "Alle Renners Overzicht" })
    })
  }

  function getriderpointsselected (race_id, budgetparticipation, callback) {
    var teamscore = ` SUM(teamscore)/GREATEST(count(DISTINCT username),1) AS "Team",`
    var totalscore = `SUM(totalscore)/GREATEST(count(DISTINCT username),1) `
    if (budgetparticipation) {
      teamscore = '';
      totalscore = `SUM(totalscore - teamscore)/GREATEST(count(DISTINCT username),1) `
    }
    var query = `SELECT  CONCAT('/rider/',rider_participation.rider_id) AS "Name_link", CONCAT(firstname, ' ', lastname) AS "Name", team AS "Team ",price AS "Price", SUM(stagescore)/GREATEST(count(DISTINCT username),1) AS "Etappe",  
    SUM(gcscore)/GREATEST(count(DISTINCT username),1) AS "AK", SUM(pointsscore)/GREATEST(count(DISTINCT username),1) AS "Punten", SUM(komscore)/GREATEST(count(DISTINCT username),1) AS "Berg", SUM(yocscore)/GREATEST(count(DISTINCT username),1) AS "Jong", ${teamscore} ${totalscore}AS "Total", 
    ROUND(SUM(totalscore)/GREATEST(count(DISTINCT username),1)*1e6/price,0) AS "Points per Million",  
    count(DISTINCT username) AS "Usercount", string_agg(DISTINCT username, ', ') AS "Users" FROM rider_participation
    LEFT JOIN results_points USING (rider_participation_id)
    INNER JOIN rider USING(rider_id)
    INNER JOIN team_selection_rider on rider_participation.rider_participation_id = team_selection_rider.rider_participation_id
    INNER JOIN account_participation USING(account_participation_id)
    INNER JOIN account USING (account_id)
    WHERE rider_participation.race_id = ${race_id} AND rider_participation.rider_participation_id in (select rider_participation_id from team_selection_rider) AND budgetparticipation = ${budgetparticipation}
    GROUP BY "Name", "Name_link", "Team ", "Price"
    ORDER BY "Total" DESC`
    //0 for string 1 for number
    var coltype = { "Name": 0, "Team ": 0, "Price": 1, "Etappe": 1, "AK": 1, "Punten": 1, "Berg": 1, "Jong": 1, "Team": 1, "Total": 1, "Points per Million": 1, "Usercount": 1 };
    sqlDB.query(query, (err, results) => {
      if (err) { console.log("WRONG QUERY:", query); throw err; }
      let tables = [{
        tableData: results.rows,
        coltype: coltype,
        title: "Alle Geselecteerde Renners"
      }]
      callback(err, { tables, title: "Alle Geselecteerde Renners Overzicht" })
    })
  }

  function missedpoints (race_id, budgetparticipation, account_id, callback){
    var account_participation_id = `(SELECT account_participation_id, FROM account_participation
                WHERE account_id = ${account_id} AND race_id = ${race_id} AND budgetparticipation = ${budgetparticipation})`
    missedPointsUser(account_participation_id, budgetparticipation, function (err, outputArray) {
      if (err) throw err;
      var tables = [{
        tableData: outputArray,
        title: "Gemiste Punten"
      }]
      callback(err, { tables, title: "Gemiste Punten" })
    })
  }

  function missedpointsall (race_id, budgetparticipation, callback){
    var usersQuery = `SELECT account_participation_id, username FROM account_participation 
                INNER JOIN account USING (account_id)
                WHERE race_id = ${race_id} AND budgetparticipation = ${budgetparticipation};`
    sqlDB.query(usersQuery, (err, results) => {
      if (err) { console.log("WRONG QUERY:", usersQuery); throw err; }
      async.map(results.rows, function (account, done) {
        missedPointsUser(account.account_participation_id, budgetparticipation, function (err, tableData) {
          done(err, { tableData, title: account.username })
        })
      }, function (err, tables) {
        if (err) throw err;
        callback(err, { tables, title: "Gemiste Punten Iedereen" })
      })
    })
  }

  function missedPointsUser (account_participation_id, budgetparticipation, callback) {
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
    sqlDB.query(totalQuery, (err, results) => {
      if (err) { console.log("WRONG QUERY:", totalQuery); throw err; }
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
      callback(err, outputArray);
    })
  }

  function attrIndex(array, attr, value) {
    for (var i = 0; i < array.length; i += 1) {
      if (array[i][attr] === value) {
        return i;
      }
    }
    return -1;
  }
  function teamoverzicht (race_id, budgetparticipation, account_id, callback){
    var account_participation_id = `(SELECT account_participation_id FROM account_participation
                    WHERE race_id = ${race_id} AND budgetparticipation = ${budgetparticipation} AND account_id = ${account_id})`
    teamoverzichtuser(account_participation_id, budgetparticipation, false, function (err, results) {
      if (err) throw err;
      let tables = [{
        tableData: results.tableData,
        title: "",
        coltype: results.coltype
      }]
      callback(err, { tables, title: "Team Overzicht" })
    })
  }

  function teamoverzichtall (race_id, budgetparticipation, callback){
    var usersQuery = `SELECT account_participation_id, username FROM account_participation 
                INNER JOIN account USING (account_id)   
                WHERE race_id = ${race_id} AND budgetparticipation = ${budgetparticipation};`
    sqlDB.query(usersQuery, (err, results) => {
      if (err) { console.log("WRONG QUERY:", usersQuery); throw err; }
      async.map(results.rows, function (account, done) {
        teamoverzichtuser(account.account_participation_id, budgetparticipation, false, function (err, teamoverzicht) {
          done(err, { tableData: teamoverzicht.tableData, title: account.username, coltype: teamoverzicht.coltype })
        })
      }, function (err, tables) {
        if (err) throw err;
        callback(err, { tables, title: "Team Overzicht Iedereen" })
      })
    })
  }

  function teamoverzichtallsimple (race_id, budgetparticipation, callback){
    var usersQuery = `SELECT account_participation_id, username FROM account_participation 
                INNER JOIN account USING (account_id)   
                WHERE race_id = ${race_id} AND budgetparticipation = ${budgetparticipation};`
    sqlDB.query(usersQuery, (err, results) => {
      if (err) { console.log("WRONG QUERY:", usersQuery); throw err; }
      async.map(results.rows, function (account, done) {
        teamoverzichtuser(account.account_participation_id, budgetparticipation, true, function (err, teamoverzicht) {
          done(err, { riders: teamoverzicht.tableData, username: account.username, coltype: teamoverzicht.coltype })
        })
      }, function (err, tables) {
        if (err) throw err;
        tables = selectionsPopUp(tables)
        callback(err, { tables, title: "Team Overzicht Iedereen" })
      })
    })
  }

  function teamoverzichtuser (account_participation_id, budgetparticipation, simple, callback) {
    var selected_riders_stages = `(SELECT rider_participation_id, kopman_id, stage_id FROM stage_selection_rider
        INNER JOIN stage_selection USING(stage_selection_id)
        WHERE account_participation_id = ${account_participation_id}
        ORDER BY stage_id) a`
    var totalscore = `CASE WHEN a.kopman_id = a.rider_participation_id THEN totalscore + stagescore * .5 ELSE totalscore END`
    var stagescore = `CASE WHEN a.kopman_id = a.rider_participation_id THEN stagescore * 1.5 ELSE stagescore END`
    var teamscore = `,  SUM(teamscore) AS "Team"`;
    if (budgetparticipation) {
      totalscore = `CASE WHEN a.kopman_id = a.rider_participation_id THEN totalscore + stagescore * .5 - teamscore ELSE totalscore - teamscore END`
      teamscore = '';
    }
    var columns = `CONCAT('/rider/',rider_participation.rider_id) AS "Name_link", CONCAT(firstname, ' ', lastname) AS "Name", SUM(${stagescore}) AS "Stage", SUM(gcscore) AS "AK", SUM(pointsscore) AS "Punten", SUM(komscore) AS "Berg", SUM(yocscore) AS "Jong" ${teamscore}, SUM(${totalscore}) AS "Total", COUNT(rider_participation_id) AS "Selected", ROUND(SUM(${totalscore})/COUNT(rider_participation_id),0) AS "Per Etappe"`
    var coltype = { "Name": 0, "Stage": 1, "AK": 1, "Punten": 1, "Berg": 1, "Jong": 1, "Team": 1, "Total": 1, "Selected": 1, "Per Etappe": 1 };
    var orderBy = `"Total"`
    if (simple) {
      orderBy = `"Score"`
      coltype = {};
      columns = `CONCAT('/rider/',rider_participation.rider_id) AS "Name_link", CONCAT(firstname, ' ', lastname) AS "Name", SUM(${totalscore}) AS "Score"`
    }
    var query = `SELECT ${columns} FROM rider
                    INNER JOIN rider_participation USING(rider_id)
                    RIGHT JOIN ${selected_riders_stages} USING (rider_participation_id)
                    INNER JOIN results_points USING(stage_id,rider_participation_id)
                    GROUP BY "Name", "Name_link"
                    ORDER BY ${orderBy} DESC`

    sqlDB.query(query, (err, results) => {
      if (err) { console.log("WRONG QUERY:", query); throw err; }
      callback(err, { tableData: results.rows, coltype })
    })
  }

  function getadditionalstats (race_id, budgetparticipation, callback) {
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
                    SELECT  CONCAT(firstname, ' ', lastname) AS "Name", rider_participation.rider_participation_id, team AS "Team ",price AS "Price",  
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
    var coltypes = [{}, { "Uitvallers": 1, "Prijs": 1 }, {}, { "Uniekheid": 1, "Uniekheid (Geld)": 1 }]
    sqlDB.query(totalQuery, (err, results) => {
      if (err) { console.log("WRONG QUERY:", totalQuery); throw err; }
      var tables = [];
      for (var i in results) {
        tables.push({ title: titles[i], tableData: results[i].rows, coltype: coltypes[i] })
      }
      let title = "Overige Statistieken";
      callback(err,{tables,title})
    })
  }

  function teamcomparisons (race_id,budgetparticipation,callback) {
    var usersQuery = `SELECT username, ARRAY_AGG(json_build_object('price', price, 'rider_participation_id', rider_participation_id)) AS riders FROM team_selection_rider 
    INNER JOIN rider_participation USING (rider_participation_id)
    INNER JOIN account_participation USING (account_participation_id)
    INNER JOIN account USING (account_id)
    WHERE rider_participation.race_id = ${race_id} AND budgetparticipation = ${budgetparticipation}
    GROUP BY username;
    SELECT budget FROM race WHERE race_id = ${race_id}`
    sqlDB.query(usersQuery, (err, results) => {
      if (err) { console.log("WRONG QUERY:", usersQuery); throw err; }
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
      callback(err,{tables,title})
    })
  }

  //for the individual rider page
  app.post('/api/getriderresults', function (req, res) {
    
    var riderQuery = `SELECT country, name, year, CONCAT(firstname, ' ', lastname) AS ridername, rider_participation_id, team  FROM rider_participation
    INNER JOIN race USING(race_id)
    INNER JOIN rider USING(rider_id)
    WHERE rider_id = ${req.body.rider_id}
    ORDER BY year, name; `
    
    sqlDB.query(riderQuery, (err,riderResults)=>{
      if (err) { console.log("WRONG QUERY:", riderQuery); throw err; }
      const riderName = riderResults.rows[0].ridername;
      const country = riderResults.rows[0].country;
      const races = riderResults.rows;
      let totalQuery = '';
      for (let i in riderResults.rows){
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
      sqlDB.query(totalQuery, (err, results) => {
        if (err) { console.log("WRONG QUERY:", totalQuery); throw err; }
        let pointsData = [];
        let posData = [];
        for (let i = 0; i < results.length; i+=2){
          let newPointsData = results[i+1].rows
          if(newPointsData.length) newPointsData[newPointsData.length - 1]["Etappe"] = "Totaal";
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
    })   
  })
}