// In dit bestand staan alle calls die te maken hebben met het selecteren van het team voor een race

module.exports = function (app) {
  const async = require('async')
  const sqlDB = require('../db/sqlDB')
  const SQLread = require('../db/SQLread')
  const SQLwrite = require('../db/SQLwrite')
  const scrape = require('../scrape')

  app.post('/api/teamselection', function (req, res) {
    var race_id = req.body.race_id;
    var beforeStartQuery = `SELECT COUNT(stage_id) FROM stage WHERE race_id = ${race_id} AND starttime < now() AT TIME ZONE 'Europe/Paris'`
    sqlDB.query(beforeStartQuery, (_, beforeStartResults) => {
      if (beforeStartResults.rows[0].count === 0) {
        runTeamSelectionCall(req.body.apilink, race_id, req.body.budgetParticipation, req.user.account_id, req.body.rider_participation_id, (results) => {
          res.send(results);
        })
      } else {
        res.send({ redirect: true, redirectLink: '/stage/1' })
      }
    })
  })

  async function runTeamSelectionCall(apilink, race_id, budgetParticipation, account_id, rider_participation_id, callback) {
    budgetParticipation = budgetParticipation === 1;
    switch (apilink) {
      case "getridersandteam": getridersandteam(race_id, account_id, callback); break;
      case "addRider": addRider(race_id, budgetParticipation, account_id, rider_participation_id, callback); break;
      case "removeRider": removeRider(race_id, budgetParticipation, account_id, rider_participation_id, callback); break;
      case "addaccountparticipation": addaccountparticipation(race_id, account_id, callback); break;
    }
  }

  function getridersandteam(race_id, account_id, callback) {
    sqlDB.query(`SELECT * FROM account_participation WHERE race_id = ${race_id} AND account_id = ${account_id}`, (_, participationResults) => {
      if (participationResults.rows.length) {
        async.auto({
          allRiders: function (innerCallback) {
            SQLread.getAllRiders(race_id, innerCallback)
          },
          userSelectionGewoon: function (innerCallback) {
            SQLread.getTeamSelection(account_id, false, race_id, innerCallback)
          },
          userSelectionBudget: function (innerCallback) {
            SQLread.getTeamSelection(account_id, true, race_id, innerCallback)
          },
          race: function (innerCallback) {
            SQLread.getRace(race_id, innerCallback)
          }
        }, function (results) {

          var IDsGewoon = [];
          var IDsBudget = [];
          var budgetGewoon = results.race.budget;
          var budgetBudget = 11250000;
          for (var i = 0; i < results.userSelectionGewoon.length; i++) {
            IDsGewoon.push(results.userSelectionGewoon[i].rider_participation_id)
            budgetGewoon -= results.userSelectionGewoon[i].price
          }

          for (var i = 0; i < results.userSelectionBudget.length; i++) {
            IDsBudget.push(results.userSelectionBudget[i].rider_participation_id)
            budgetBudget -= results.userSelectionBudget[i].price
          }
          callback({ allRiders: results.allRiders, userSelectionGewoon: results.userSelectionGewoon, userSelectionBudget: results.userSelectionBudget, budgetGewoon, budgetBudget })
        });
      } else {
        callback({ noParticipation: true })
      }
    })
  };

  function addRider(race_id, budgetParticipation, account_id, rider_participation_id, callback) {
    var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = ${account_id} AND race_id = ${race_id} AND budgetParticipation = ${budgetParticipation})`;
    var teamselection = `(SELECT rider_participation_id FROM team_selection_rider WHERE account_participation_id = ${account_participation_id})`;

    var riderQuery = `SELECT rider.firstname, rider.lastname, price, team, rider_participation_id FROM rider_participation
                INNER JOIN rider using(rider_id)
                WHERE rider_participation_id = ${rider_participation_id};\n `

    var teamselectionQuery = `SELECT rider.firstname, rider.lastname, price, team, rider_participation_id FROM rider_participation
                INNER JOIN rider using(rider_id)
                WHERE rider_participation_id IN ${teamselection};\n `;
    var budget = 11250000;
    var budgetQuery = `SELECT budget, race_id FROM race WHERE race_id = ${race_id}`

    var totalQuery = riderQuery + teamselectionQuery + budgetQuery;

    sqlDB.query(totalQuery, function (_, results) {
      if (!budgetParticipation) {
        budget = results[2].rows[0].budget;
      }
      var ridersSameTeam = 0;
      for (var i = 0; i < results[1].rows.length; i++) {
        budget -= results[1].rows[i].price
        if (results[0].team === results[1].rows[i].team) {
          ridersSameTeam += 1;
        }
      }
      if (results[1].rows.length >= 20 || budget < results[0].rows[0].price + (19 - results[1].rows.length) * 500000 || ridersSameTeam >= 4) {
        callback(false)
      } else {
        var addQuery = `INSERT INTO team_selection_rider(rider_participation_id,account_participation_id)
                                VALUES(${rider_participation_id},${account_participation_id}) 
                                ON CONFLICT (account_participation_id, rider_participation_id) DO NOTHING`;

        sqlDB.query(addQuery, (_, response) => {
          if (response.rowCount) { //Only add if sql added rider to DB
            results[1].rows.push(results[0].rows[0])
          }
          var budgetLeft = budgetParticipation ? 11250000 : results[2].rows[0].budget;
          budgetLeft -= results[1].rows.reduce((sum, x) => sum + x.price, 0);
          callback({ userSelection: results[1].rows, budgetLeft })
        })
      }
    })
  };

  function removeRider(race_id, budgetParticipation, account_id, rider_participation_id, callback) {
    var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = ${account_id} AND race_id = ${race_id} AND budgetParticipation = ${budgetParticipation})`;
    var teamselection = `(SELECT rider_participation_id FROM team_selection_rider WHERE account_participation_id = ${account_participation_id})`;

    var stage_selections = `(SELECT stage_selection_id FROM stage_selection WHERE account_participation_id = ${account_participation_id})`;

    var deleteStageSelectionQuery = `DELETE FROM stage_selection_rider WHERE stage_selection_id IN ${stage_selections} AND rider_participation_id = ${rider_participation_id};\n  `;

    var deleteKopmanQuery = `UPDATE stage_selection SET kopman_id = NULL WHERE stage_selection_id IN ${stage_selections} AND kopman_id = ${rider_participation_id};\n  `;

    var removeTeamSelectionQuery = `DELETE FROM team_selection_rider 
                WHERE account_participation_id = ${account_participation_id}
                AND rider_participation_id = ${rider_participation_id};\n `;

    var teamselectionQuery = `SELECT rider.firstname, rider.lastname, price, team, rider_participation_id FROM rider_participation
                INNER JOIN rider using(rider_id)
                WHERE rider_participation_id IN ${teamselection};\n `;

    var budgetQuery = `SELECT budget, race_id FROM race WHERE race_id = ${race_id};\n `;

    var totalQuery = deleteStageSelectionQuery + deleteKopmanQuery + removeTeamSelectionQuery + teamselectionQuery + budgetQuery;

    sqlDB.query(totalQuery, function (_, results) {
      var budgetLeft = budgetParticipation ? 11250000 : results[4].rows[0].budget;
      budgetLeft -= results[3].rows.reduce((sum, x) => sum + x.price, 0);

      callback({ userSelection: results[3].rows, budgetLeft })
    })

  };

  function addaccountparticipation(race_id, account_id, callback) {
    var account_participationQuery = `INSERT INTO account_participation(account_id,race_id,budgetparticipation) 
                VALUES(${account_id},${race_id},false),(${account_id},${race_id},true) 
                ON CONFLICT (account_id,race_id,budgetparticipation) DO NOTHING
                RETURNING (account_participation_id);\n`
    account_participationQuery += `SELECT COUNT(*) FROM stage WHERE race_id = ${race_id};\n `

    sqlDB.query(account_participationQuery, (_, results) => {
      if (results[0].rows.length === 2) {
        var stage_selectionQuery = `INSERT INTO stage_selection(stage_id,account_participation_id) VALUES`
        for (let stage = 1; stage < results[1].rows[0].count + 1; stage++) {
          let stage_id = `(SELECT stage_id FROM stage WHERE race_id = ${race_id} AND stagenr = ${stage})`
          stage_selectionQuery += `(${stage_id},${results[0].rows[0].account_participation_id}),(${stage_id},${results[0].rows[1].account_participation_id}),`
        }

        stage_selectionQuery = stage_selectionQuery.slice(0, -1) + `ON CONFLICT (account_participation_id,stage_id) DO NOTHING;\n`

        sqlDB.query(stage_selectionQuery, () => {
          callback({ participationAdded: true })
        })
      } else {
        callback({ participationAdded: false })
      }

    })
  }

  //Voor klassiekerspel:
  app.post('/api/getuserteamselection', function (req, res) {
    async.auto({
      userSelection: function (callback) {
        SQLread.getTeamSelection(req.user.account_id, req.body.race, req.body.year, callback)
      },
      race: function (callback) {
        SQLread.getRace(req.body.race, req.body.year, callback)
      }
    }, function (results) {
      //Bereken het budget
      var IDs = [];
      var budget = results.race.budget;
      for (var i = 0; i < results.userSelection.length; i++) {
        IDs.push(results.userSelection[i].rider_participation_id)
        budget = budget - results.userSelection[i].price
      }
      res.send({ userSelection: results.userSelection, budget: budget }) //{allRiders,userSelection}
    });
  });

  app.post('/api/teamselectionaddclassics', function (req, res) {
    //Scrape de rider opnieuw om foute data te voorkomen
    scrape.getRider(req.body.rider.pcsid.toLowerCase(), function (response) {
      if (response == 404) {
        res.send(false)
      } else {
        async.auto({
          rider_id: function (callback) {
            SQLwrite.addRiderToDatabase(
              response.pcsid,
              response.country,
              response.firstName,
              response.lastName,
              response.initials,
              callback
            )
          },
          race: function (callback) {
            SQLread.getRace(
              req.body.race,
              req.body.year,
              callback
            )
          }
        }, function (results) {
          SQLwrite.addRiderToRace(
            results.race.race_id,
            results.rider_id,
            req.body.price,
            response.team,
            function (reaction) {
              SQLwrite.addRiderToSelection(
                reaction.rider_participation_id,
                req.user.account_id,
                results.race.race_id,
                function (finalResponse) {
                  res.send(finalResponse)
                }
              )
            }

          )
        })
      }
    });
  });

  //Haalt de data van een enkele renner van pcs
  app.post('/api/getrider', function (req, res) {
    scrape.getRider(req.body.pcsid, function (response) {
      if (response == 404) {
        res.send(false)
      } else {
        res.send({ rider: response })
      }
    });
  });
}