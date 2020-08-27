//In dit bestand staan alle calls die betrekking hebben tot de resultaten van een stage

module.exports = function (app) {
  const sqlDB = require('../db/sqlDB');

  app.post('/api/chartuserstagescores', function (req, res) {
    var race_id = `(SELECT race_id FROM race WHERE name = '${req.body.racename}' AND year = ${req.body.year})`;
    var query = `SELECT username, stagenr, totalscore FROM stage_selection
            INNER JOIN account_participation USING (account_participation_id)
            INNER JOIN account USING (account_id)
            INNER JOIN stage USING (stage_id)
            WHERE stage.race_id = ${race_id} AND stage.finished AND budgetparticipation = ${req.body.budgetparticipation} AND NOT username = 'tester'
            ORDER BY username, stagenr`
    sqlDB.query(query, (err, results) => {
      if (err) { console.log("WRONG QUERY:", query); throw err; }
      if (results.rows.length === 0) {
        console.log("results", results.rows)
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
        for (user in data) {
          total += data[user].dataPoints[i].y;
        }
        var avg = total / data.length;
        for (user in data) {
          data[user].dataPoints[i].y -= avg;
        }
      }
      data.sort(function (a, b) { return b.dataPoints[b.dataPoints.length - 1].y - a.dataPoints[a.dataPoints.length - 1].y })
      res.send(data);
    })
  })

  app.post('/api/chartuserranking', function (req, res) {
    var race_id = `(SELECT race_id FROM race WHERE name = '${req.body.racename}' AND year = ${req.body.year})`;
    var query = `SELECT username, stagenr, rank() over (PARTITION BY stagenr ORDER BY totalscore desc) FROM stage_selection
            INNER JOIN account_participation USING (account_participation_id)
            INNER JOIN account USING (account_id)
            INNER JOIN stage USING (stage_id)
            WHERE stage.race_id = ${race_id} AND budgetparticipation = ${req.body.budgetparticipation} AND stage.finished AND NOT username = 'tester'
            ORDER BY username, stagenr`
    sqlDB.query(query, (err, results) => {
      if (err) { console.log("WRONG QUERY:", query); throw err; }
      if (results.rows.length === 0) {
        console.log("results", results.rows)
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

      data.sort(function (a, b) { return b.dataPoints[b.dataPoints.length - 1].y - a.dataPoints[a.dataPoints.length - 1].y })
      res.send(data);
    })
  })

  app.post('/api/chartriderpercentage', function (req, res) {
    var race_id = `(SELECT race_id FROM race WHERE name = '${req.body.racename}' AND year = ${req.body.year})`;
    var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = ${req.user.account_id} AND race_id = ${race_id} AND budgetparticipation = ${req.body.budgetparticipation})`
    var query = `SELECT totalscore, lastname, stagenr FROM results_points
            INNER JOIN rider_participation USING (rider_participation_id)
            INNER JOIN rider USING (rider_id)
            INNER JOIN stage USING (stage_id)
            WHERE rider_participation_id IN (SELECT rider_participation_id FROM team_selection_rider WHERE account_participation_id = ${account_participation_id}) AND totalscore > 0 AND stage.finished
            ORDER by lastname, stagenr`
    sqlDB.query(query, (err, results) => {
      if (err) { console.log("WRONG QUERY:", query); throw err; }
      if (results.rows.length === 0) {
        console.log("results", results.rows)
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
      res.send(data);
    })
  })

  // app.post('/api/chartriderpercentagetotal', function (req, res) { // vrij waardeloos 

  //   var currentStageNum = stageNumKlassieker(); // deze info moet van db komen of global var
  //   var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = ${req.user.account_id} AND race_id = ${race_id} AND budgetparticipation = ${req.body.budgetparticipation})`
  //   var query = `SELECT totalscore, lastname, stagenr FROM results_points
  //         INNER JOIN rider_participation USING (rider_participation_id)
  //         INNER JOIN rider USING (rider_id)
  //         INNER JOIN stage USING (stage_id)
  //         WHERE rider_participation_id IN (SELECT rider_participation_id FROM team_selection_rider WHERE account_participation_id = ${account_participation_id})
  //         ORDER by lastname, stagenr`
  //   var query2 = `select array_agg(stagenr) as stages, array_agg(totalscore) as scores, lastname from team_selection_rider
  //         left join results_points using(rider_participation_id)
  //         left join rider_participation using(rider_participation_id)
  //         left join rider using(rider_id)
  //         left join stage using(stage_id)
  //         where account_participation_id = ${account_participation_id} AND stage.finished
  //         group by lastname`

  //   sqlDB.query(query2, (err, results) => {
  //     if (err) { console.log("WRONG QUERY:", query2); throw err; }
  //     if (results.rows.length === 0) {
  //       console.log("results", results.rows)
  //       res.send({ mode: '404' })
  //       return
  //     }
  //     var data = [];

  //     for (var i in results.rows) {
  //       var lastname = results.rows[i].lastname;
  //       var riderObj = {
  //         type: "line",
  //         name: lastname,
  //         showInLegend: true,
  //         dataPoints: []
  //       }
  //       var rider = results.rows[i]
  //       var total = 0;
  //       for (var j = 0; j < currentStageNum + 1; j++) {
  //         var index = rider.stages.indexOf(j);
  //         if (index + 1) {// index not -1
  //           total += rider.scores[index];
  //         }
  //         riderObj.dataPoints.push({ x: j, y: total })


  //       }
  //       data.push(riderObj)
  //     }
  //     res.send(data);
  //   })
  // })

  app.post('/api/chartscorespread', function (req, res) {
    var race_id = `(SELECT race_id FROM race WHERE name = '${req.body.racename}' AND year = ${req.body.year})`;
    var excludeFinalStr = ''
    if (req.body.excludeFinal) excludeFinalStr = `AND NOT stagenr = 22`
    var budgetparticipation = req.body.budgetparticipation;

    var barQuery = `SELECT username as colorlabel, CONCAT(username, ' ', stagenr) as label, stagescore as y FROM stage_selection
                    INNER JOIN account_participation USING(account_participation_id)
                    INNER JOIN account USING(account_id)
                    INNER JOIN stage USING(stage_id)
                    WHERE stage.race_id = ${race_id} ${excludeFinalStr} AND budgetparticipation = ${budgetparticipation}
                    ORDER BY stagescore DESC;\n`

    var avgQuery = `SELECT ROUND(AVG(stagescore),2), stagenr FROM stage_selection
                INNER JOIN stage USING(stage_id)
                INNER JOIN account_participation USING(account_participation_id)
                WHERE stage.race_id = ${race_id} ${excludeFinalStr} AND budgetparticipation = ${budgetparticipation}
                GROUP BY stagenr
                ORDER BY stagenr;\n`

    var totalQuery = barQuery + avgQuery;
    sqlDB.query(totalQuery, (err, results) => {
      if (err) { console.log("WRONG QUERY:", totalQuery); throw err; }
      var data = [{
        type: "column",
        showInLegend: true,
        dataPoints: []
      }]
      var colors = { Bierfietsen: 'red', Rens: 'blue', Sam: 'green', Yannick: 'yellow' }
      for (var i in results[0].rows) {
        var row = results[0].rows[i];
        row.color = colors[row.colorlabel];
        // console.log(results[1].rows)
        // row.x = results[1].rows[row.stagenr-1].round;
        data[0].dataPoints.push(row);
      }
      res.send(data);
    })
  })

  app.post('/api/charttotalscorespread', function (req, res) {
    var budgetparticipation = req.body.budgetparticipation;

    var racePointsQuery = `SELECT username as colorlabel, CONCAT(username, ' ', name, ' ', year) as label, finalscore as y FROM account_participation
                INNER JOIN account USING(account_id)
                INNER JOIN race USING(race_id)
                WHERE budgetparticipation = ${budgetparticipation} AND NOT name = 'classics'
                ORDER BY finalscore DESC;\n`

    var extraQuery = `SELECT username FROM account;`
    var totalQuery = racePointsQuery + extraQuery;
    sqlDB.query(totalQuery, (err, results) => {
      if (err) { console.log("WRONG QUERY:", totalQuery); throw err; }
      var data = [{
        type: "column",
        showInLegend: true,
        dataPoints: []
      }]
      var colors = { Bierfietsen: 'red', Rens: 'blue', Sam: 'green', Yannick: 'yellow' }
      for (var i in results[0].rows) {
        var row = results[0].rows[i];
        row.color = colors[row.colorlabel];
        // console.log(results[1].rows)
        // row.x = results[1].rows[row.stagenr-1].round;
        data[0].dataPoints.push(row);
      }
      res.send(data);
    })
  })

  app.post('/api/newchart', function (req, res) {
    var race_id = `(SELECT race_id FROM race WHERE name = '${req.body.racename}' AND year = ${req.body.year})`;
    var budgetparticipation = req.body.budgetparticipation;

    var barQuery = `SELECT username as label, finalscore as y, race_id FROM account_participation
                    INNER JOIN account USING(account_id)
                    WHERE budgetparticipation = ${budgetparticipation} AND NOT race_id = 4
                    ORDER BY finalscore DESC;\n`

    var avgQuery = `SELECT ROUND(AVG(finalscore),2), race_id FROM account_participation
                WHERE budgetparticipation = ${budgetparticipation} AND NOT race_id = 4
                GROUP BY race_id
                ORDER BY race_id;\n`

    var totalQuery = barQuery + avgQuery;
    sqlDB.query(totalQuery, (err, results) => {
      if (err) { console.log("WRONG QUERY:", totalQuery); throw err; }
      var data = [{
        type: "scatter",
        showInLegend: true,
        dataPoints: []
      }]
      var colors = { Bierfietsen: 'red', Rens: 'blue', Sam: 'green', Yannick: 'yellow' }
      for (var i in results[0].rows) {
        var row = results[0].rows[i];
        row.color = colors[row.label];
        if (row.race_id < 4) {
          row.x = parseFloat(results[1].rows[row.race_id - 1].round);
        } else {
          row.x = parseFloat(results[1].rows[row.race_id - 2].round);
        }
        data[0].dataPoints.push(row);
      }
      res.send(data);
    })
  })
}