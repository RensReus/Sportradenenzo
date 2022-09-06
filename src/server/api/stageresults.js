//In dit bestand staan alle calls die betrekking hebben tot de resultaten van een stage
const sqlDB = require('../db/sqlDB')
const helper = require('./helperfunctions')

module.exports = function (app) {
  app.post('/api/getstageinfo', async (req, res) => {
    var stagenr = req.body.stage;
    var stageInfoQuery = `SELECT starttime, type FROM stage WHERE race_id=${req.body.race_id} AND stagenr='${stagenr}'`;
    const stageInfoResults = await sqlDB.query(stageInfoQuery);
    if (!stageInfoResults.rows.length) {
      res.send({ mode: '404' })
    } else {
      var stageInfo = stageInfoResults.rows[0];
      if (new Date() < stageInfo.starttime && stageInfo.type !== "FinalStandings") {
        res.send({ mode: 'selection', starttime: stageInfo.starttime, stageType: stageInfo.type })
      } else {
        res.send({ mode: 'results', starttime: stageInfo.starttime, stageType: stageInfo.type })
      }
    }
  });

  app.post('/api/getPouleTeamResults', async (req, res) => {
    var race_id = req.body.race_id;
    var stagenr = req.body.stage;
    var stage_id = `(SELECT stage_id FROM stage WHERE race_id=${race_id} AND stagenr= ${stagenr})`;
    var account_id = req.user.account_id;
    var budgetParticipation = req.body.budgetParticipation == 1;
    var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = ${account_id} AND race_id = ${race_id} AND budgetParticipation = ${budgetParticipation})`;
    var stageInfoQuery = `SELECT starttime, type FROM stage WHERE race_id=${race_id} AND stagenr='${stagenr}'`;
    const stageInfoResults = await sqlDB.query(stageInfoQuery);
    if (!stageInfoResults.rows.length) {
      res.send({ mode: '404' })
    } else {
      var stageInfo = stageInfoResults.rows[0];
      var selection_id_val = `(SELECT stage_selection_id FROM stage_selection WHERE account_participation_id = ${account_participation_id} AND stage_id = ${stage_id})`
      var selection = `stage_selection_rider`
      var selection_id = `stage_selection_id`
      var kopman = `rider_participation.rider_participation_id WHEN (SELECT kopman_id FROM stage_selection WHERE account_participation_id = ${account_participation_id} AND stage_id=${stage_id})`
      var orderBy = `CASE WHEN stagepos = 0 THEN 255 ELSE stagepos END ASC`
      var firstColumn = `CASE WHEN stagepos IS NULL OR stagepos = 0 THEN '' ELSE CONCAT(stagepos, 'e') END AS "   "`
      var stagescore = `CASE ${kopman} THEN stagescore * 1.5 ELSE stagescore END`
      var stageColumn = `COALESCE(${stagescore},0) AS "Stage",`
      if (stageInfo.type === "FinalStandings") {
        stageColumn = ``;
        firstColumn = `CASE WHEN dnf THEN 'DNF' ELSE CONCAT(gcpos, 'e') END AS "   "`
        kopman = 'WHEN FALSE'
        selection_id = `account_participation_id`
        selection = 'team_selection_rider'
        selection_id_val = account_participation_id;
        orderBy = `"Total" DESC`
      }
      var totalscore = `CASE ${kopman} THEN totalscore + stagescore * .5 ELSE totalscore END`
      var name = `CASE ${kopman} THEN CONCAT('*', firstname, ' ', lastname) ELSE CONCAT(firstname, ' ', lastname) END  AS "Name"`
      var teampoints = ` COALESCE(teamscore,0) as "Team",`;
      if (budgetParticipation) {
        teampoints = '';
        totalscore = `CASE ${kopman} THEN totalscore - teamscore + stagescore * .5 ELSE totalscore - teamscore END`
      }
      var teamresultQuery = `SELECT ${firstColumn}, ${name}, ${stageColumn} COALESCE(gcscore,0) AS "AK", COALESCE(pointsscore,0) AS "Punten", COALESCE(komscore,0) AS "Berg", COALESCE(yocscore,0) AS "Jong", ${teampoints} COALESCE(${totalscore},0) as "Total"
          FROM ${selection} 
          INNER JOIN rider_participation USING(rider_participation_id)
          LEFT JOIN results_points ON results_points.rider_participation_id = rider_participation.rider_participation_id  AND results_points.stage_id = ${stage_id}
          INNER JOIN rider USING(rider_id)
          WHERE ${selection_id} = ${selection_id_val}
          ORDER BY ${orderBy}; `;

      var userscoresQuery = `SELECT RANK() OVER(ORDER by totalscore DESC) AS " ", CONCAT('/profile/',account_id) AS "User_link", username AS "User", stagescore AS "Stage", totalscore AS "Total", account_id FROM stage_selection
          INNER JOIN account_participation USING(account_participation_id)
          INNER JOIN account USING(account_id)
          WHERE stage_id=${stage_id} AND budgetparticipation = ${budgetParticipation}
          ORDER BY "Total" DESC; `;

      var resultsCompleteQuery = `SELECT complete FROM stage WHERE stage_id = ${stage_id}`
      var totalQuery = teamresultQuery + userscoresQuery + resultsCompleteQuery;

      const uitslagresults = await sqlDB.query(totalQuery);
      var userScores = uitslagresults[1].rows;

      var teamresult = [];
      if (uitslagresults[0].rowCount) {
        teamresult = uitslagresults[0].rows;
        var totalteam = { " ": "", "Name": "Totaal", "Stage": 0, "AK": 0, "Punten": 0, "Berg": 0, "Jong": 0, "Team": 0, "Total": 0 }
        if (budgetParticipation) totalteam = { "   ": "", "Name": "Totaal", "Stage": 0, "AK": 0, "Punten": 0, "Berg": 0, "Jong": 0, "Total": 0 };
        if (stageInfo.type === "FinalStandings") {
          var totalteam = { " ": "", "Name": "Totaal", "AK": 0, "Punten": 0, "Berg": 0, "Jong": 0, "Team": 0, "Total": 0 }
          if (budgetParticipation) totalteam = { "   ": "", "Name": "Totaal", "AK": 0, "Punten": 0, "Berg": 0, "Jong": 0, "Total": 0 };
        }
        for (var i in teamresult) {
          totalteam.Stage += parseInt(teamresult[i].Stage);
          totalteam.AK += teamresult[i].AK;
          totalteam.Punten += teamresult[i].Punten;
          totalteam.Berg += teamresult[i].Berg;
          totalteam.Jong += teamresult[i].Jong;
          if (!budgetParticipation) totalteam.Team += teamresult[i].Team;
          totalteam.Total += parseInt(teamresult[i].Total);
        }
        teamresult.push(totalteam);
      }
      budgetParticipation = budgetParticipation ? 1 : 0;
      res.send({
        'mode': 'results',
        teamresult,
        userScores,
        resultsComplete: uitslagresults[2].rows[0].complete,
        stageType: stageInfo.type
      })
    }
  });

  app.post('/api/getClassificationResults', async (req, res) => {
    var race_id = req.body.race_id;
    var now = new Date();
    var query = `SELECT starttime, type FROM stage WHERE race_id=${race_id} AND stagenr='${req.body.stage}'`;
    const results = await sqlDB.query(query);
    if (!results.rows.length) {
      res.send({ mode: '404' })
    } else {
      if (now < results.rows[0].starttime && req.body.stage != 22) { // if before deadline or stage '22' (finalstandings)
        res.send("etappe nog niet gestart");
      } else {
        var stage_id = `(SELECT stage_id FROM stage WHERE race_id=${race_id} AND stagenr= ${req.body.stage})`;
        var budgetParticipation = req.body.budgetParticipation == 1;
        var account_participation_id = `(SELECT account_participation_id FROM account_participation 
                            WHERE account_id=${req.user.account_id} AND race_id=${race_id} AND budgetparticipation = ${budgetParticipation})`;
        var stage_selection_id = `(SELECT stage_selection_id FROM stage_selection WHERE account_participation_id = ${account_participation_id} AND stage_id=${stage_id})`

        var classifications = [
          { pos: 'stagepos', result: 'stageresult AS "Time"', prev: '', change: '' },
          { pos: 'gcpos', result: 'gcresult AS "Time"', prev: ',gcprev AS "prev"', change: ', gcchange AS "  "' },
          { pos: 'pointspos', result: 'pointsresult AS "Points"', prev: ',pointsprev AS "prev"', change: ', pointschange AS "  "' },
          { pos: 'kompos', result: 'komresult AS "Points"', prev: ',komprev AS "prev"', change: ', komchange AS "  "' },
          { pos: 'yocpos', result: 'yocresult AS "Time"', prev: ',yocprev AS "prev"', change: ', yocchange AS "  "' },
        ];
        var inteam = `CASE WHEN rider_participation.rider_participation_id IN (SELECT rider_participation_id FROM team_selection_rider WHERE account_participation_id = ${account_participation_id}) THEN 'bold gray' ELSE '' END`
        var inSelection = `CASE WHEN rider_participation.rider_participation_id IN (SELECT rider_participation_id FROM stage_selection_rider WHERE stage_selection_id = ${stage_selection_id}) THEN 'bold black' ELSE ${inteam} END`
        if (results.rows[0].type === "FinalStandings") {
          inSelection = `CASE WHEN rider_participation.rider_participation_id IN (SELECT rider_participation_id FROM team_selection_rider WHERE account_participation_id = ${account_participation_id}) THEN 'bold black' ELSE '' END`;
        }
        var rowClassName = `${inSelection} AS "rowClassName"`;
        var ridername = `CONCAT(initials, ' ', lastname) AS "Name"`
        var link = `CONCAT('/rider/',rider_participation.rider_id) AS "Name_link"`
        var team = `team AS "Team"`
        var i = req.body.classificationIndex;
        var resultsLengthQuery = `SELECT SUM(CASE WHEN stagepos != 0 THEN 1 ELSE 0 END) AS stage, 
          SUM(CASE WHEN gcpos != 0 THEN 1 ELSE 0 END) AS gc,
          SUM(CASE WHEN pointspos != 0 THEN 1 ELSE 0 END) AS points,
          SUM(CASE WHEN kompos != 0 THEN 1 ELSE 0 END) AS kom,
          SUM(CASE WHEN yocpos != 0 THEN 1 ELSE 0 END) AS yoc
          FROM results_points 
          WHERE stage_id = ${stage_id};\n `
        var resultsQuery = `SELECT ${classifications[i].pos} AS " " ${classifications[i].change}, country, ${link}, ${ridername}, ${team}, ${classifications[i].result}, ${rowClassName}
                            FROM results_points
                            INNER JOIN rider_participation USING(rider_participation_id)
                            INNER JOIN rider USING(rider_id)
                            WHERE stage_id=${stage_id} AND ${classifications[i].pos} > 0 
                            ORDER BY " " ASC;\n `;
        var totalQuery = resultsQuery + resultsLengthQuery;
        const stageresults = await sqlDB.query(totalQuery);
        var lengths = stageresults[1].rows[0];
        var stageResultsLengths = [lengths.stage, lengths.gc, lengths.points, lengths.kom, lengths.yoc].map(x => x === null ? 0 : x);
        res.send({
          stageResults: stageresults[0].rows,
          stageResultsLengths
        })
      }
    }
  });

  app.post('/api/getAllSelections', async (req, res) => {
    var includedAccounts = req.body.fabFourOnly ? "account_id <= 5" : "true"
    var response = await getSelectionComparison(req, includedAccounts);
    res.send(response);
  });

  app.post('/api/getSelectionComparison', async (req, res) => {
    var includedAccounts = `(account_id = ${req.user.account_id} OR account_id = ${req.body.userToCompareId})`;
    var response = await getSelectionComparison(req, includedAccounts);
    res.send(response);
  });

  getSelectionComparison = async (req, includedAccounts) => {
    var race_id = req.body.race_id;
    var typeQuery = `SELECT type FROM stage WHERE race_id=${race_id} AND stagenr='${req.body.stage}'`;
    // TODO something with Fabfouronly
    const typeResults = await sqlDB.query(typeQuery);
    if (!typeResults.rows.length) {
      return { mode: '404' };
    } else {
      var stage_id = `(SELECT stage_id FROM stage WHERE race_id=${race_id} AND stagenr= ${req.body.stage})`;
      var budgetParticipation = req.body.budgetParticipation == 1;
      var minusTeampoints = '';
      if (budgetParticipation) { minusTeampoints = ' - teamscore ' }
      var account_participation_id = `(SELECT account_participation_id FROM account_participation 
            WHERE account_id=${req.user.account_id} AND race_id=${race_id} AND budgetparticipation = ${budgetParticipation})`;
      var stage_selection_id = `(SELECT stage_selection_id FROM stage_selection WHERE account_participation_id = ${account_participation_id} AND stage_id=${stage_id})`

      var inteam = `CASE WHEN rider_participation.rider_participation_id IN (SELECT rider_participation_id FROM team_selection_rider WHERE account_participation_id = ${account_participation_id}) THEN 'bold gray' ELSE '' END`
      var inSelection = `CASE WHEN rider_participation.rider_participation_id IN (SELECT rider_participation_id FROM stage_selection_rider WHERE stage_selection_id = ${stage_selection_id}) THEN 'bold black' ELSE ${inteam} END`
      var selection = `stage_selection_rider`
      var selection_id = `stage_selection.stage_id = ${stage_id}`
      var kopman = `kopman_id = rider_participation.rider_participation_id`
      var stage_selection_join = `INNER JOIN stage_selection USING(stage_selection_id)`
      var stage_selection_join_finalstandings = ``
      if (typeResults.rows[0].type === "FinalStandings") {
        stage_selection_join = ``
        stage_selection_join_finalstandings = `INNER JOIN stage_selection ON stage_selection.account_participation_id = account_participation.account_participation_id AND ${selection_id}`
        kopman = `FALSE`
        selection = `team_selection_rider`
        selection_id = `account_participation.race_id = ${race_id}`
        inSelection = `CASE WHEN rider_participation.rider_participation_id IN (SELECT rider_participation_id FROM team_selection_rider WHERE account_participation_id = ${account_participation_id}) THEN 'bold black' ELSE '' END`;
      }
      var rowClassName = `${inSelection} AS "rowClassName"`;
      var rider_score = `CASE WHEN kopman THEN totalscore ${minusTeampoints} + 0.5*stagescore ELSE totalscore ${minusTeampoints} END`
      var selectionsQuery = `SELECT username, ARRAY_AGG(json_build_object('   ', CASE WHEN stagepos IS NULL OR stagepos = 0 THEN '' ELSE CONCAT(stagepos, 'e') END, 'Name', CASE WHEN kopman THEN CONCAT('* ', name) ELSE name END, 'Score', COALESCE(${rider_score},0),'rowClassName',"rowClassName")) AS riders FROM
        (SELECT stagepos, username, stage_selection.totalscore AS userscore, CONCAT(firstname, ' ', lastname) as name, results_points.stagescore, results_points.totalscore, results_points.teamscore, ${kopman} as kopman, ${rowClassName} FROM  ${selection}
          INNER JOIN rider_participation USING (rider_participation_id)
          INNER JOIN rider USING (rider_id)
          ${stage_selection_join}
          INNER JOIN account_participation USING(account_participation_id)
          INNER JOIN account USING(account_id)
          ${stage_selection_join_finalstandings}
          LEFT JOIN results_points ON results_points.rider_participation_id = rider_participation.rider_participation_id  AND results_points.stage_id = ${stage_id}
          WHERE ${selection_id} AND budgetparticipation = ${budgetParticipation} AND ${includedAccounts}
          ) a
          GROUP BY username, userscore
          ORDER BY userscore desc;\n`;

      var allnotselected = `(
          SELECT rider_participation_id, account_participation_id FROM team_selection_rider
          INNER JOIN account_participation USING(account_participation_id )
          WHERE race_id = ${race_id} AND budgetparticipation = ${budgetParticipation} AND ${includedAccounts}
          EXCEPT
          SELECT rider_participation_id, account_participation_id FROM stage_selection_rider 
          INNER JOIN stage_selection USING(stage_selection_id)
          INNER JOIN account_participation USING(account_participation_id)
          WHERE stage_id = ${stage_id} AND budgetparticipation = ${budgetParticipation} AND ${includedAccounts}
          ) a`

      var allselectedORpointsscoringRiders = `(SELECT rider_participation_id FROM stage_selection_rider 
          INNER JOIN stage_selection USING(stage_selection_id)
          INNER JOIN account_participation USING(account_participation_id)
          WHERE stage_id = ${stage_id} AND budgetparticipation = ${budgetParticipation} AND ${includedAccounts}
          GROUP BY rider_participation_id
          UNION
          SELECT rider_participation_id FROM rider_participation
          INNER JOIN results_points USING(rider_participation_id)
          WHERE totalscore > 0 AND stage_id = ${stage_id} AND ${includedAccounts})`

      var notSelectedQuery = `SELECT username, ARRAY_AGG(json_build_object('   ', CASE WHEN stagepos IS NULL OR stagepos = 0 THEN '' ELSE CONCAT(stagepos, 'e') END,
          'Name', CONCAT(firstname, ' ', lastname), 'Score', results_points.totalscore ${minusTeampoints})) AS riders FROM ${allnotselected} 
          INNER JOIN account_participation USING(account_participation_id)
          INNER JOIN account USING(account_id)
          INNER JOIN rider_participation USING(rider_participation_id)
          INNER JOIN rider USING(rider_id)
          INNER JOIN stage_selection on stage_selection.account_participation_id = account_participation.account_participation_id AND stage_selection.stage_id = ${stage_id}
          LEFT JOIN results_points ON results_points.rider_participation_id = a.rider_participation_id AND results_points.stage_id = ${stage_id} 
          WHERE a.rider_participation_id in ${allselectedORpointsscoringRiders} AND ${includedAccounts}
          GROUP BY username, stage_selection.totalscore
          ORDER BY stage_selection.totalscore DESC; \n`
      var query = selectionsQuery + notSelectedQuery;
      const allSelectionsResults = await sqlDB.query(query);

      var allSelections = selectionsPopUp(allSelectionsResults[0].rows);
      budgetParticipation = budgetParticipation ? 1 : 0;
      var notSelected = allSelectionsResults[1].rows;
      if (typeResults.rows[0].type === "FinalStandings") notSelected = []

      return {
        notSelected,
        allSelections
      }
    }
  }

  app.post('/api/getstageresultsclassics', async (req, res) => {
    if (!req.user) {
      res.send({ 'mode': '404' });
      return;
    } else {
      var raceNames = ['omloop-het-nieuwsblad', 'kuurne-brussel-kuurne', 'strade-bianchi', 'milano-sanremo', 'e3-harelbeke', 'gent-wevelgem', 'dwars-door-vlaanderen', 'ronde-van-vlaanderen', 'Scheldeprijs', 'paris-roubaix', 'amstel-gold-race', 'la-fleche-wallone', 'liege-bastogne-liege', 'Eschborn-Frankfurt'];
      var prevText = "";
      var currText = "";
      var nextText = "";
      var lastStage = false;
      var stagenr = parseInt(req.body.stageNumber);

      if (stagenr > 1 && stagenr < raceNames.length) {
        prevText = "Naar " + (stagenr - 1) + ": " + raceNames[stagenr - 2];
        currText = stagenr + ": " + raceNames[stagenr - 1];
        nextText = "Naar " + (stagenr + 1) + ": " + raceNames[stagenr];
      } else if (stagenr < raceNames.length) {
        currText = stagenr + ": " + raceNames[stagenr - 1];
        nextText = "Naar " + (stagenr + 1) + ": " + raceNames[stagenr];
      } else if (stagenr > 1) {
        prevText = "Naar " + (stagenr - 1) + ": " + raceNames[stagenr - 2];
        currText = stagenr + ": " + raceNames[stagenr - 1];
        nextText = "Naar Einduitslag";
        lastStage = true;
      }

      var race_id = req.body.race_id;
      var stage_id = `(SELECT stage_id FROM stage WHERE race_id=${race_id} AND stagenr= ${req.body.stageNumber})`;
      var account_participation_id = `(SELECT account_participation_id FROM account_participation 
                WHERE account_id=${req.user.account_id} AND race_id=${race_id})`;

      var teamresultQuery = `SELECT CONCAT(firstname, ' ', lastname) AS "Name", team AS "Team", stagescore as "Stage Score", teamscore as "Team Score", totalscore as "Total"
                                FROM team_selection_rider 
                                INNER JOIN rider_participation USING(rider_participation_id)
                                INNER JOIN results_points USING(rider_participation_id)
                                INNER JOIN rider USING(rider_id)
                                WHERE account_participation_id=${account_participation_id} AND stage_id=${stage_id}
                                ORDER BY "Total" DESC, "Team" ; `;

      var userscoresQuery = `SELECT username, stagescore, totalscore FROM stage_selection
                                INNER JOIN account_participation USING(account_participation_id)
                                INNER JOIN account USING(account_id)
                                WHERE stage_id=${stage_id}
                                ORDER BY totalscore DESC; `;

      // CONCAT('<a href="/rider/', rider_participation_id,'">',firstname, ' ', lastname,'</a>') voor later

      var stageresultsQuery = `SELECT stagepos AS " ", CONCAT(firstname, ' ', lastname) AS "Name", team AS "Team", stageresult AS "Time", CASE SUM(CASE account_participation_id WHEN ${account_participation_id} THEN 1 END) WHEN 1 THEN 'bold gray' ELSE '' END AS "rowClassName"
                                FROM results_points
                                INNER JOIN rider_participation USING(rider_participation_id)
                                INNER JOIN rider USING(rider_id)
                                LEFT JOIN team_selection_rider USING(rider_participation_id)
                                WHERE stage_id=${stage_id} AND stagepos > 0 
                                GROUP BY " ", "Name", "Team", "Time"
                                ORDER BY " " ASC; `;

      var selectionsQuery = `SELECT username, COALESCE(COUNT(rider_participation_id),0) as count, ARRAY_AGG(json_build_object(
                                'Name', CONCAT(firstname, ' ', lastname), 
                                'totalscore', totalscore ,
                                'bold gray', CASE WHEN rider_participation_id in (SELECT rider_participation_id FROM team_selection_rider WHERE account_participation_id = ${account_participation_id}) THEN 'bold gray' ELSE ' ' END 
                                )) as riders FROM  results_points
                                INNER JOIN team_selection_rider USING(rider_participation_id)
                                INNER JOIN account_participation USING(account_participation_id)
                                INNER JOIN account USING(account_id)
                                INNER JOIN rider_participation USING (rider_participation_id)
                                INNER JOIN rider USING (rider_id)
                                WHERE stage_id = ${stage_id} and rider_participation_id in (SELECT rider_participation_id FROM team_selection_rider)
                                GROUP BY username; `

      var raceStartedQuery = `SELECT CURRENT_TIMESTAMP > starttime as racestarted from stage
            WHERE race_id = 4 and stagenr = 1; `

      var totalQuery = teamresultQuery + userscoresQuery + stageresultsQuery + selectionsQuery + raceStartedQuery;



      const results = await sqlDB.query(totalQuery);
      var userscores = results[1].rows;
      var selecties = results[3].rows
      for (var i in userscores) {
        for (var j in selecties) {
          if (userscores[i].username == selecties[j].username) {
            userscores[i]['riderCount'] = selecties[j].count;
            userscores[i]['riders'] = selecties[j].riders.sort(function (a, b) { return b.totalscore - a.totalscore });
          }
        }
      }
      res.send({
        mode: '',
        teamresult: results[0].rows,
        userscores,
        stageresults: results[2].rows,
        prevText: prevText,
        currText: currText,
        nextText: nextText,
        lastStage: lastStage,
        raceStarted: results[4].rows[0].racestarted
      });
    }
  });

  app.post('/api/getfinalclassics', (req, res) => {
    if (!req.user) {
      res.send({ 'mode': '404' });
      return;
    } else {
      var prevText = "Naar 14: Eschborn-Frankfurt";
      var lastStageLink = "/stage/14";
      res.send({
        prevText: prevText,
        lastStageLink: lastStageLink,
        username: req.user.username
      })
    }
  });

  selectionsPopUp = (selecties) => {
    var riders = [];
    for (var selectie of selecties) {
      var username = selectie.username;
      for (var rider of selectie.riders) {
        var riderName = rider.Name;
        var toAdd = { user: username, score: rider.Score, kopman: false };
        if (riderName.startsWith("* ")) {
          riderName = riderName.substring(2);
          toAdd.kopman = true;
        }
        if (riders.filter(function (r) { return r.name === riderName; }).length > 0) {
          const index = riders.map(r => r.name).indexOf(riderName);
          riders[index].users.push(toAdd)
          riders[index].max = Math.max(riders[index].max, toAdd.score)
        } else {
          var newrider = { name: riderName, users: [toAdd], max: toAdd.score, Name_link: rider.Name_link, rowClassName: rider.rowClassName }
          riders.push(newrider)
        }
      }
    }
    var ridersCombined = []
    riders = riders.sort((r1, r2) => r1.users.length - r2.users.length || r1.max - r2.max);
    var allselectedridersData = riders.map(x => { return { Name: x.name, Geselecteerd: x.users.length, rowClassName: x.rowClassName } });
    while (riders.length > 0) {
      var riderLine = [riders.pop()];
      var lineCount = riderLine[0].users.length;
      while (lineCount < selecties.length) {
        var possibleRiders = riders.filter(rider => rider.users.length <= selecties.length - lineCount)
        var toAdd = nextToAdd(riderLine, possibleRiders);
        if (toAdd == null) {
          // TODO correct opvullen met empty space, ff zoeken naar race waar deze situatie voorkwam
          break;
        } else {
          const indexToAdd = riders.findIndex(object => {
            return object.name === toAdd.name;
          });
          riders.splice(indexToAdd, 1)
          riderLine.push(toAdd);
          lineCount += toAdd.users.length
        }
      }
      ridersCombined.push(riderLine);
    }
    var output = [];
    for (var selectie of selecties) {
      var username = selectie.username;
      var ridersForUser = []
      var total = 0;
      for (var riderLine of ridersCombined) {
        var score = 0;
        for (var rider of riderLine) {
          const index = rider.users.findIndex(object => {
            return object.user === username;
          });
          if (index != -1) {
            var score = parseInt(rider.users[index].score);
            var kopmanPrefix = rider.users[index].kopman ? "* " : "";
            total += score;
            ridersForUser.push({
              Name: kopmanPrefix + rider.name,
              Score: score,
              Name_link: rider.Name_link,
              rowClassName: rider.rowClassName
            })
            break;
          };
        }
      }
      ridersForUser.push({ Name: "Totaal", Score: total })
      output.push({ title: username, tableData: ridersForUser });
    }
    output.push({
      title: "",
      tableData: allselectedridersData.reverse()
    })
    return output;
  }

  nextToAdd = (riderLine, possibleRiders) => {
    var toAdd = null;
    var usernames = riderLine.map(x => x.users).flat().map(x => x.user);
    while (possibleRiders.length > 0) {
      var option = possibleRiders.pop();
      var conflict = false;
      for (var userObj of option.users) {
        if (usernames.includes(userObj.user)) {
          conflict = true;
          break;
        }
      }
      if (conflict) continue;
      toAdd = option;
      break;
    }
    return toAdd
  }
}

