// In dit bestand staan alle calls die te maken hebben met het selecteren van het team voor een race

module.exports = function (app) {
    const async = require('async')
    const sqlDB = require('../db/sqlDB')
    const SQLread = require('../db/SQLread')
    const SQLwrite = require('../db/SQLwrite')
    const SQLscrape = require('../SQLscrape')
    const jwt = require('jsonwebtoken')
    const fs = require('fs');

    function getSecret() {
        if (fs.existsSync('./server/jwtsecret.js')) {
            return secret = require('../jwtsecret');
        } else {
            return secret = process.env.JWT_SECRET;
        }
    }

    app.post('/api/getridersandteam', function (req, res) {
        jwt.verify(req.body.token, getSecret(), function (err, user) {
            if (err) {
                res.redirect('/')
                throw err;
            } else if (currentstage_global === 0) {
                sqlDB.query(`SELECT * FROM account_participation WHERE race_id = ${current_race_id} AND account_id = ${user.account_id}`, (err, results) => {
                    if (err) { console.log("GET participation error"); throw err };
                    if (results.rows.length) {
                        async.auto({
                            allRiders: function (callback) {
                                SQLread.getAllRiders(req.body.race, req.body.year, callback)
                            },
                            userSelectionGewoon: function (callback) {
                                SQLread.getTeamSelection(user.account_id, false, req.body.race, req.body.year, callback)
                            },
                            userSelectionBudget: function (callback) {
                                SQLread.getTeamSelection(user.account_id, true, req.body.race, req.body.year, callback)
                            },
                            race: function (callback) {
                                SQLread.getRace(req.body.race, req.body.year, callback)
                            }
                        }, function (err, results) {
                            if (err) throw err;

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
                            res.send({ allRiders: results.allRiders, userSelectionGewoon: results.userSelectionGewoon, userSelectionBudget: results.userSelectionBudget, budgetGewoon, budgetBudget })
                        });
                    } else {
                        res.send({ noParticipation: true })
                    }

                })
            } else {
                res.redirect('/')
            }
        });
    });

    app.post('/api/teamselectionadd', function (req, res) {
        jwt.verify(req.body.token, getSecret(), function (err, user) {
            if (err) {
                res.redirect('/')
                throw err;
            } else if (currentstage_global === 0) {
                var race_id = `(SELECT race_id FROM race WHERE name = '${req.body.race}' AND year = ${req.body.year})`;
                var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = ${user.account_id} AND race_id = ${race_id} AND budgetParticipation = ${req.body.budgetParticipation})`;
                var teamselection = `(SELECT rider_participation_id FROM team_selection_rider WHERE account_participation_id = ${account_participation_id})`;

                var riderQuery = `SELECT rider.firstname, rider.lastname, price, team, rider_participation_id FROM rider_participation
                INNER JOIN rider using(rider_id)
                WHERE rider_participation_id = ${req.body.rider_participation_id};\n `

                var teamselectionQuery = `SELECT rider.firstname, rider.lastname, price, team, rider_participation_id FROM rider_participation
                INNER JOIN rider using(rider_id)
                WHERE rider_participation_id IN ${teamselection};\n `;
                var budget = 11250000;
                var budgetQuery = `SELECT budget, race_id FROM race WHERE race_id = ${race_id}`

                var totalQuery = riderQuery + teamselectionQuery + budgetQuery;

                sqlDB.query(totalQuery, function (err, results) {
                    var start = Date.now()
                    if (err) { console.log("WRONG QUERY: ", totalQuery); throw err };
                    if (!req.body.budgetParticipation) {
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
                        res.send(false)
                    } else {
                        var addQuery = `INSERT INTO team_selection_rider(rider_participation_id,account_participation_id)
                                VALUES(${req.body.rider_participation_id},${account_participation_id}) 
                                ON CONFLICT (account_participation_id, rider_participation_id) DO NOTHING`;

                        sqlDB.query(addQuery, (err, response) => {
                            if (err) { console.log("WRONG QUERY:", addQuery); throw err; }
                            if (response.rowCount) { //Only add if sql added rider to DB
                                results[1].rows.push(results[0].rows[0])
                            }
                            var budgetLeft = results[2].rows[0].budget;
                            if (req.body.budgetParticipation) {
                                budgetLeft = 11250000;
                            }
                            for (var i = 0; i < results[1].rows.length; i++) {
                                budgetLeft -= results[1].rows[i].price;
                            }
                            res.send({ userSelection: results[1].rows, budget: budgetLeft })
                        })
                    }
                })
            } else {
                res.redirect('/')
            }
        });
    });

    app.post('/api/teamselectionaddclassics', function (req, res) {
        if (!req.user) {
            res.redirect('/')
        } else if (currentstage_global === 0) {
            //Scrape de rider opnieuw om foute data te voorkomen
            SQLscrape.getRider(req.body.rider.pcsid.toLowerCase(), function (response) {
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
                    }, function (err, results) {
                        if (err) throw err;
                        SQLwrite.addRiderToRace(
                            results.race.race_id,
                            results.rider_id,
                            req.body.price,
                            response.team,
                            function (err, reaction) {
                                if (err) throw err;
                                SQLwrite.addRiderToSelection(
                                    reaction.rider_participation_id,
                                    req.user.account_id,
                                    results.race.race_id,
                                    function (err, finalResponse) {
                                        if (err) throw err;
                                        res.send(finalResponse)
                                    }
                                )
                            }

                        )
                    })
                }
            });
        } else {
            res.redirect('/')
        }
    });

    app.post('/api/teamselectionremove', function (req, res) {
        jwt.verify(req.body.token, getSecret(), function (err, user) {
            if (err) {
                res.send(false)
                res.redirect('/')
                throw err;
            } else if (currentstage_global === 0) {
                var race_id = `(SELECT race_id FROM race WHERE name = '${req.body.race}' AND year = ${req.body.year})`;
                var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = ${user.account_id} AND race_id = ${race_id} AND budgetParticipation = ${req.body.budgetParticipation})`;
                var teamselection = `(SELECT rider_participation_id FROM team_selection_rider WHERE account_participation_id = ${account_participation_id})`;

                var stage_selections = `(SELECT stage_selection_id FROM stage_selection WHERE account_participation_id = ${account_participation_id})`;

                var deleteStageSelectionQuery = `DELETE FROM stage_selection_rider WHERE stage_selection_id IN ${stage_selections} AND rider_participation_id = ${req.body.rider_participation_id};\n  `;

                var deleteKopmanQuery = `UPDATE stage_selection SET kopman_id = NULL WHERE stage_selection_id IN ${stage_selections} AND kopman_id = ${req.body.rider_participation_id};\n  `;

                var removeTeamSelectionQuery = `DELETE FROM team_selection_rider 
                WHERE account_participation_id = ${account_participation_id}
                AND rider_participation_id = ${req.body.rider_participation_id};\n `;

                var teamselectionQuery = `SELECT rider.firstname, rider.lastname, price, team, rider_participation_id FROM rider_participation
                INNER JOIN rider using(rider_id)
                WHERE rider_participation_id IN ${teamselection};\n `;

                var budgetQuery = `SELECT budget, race_id FROM race WHERE race_id = ${race_id};\n `;

                var totalQuery = deleteStageSelectionQuery + deleteKopmanQuery + removeTeamSelectionQuery + teamselectionQuery + budgetQuery;

                sqlDB.query(totalQuery, function (err, results) {
                    if (err) { console.log("WRONG QUERY:", totalQuery); throw err; }
                    var budgetLeft = results[4].rows[0].budget;
                    if (req.body.budgetParticipation) {
                        budgetLeft = 11250000;
                    }
                    for (var i = 0; i < results[3].rows.length; i++) {
                        budgetLeft -= results[3].rows[i].price;
                    }
                    res.send({ userSelection: results[3].rows, budget: budgetLeft })
                })
            } else {
                res.redirect('/')
            }
        });
    });

    //Voor klassiekerspel:
    app.post('/api/getuserteamselection', function (req, res) {
        jwt.verify(req.body.token, getSecret(), function (err, user) {
            if (err) {
                res.send(false)
                res.redirect('/')
                throw err;
            } else if (currentstage_global === 0) {
                async.auto({
                    userSelection: function (callback) {
                        SQLread.getTeamSelection(user.account_id, req.body.race, req.body.year, callback)
                    },
                    race: function (callback) {
                        SQLread.getRace(req.body.race, req.body.year, callback)
                    }
                }, function (err, results) {
                    if (err) throw err;
                    //Bereken het budget
                    var IDs = [];
                    var budget = results.race.budget;
                    for (var i = 0; i < results.userSelection.length; i++) {
                        IDs.push(results.userSelection[i].rider_participation_id)
                        budget = budget - results.userSelection[i].price
                    }
                    res.send({ userSelection: results.userSelection, budget: budget }) //{allRiders,userSelection}
                });
            } else {
                res.redirect('/')
            }
        });
    });

    //Haalt de data van een enkele renner van pcs
    app.post('/api/getrider', function (req, res) {
        SQLscrape.getRider(req.body.pcsid, function (response) {
            if (response == 404) {
                res.send(false)
            } else {
                res.send({ rider: response })
            }
        });
    });

    app.post('/api/addaccountparticipation', function (req, res) {
        jwt.verify(req.body.token, getSecret(), function (err, user) {
            if (err) {
                res.send(false)
                res.redirect('/')
                throw err;
            } else if (currentstage_global === 0) {
                var account_participationQuery = `INSERT INTO account_participation(account_id,race_id,budgetparticipation) 
                VALUES(${user.account_id},${current_race_id},false),(${user.account_id},${current_race_id},true) 
                ON CONFLICT (account_id,race_id,budgetparticipation) DO NOTHING
                RETURNING (account_participation_id);\n`

                sqlDB.query(account_participationQuery, (err, results) => {
                    if (err) { console.log("WRONG QUERY:", account_participationQuery); res.send({ participationAdded: false }); throw err; }

                    if (results.rows.length = 2) {
                        var stage_selectionQuery = `INSERT INTO stage_selection(stage_id,account_participation_id) VALUES`
                        for (let stage = 1; stage < 23; stage++) {
                            let stage_id = `(SELECT stage_id FROM stage WHERE race_id = ${current_race_id} AND stagenr = ${stage})`
                            stage_selectionQuery += `(${stage_id},${results.rows[0].account_participation_id}),(${stage_id},${results.rows[1].account_participation_id}),`
                        }

                        stage_selectionQuery = stage_selectionQuery.slice(0, -1) + `ON CONFLICT (account_participation_id,stage_id) DO NOTHING;\n`

                        sqlDB.query(stage_selectionQuery, (err, results2) => {
                            if (err) { console.log("WRONG QUERY:", stage_selectionQuery); res.send({ participationAdded: false }); throw err; }
                            res.send({ participationAdded: true })

                        })
                    } else {
                        res.send({ participationAdded: false })
                    }

                })
            }
        })
    });
}