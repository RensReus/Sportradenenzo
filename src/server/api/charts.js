module.exports = function (app) {
  const sqlDB = require('../db/sqlDB');
  const colors = ["#4f81bc", "#c0504e", "#9bbb58", "#23bfaa", "#8064a1", "#f79647", "#4e7151", "#33558b", "#e59566", "#4aacc5", "#77a033"];

  function includedAccounts(req) { return req.body.fabFourOnly ? 'AND account_id <= 5' : '' };

  function makeOptions(titletext, subtitle, axisYtitle, toolTip, data, extraFields) {
    var options = {
      title: {
        text: titletext
      },
      subtitles: [{
        text: subtitle
      }],
      axisY: {
        title: axisYtitle
      },
      toolTip,
      data: data
    }
    for (var field in extraFields) {
      options[field] = extraFields[field]
    }
    return options
  }

  app.post('/api/userscores', async (req, res) => {
    var race_id = req.body.race_id;
    var query = `SELECT username, stagenr, totalscore FROM stage_selection
            INNER JOIN account_participation USING (account_participation_id)
            INNER JOIN account USING (account_id)
            INNER JOIN stage USING (stage_id)
            WHERE stage.race_id = ${race_id} AND stage.finished AND budgetparticipation = ${req.body.budgetparticipation} AND NOT username = 'tester' ${includedAccounts(req)}
            ORDER BY account_id, stagenr`
    const results = await sqlDB.query(query);
    if (results.rows.length === 0) {
      res.send({ mode: '404' })
      return
    }
    var username = results.rows[0].username;
    var userObj = {
      type: "line",
      name: username,
      showInLegend: true,
      dataPoints: []
    }
    var data = [];
    userObj.dataPoints.push({ x: 0, y: 0 })

    for (var i in results.rows) {
      if (userObj.name == results.rows[i].username) {
        userObj.dataPoints.push({ x: results.rows[i].stagenr, y: results.rows[i].totalscore })
      } else {
        data.push(userObj);
        username = results.rows[i].username;
        userObj = {
          type: "line",
          name: username,
          showInLegend: true,
          dataPoints: []
        }
        userObj.dataPoints.push({ x: 0, y: 0 })
        userObj.dataPoints.push({ x: results.rows[i].stagenr, y: results.rows[i].totalscore })
      }
    }
    data.push(userObj)
    for (i in userObj.dataPoints) {
      var total = 0;
      for (var user in data) {
        total += data[user].dataPoints[i].y;
      }
      var avg = Math.round(total / data.length);
      for (var user in data) {
        data[user].dataPoints[i].y -= avg;
      }
    }
    var toolTip = { shared: true }
    var extraFields = {
      axisX: {
        interval: 1,
        title: "Stage"
      }
    }
    var options = makeOptions("Scores", "Totaal score na iedere etappe", "Points", toolTip, data, extraFields)
    res.send({ options, title: "Chart: User Scores" });
  })

  app.post('/api/totaalverloop', async (req, res) => {
    var query = `SELECT username, username, CONCAT(name, ' ', year) as racename, finalscore FROM account_participation
            INNER JOIN account USING (account_id)
            INNER JOIN race USING (race_id)
            WHERE budgetparticipation = ${req.body.budgetparticipation} AND NOT username = 'tester' ${includedAccounts(req)} AND NOT name = 'classics' AND finished AND year > 2014
            ORDER BY account_id, year, name`
    const results = await sqlDB.query(query);
    if (results.rows.length === 0) {
      res.send({ mode: '404' })
      return
    }
    var username = results.rows[0].username;
    var userObj = {
      type: "line",
      name: username,
      showInLegend: true,
      dataPoints: []
    }
    var data = [];
    userObj.dataPoints.push({ x: 0, y: 0 })
    var counter = 0;
    var totalscore = 0;
    for (var i in results.rows) {
      if (userObj.name == results.rows[i].username) {
        totalscore += results.rows[i].finalscore;
        counter++;
        username == "Sam"
          ? userObj.dataPoints.push({ x: counter, y: totalscore, indexLabel: results.rows[i].racename })
          : userObj.dataPoints.push({ x: counter, y: totalscore })
      } else {
        data.push(userObj);
        username = results.rows[i].username;
        userObj = {
          type: "line",
          name: username,
          showInLegend: true,
          dataPoints: []
        }
        userObj.dataPoints.push({ x: 0, y: 0 })
        totalscore = results.rows[i].finalscore;
        counter = 1;
        username == "Sam"
          ? userObj.dataPoints.push({ x: counter, y: totalscore, indexLabel: results.rows[i].racename })
          : userObj.dataPoints.push({ x: counter, y: totalscore })
      }
    }
    data.push(userObj)
    for (i in userObj.dataPoints) {
      var total = 0;
      for (var user in data) {
        total += data[user].dataPoints[i]?.y || 0;
      }
      var avg = Math.round(total / data.length);
      for (var user in data) {
        if (data[user].dataPoints[i]) {
          data[user].dataPoints[i].y -= avg;
        }
      }
    }
    var toolTip = { shared: true }
    var extraFields = {
      axisX: {
        interval: 1,
        title: "Stage"
      }
    }
    var options = makeOptions("Scores", "Score verschil na iedere race", "Points", toolTip, data, extraFields)
    res.send({ options, title: "Chart: Totaal scores verloop" });
  })

  app.post('/api/userrank', async (req, res) => {
    var race_id = req.body.race_id;
    var query = `SELECT username, stagenr, rank() over (PARTITION BY stagenr ORDER BY totalscore desc) FROM stage_selection
            INNER JOIN account_participation USING (account_participation_id)
            INNER JOIN account USING (account_id)
            INNER JOIN stage USING (stage_id)
            WHERE stage.race_id = ${race_id} AND budgetparticipation = ${req.body.budgetparticipation} AND stage.finished AND NOT username = 'tester' ${includedAccounts(req)}
            ORDER BY username, stagenr`
    const results = await sqlDB.query(query);
    if (results.rows.length === 0) {
      res.send({ mode: '404' })
      return
    }
    var username = results.rows[0].username;
    var userObj = {
      type: "line",
      name: username,
      showInLegend: true,
      dataPoints: []
    }
    var data = [];

    for (var i in results.rows) {
      if (userObj.name == results.rows[i].username) {
        userObj.dataPoints.push({ x: results.rows[i].stagenr, y: parseInt(results.rows[i].rank) })
      } else {
        data.push(userObj);
        username = results.rows[i].username;
        userObj = {
          type: "line",
          name: username,
          showInLegend: true,
          dataPoints: []
        }
        userObj.dataPoints.push({ x: results.rows[i].stagenr, y: parseInt(results.rows[i].rank) })
      }

    }
    data.push(userObj)

    var toolTip = { shared: true }
    var extraFields = {
      axisX: {
        interval: 1,
        title: "Stage"
      },
      axisY: {
        reversed: true,
        title: "Rank"
      }
    }
    var options = makeOptions("Ranking", "Positie na iedere etappe", "Rank", toolTip, data, extraFields)
    res.send({ options, title: "Chart: User Rankings" });
  })

  app.post('/api/riderpercentage', async (req, res) => {
    var totalscore = 'totalscore';
    if (req.body.budgetparticipation) {
      totalscore = 'totalscore - teamscore AS totalscore'
    }
    var race_id = req.body.race_id;
    var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = ${req.user.account_id} AND race_id = ${race_id} AND budgetparticipation = ${req.body.budgetparticipation})`
    var query = `SELECT ${totalscore}, lastname, stagenr FROM results_points
            INNER JOIN rider_participation USING (rider_participation_id)
            INNER JOIN rider USING (rider_id)
            INNER JOIN stage USING (stage_id)
            WHERE rider_participation_id IN (SELECT rider_participation_id FROM team_selection_rider WHERE account_participation_id = ${account_participation_id}) AND totalscore > 0 AND stage.finished
            ORDER by lastname, stagenr`
    const results = await sqlDB.query(query);
    if (results.rows.length === 0) {
      res.send({ mode: '404' })
      return
    }
    var lastname = results.rows[0].lastname;
    var riderObj = {
      type: "stackedColumn",
      name: lastname,
      showInLegend: true,
      dataPoints: []
    }
    var data = [];

    for (var i in results.rows) {
      if (riderObj.name == results.rows[i].lastname) {
        riderObj.dataPoints.push({ x: results.rows[i].stagenr, y: results.rows[i].totalscore })
      } else {
        data.push(riderObj);
        lastname = results.rows[i].lastname;
        riderObj = {
          type: "stackedColumn",
          name: lastname,
          showInLegend: true,
          dataPoints: []
        }
        riderObj.dataPoints.push({ x: results.rows[i].stagenr, y: results.rows[i].totalscore })
      }

    }
    data.push(riderObj)
    var toolTip = { content: "{name}: {y} " }
    var extraFields = {
      axisX: {
        interval: 1,
        title: "Stage"
      }
    }
    var options = makeOptions("Scores per etappe", "Punten per renner", "Points", toolTip, data, extraFields)
    res.send({ options, title: "Chart: Renners Punten Aandeel/Relatief" });
  })

  app.post('/api/scorespread', async (req, res) => {
    var race_id = req.body.race_id;
    var excludeFinalStr = ''
    if (req.body.extraParams.excludeFinal) excludeFinalStr = `AND NOT type = 'FinalStandings'`

    var barQuery = `SELECT username, CONCAT('etappe ', stagenr) as race, stagescore as y FROM stage_selection
    INNER JOIN account_participation USING(account_participation_id)
    INNER JOIN account USING(account_id)
    INNER JOIN stage USING(stage_id)
    WHERE stage.race_id = ${race_id} ${excludeFinalStr} AND budgetparticipation = ${req.body.budgetparticipation} AND stage.finished ${includedAccounts(req)}
    ORDER BY stagescore DESC;\n`

    var totalQuery = barQuery;
    const results = await sqlDB.query(totalQuery);
    var data = buildSpread(results);

    var toolTip = { backgroundColor: 'black', fontColor: 'white' }
    var extraFields = { height: 700 }
    var options = makeOptions("Scores per etappe", "Hoogste scores per etappe", "Points", toolTip, data, extraFields)
    res.send({ options, title: "Chart: Score Spreiding" });
  })

  app.post('/api/scorespreadgrouped', async (req, res) => {
    var budgetparticipation = req.body.budgetparticipation;
    var race_id = req.body.race_id;
    var usersQuery = `SELECT account_participation_id, username FROM account_participation 
                INNER JOIN account USING (account_id)   
                WHERE race_id = ${race_id} AND budgetparticipation = ${budgetparticipation} ${includedAccounts(req)}
                ORDER BY account_id;`
    const userresults = await sqlDB.query(usersQuery);
    var totalQuery = userresults.rows.reduce((query, user) => query + `SELECT stagenr AS label, stagescore AS y FROM stage_selection
      INNER JOIN account_participation USING(account_participation_id)
      INNER JOIN stage USING(stage_id)
      WHERE stage.finished AND account_participation_id = ${user.account_participation_id}
      ORDER BY stagenr;\n `, '')

    const results = await sqlDB.query(totalQuery);

    var data = results.map((result, i) => ({
      type: "column",
      name: userresults.rows[i].username,
      legendText: userresults.rows[i].username,
      showInLegend: true,
      dataPoints: result.rows
    }))
    var toolTip = { shared: true }
    var extraFields = { height: 700 }
    var options = makeOptions("Scores per etappe", "Scores per etappe", "Points", toolTip, data, extraFields)
    res.send({ options, title: "Chart: Scores Per Etappe" });
  })

  app.post('/api/totalscorespread', async (req, res) => {
    var racePointsQuery = `SELECT username, CONCAT(name, ' ', year) as race, finalscore as y FROM account_participation
                INNER JOIN account USING(account_id)
                INNER JOIN race USING(race_id)
                WHERE budgetparticipation = ${req.body.budgetparticipation} AND NOT name = 'classics' AND finished AND year > 2014 ${includedAccounts(req)}
                ORDER BY finalscore DESC;\n`

    var totalQuery = racePointsQuery;
    const results = await sqlDB.query(totalQuery);
    var data = buildSpread(results);

    var toolTip = { backgroundColor: 'black', fontColor: 'white' }
    var extraFields = { height: 700 }
    var options = makeOptions("Scores per race", "Hoogste scores per race", "Points", toolTip, data, extraFields)
    res.send({ options, title: "Chart: Score Spreiding" });
  })

  app.post('/api/totalscorespreadgrouped', async (req, res) => {
    var budgetparticipation = req.body.budgetparticipation;
    var usersQuery = `SELECT account_id, username FROM account 
                ORDER BY account_id;`
    const userresults = await sqlDB.query(usersQuery);
    var totalQuery = userresults.rows.reduce((query, user) => query + `SELECT CONCAT(name, ' ', year) AS label, finalscore AS y FROM account_participation
      INNER JOIN race USING(race_id)
      INNER JOIN account USING(account_id)
      WHERE race.finished AND account_id = ${user.account_id} AND budgetparticipation = ${budgetparticipation} AND NOT race.name = 'classics' AND year > 2014 ${includedAccounts(req)}
      ORDER BY year, race.name;\n `, '')

    const results = await sqlDB.query(totalQuery);

    var data = results.map((result, i) => ({
      type: "column",
      name: userresults.rows[i].username,
      legendText: userresults.rows[i].username,
      showInLegend: true,
      dataPoints: result.rows
    }))
    var toolTip = { shared: true }
    var extraFields = { height: 700 }
    var options = makeOptions("Scores per race", "Scores per race", "Points", toolTip, data, extraFields)
    res.send({ options, title: "Chart: Scores per race" });
  })

  function buildSpread(results) {
    var data = [{
      type: "column",
      legendText: "Score",
      showInLegend: true,
      dataPoints: []
    }]

    var users = []
    for (var row of results.rows) { // consistent colors
      var colorIndex = users.indexOf(row.username);
      if (colorIndex == -1) {
        colorIndex = users.length;
        users.push(row.username);
      }
      data[0].dataPoints.push({ y: row.y, label: `${row.username} ${row.race}`, color: colors[colorIndex] });
    }
    return data;
  }

  app.post('/api/missedpointsspread', async (req, res) => {
    var missedPoints = await missedpointsall(req.body.race_id, req.body.budgetparticipation);
    var combinedPoints = []
    missedPoints.tables.forEach((missed, i) => {
      var color = colors[i];
      for (var stage of missed.tableData) {
        if (stage.Etappe == "Totaal") continue;
        combinedPoints.push({ label: `${missed.title} etappe ${stage.Etappe}`, y: stage.Gemist, color })
      }
    });
    var data = [{
      type: "column",
      legendText: "Gemist",
      showInLegend: true,
      dataPoints: combinedPoints.sort((a, b) => b.y - a.y)
    }]
    var toolTip = { backgroundColor: 'black', fontColor: 'white' }
    var extraFields = { height: 700 }
    var options = makeOptions("Gemiste punten per etappe", "Meeste gemiste punten per etappe", "Gemiste Punten", toolTip, data, extraFields)
    res.send({ options, title: "Chart: Score Spreiding" });
  })

  app.post('/api/missedpointsspreadgrouped', async (req, res) => {
    var missedPoints = await missedpointsall(req.body.race_id, req.body.budgetparticipation);

    var data = missedPoints.tables.map((missed, i) => ({
      type: "column",
      name: missed.title,
      legendText: missed.title,
      showInLegend: true,
      dataPoints: missed.tableData.slice(0, -1).map((stage) => { return { label: stage.Etappe, y: stage.Gemist } })
    }))

    var toolTip = { backgroundColor: 'black', fontColor: 'white', shared: true }
    var extraFields = { height: 700 }
    var options = makeOptions("Gemiste punten per etappe", "Meeste gemiste punten per etappe", "Gemist", toolTip, data, extraFields)
    res.send({ options, title: "Chart: Score Spreiding" });
  })

  app.post('/api/missedpointsspreadrelatief', async (req, res) => {
    var missedPoints = await missedpointsall(req.body.race_id, req.body.budgetparticipation);
    var combinedPoints = []
    missedPoints.tables.forEach((missed, i) => {
      var color = colors[i];
      for (var stage of missed.tableData) {
        if (stage.Etappe == "Totaal") continue;
        combinedPoints.push({ label: `${missed.title} etappe ${stage.Etappe}`, y: Math.round(stage.Gemist / stage.Optimaal * 100), color })
      }
    });
    var data = [{
      type: "column",
      legendText: "Gemist",
      showInLegend: true,
      dataPoints: combinedPoints.sort((a, b) => b.y - a.y)
    }]
    var toolTip = { backgroundColor: 'black', fontColor: 'white' }
    var extraFields = { height: 700 }
    var options = makeOptions("Percentage gemist per etappe", "Percentage gemist per etappe", "Procent Gemist", toolTip, data, extraFields)
    res.send({ options, title: "Chart: Score Spreiding" });
  })

  app.post('/api/missedpointsspreadrelatiefgrouped', async (req, res) => {
    var missedPoints = await missedpointsall(req.body.race_id, req.body.budgetparticipation);

    var data = missedPoints.tables.map((missed, i) => ({
      type: "column",
      name: missed.title,
      legendText: missed.title,
      showInLegend: true,
      dataPoints: missed.tableData.map((stage) => { return { label: stage.Etappe, y: Math.round(stage.Gemist / stage.Optimaal * 100) } })
    }))

    var toolTip = { backgroundColor: 'black', fontColor: 'white', shared: true }
    var extraFields = { height: 700 }
    var options = makeOptions("Percentage gemist per etappe", "Percentage gemist per etappe", "Procent Gemist", toolTip, data, extraFields)
    res.send({ options, title: "Chart: Score Spreiding" });
  })

  app.post('/api/missedpoints', async (req, res) => {
    var missedPoints = await missedpointsall(req.body.race_id, req.body.budgetparticipation);

    var data = [];
    for (var missed of missedPoints.tables) {
      var dataset = {
        type: "line",
        name: missed.title,
        showInLegend: true,
        dataPoints: []
      }
      dataset.dataPoints.push({ x: 0, y: 0 })
      var total = 0;
      for (var stage of missed.tableData) {
        if (stage.Etappe == "Totaal") continue;
        total += stage.Gemist
        dataset.dataPoints.push({ x: stage.Etappe, y: total })
      }
      data.push(dataset)
    }

    var userCount = missedPoints.tables.length;
    for (var et in data[0].dataPoints) {
      var avg = Math.round(data.reduce((tot, dataset) => tot + dataset.dataPoints[et].y, 0) / userCount);
      for (var i in data) {
        data[i].dataPoints[et].y -= avg;
      }
    }

    var toolTip = { shared: true }
    var extraFields = {
      axisX: {
        interval: 1,
        title: "Stage"
      }
    }
    var options = makeOptions("Gemist", "Totaal Gemist score na iedere etappe", "Gemist", toolTip, data, extraFields)
    res.send({ options, title: "Gemiste Punten Verloop" });
  })


  app.post('/api/optimalpoints', async (req, res) => {
    var missedPoints = await missedpointsall(req.body.race_id, req.body.budgetparticipation);

    var data = [];
    for (var missed of missedPoints.tables) {
      var dataset = {
        type: "line",
        name: missed.title,
        showInLegend: true,
        dataPoints: []
      }
      dataset.dataPoints.push({ x: 0, y: 0 })
      var total = 0;
      for (var stage of missed.tableData) {
        if (stage.Etappe == "Totaal") continue;
        total += stage.Optimaal
        dataset.dataPoints.push({ x: stage.Etappe, y: total })
      }
      data.push(dataset)
    }

    var userCount = missedPoints.tables.length;
    for (var et in data[0].dataPoints) {
      var avg = Math.round(data.reduce((tot, dataset) => tot + dataset.dataPoints[et].y, 0) / userCount);
      for (var i in data) {
        data[i].dataPoints[et].y -= avg;
      }
    }

    var toolTip = { shared: true }
    var extraFields = {
      axisX: {
        interval: 1,
        title: "Stage"
      }
    }
    var options = makeOptions("Optimaal", "Optimale score na iedere etappe", "Points", toolTip, data, extraFields)
    res.send({ options, title: "Optimale Punten Verloop" });
  })
}