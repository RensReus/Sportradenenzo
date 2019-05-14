//In dit bestand staan alle calls die betrekking hebben tot de resultaten van een stage
const async = require('async')
const sqlDB = require('../db/sqlDB')
const SQLread = require('../db/SQLread')
const jwt = require('jsonwebtoken')
const fs = require('fs');

function getSecret() {
    if (fs.existsSync('./server/jwtsecret.js')) {
        return secret = require('../jwtsecret');
    } else {
        return secret = process.env.JWT_SECRET;
    }
}

module.exports = function (app) {

    app.post('/api/setkopman', function (req, res) {
        jwt.verify(req.body.token, getSecret(), function (err, user) {
            if (err || isNaN(req.body.stage) || req.body.stage<1 || req.body.stage>21) {
                res.send(false)
                throw err;
            } else {
                var values = [user.account_id, req.body.race, req.body.year, req.body.budgetParticipation, req.body.stage, req.body.rider_participation_id];
                var race_id = `(SELECT race_id FROM race WHERE name = $2 AND year = $3)`;
                var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = $1 AND race_id = ${race_id} AND budgetParticipation = $4)`;
                var stage_id = `(SELECT stage_id FROM stage WHERE stagenr=$5 AND race_id=${race_id})`
                var query = `UPDATE stage_selection
                            SET kopman_id=$6
                            WHERE account_participation_id=${account_participation_id} AND stage_id=${stage_id}`;
                sqlDB.query(query, values, (err, sqlres) => {
                    if (err) throw err;
                    res.send({'kopman':req.body.rider_participation_id})
                })
            }
        });
    });

    app.post('/api/removeriderfromstage', function (req, res) {
        jwt.verify(req.body.token, getSecret(), function (err, user) {
            if (err || isNaN(req.body.stage) || req.body.stage<1 || req.body.stage>21) {
                res.send(false)
                throw err;
            } else {
                var values = [user.account_id, req.body.race, req.body.year, req.body.budgetParticipation, req.body.stage, req.body.rider_participation_id];
                var race_id = `(SELECT race_id FROM race WHERE name = $2 AND year = $3)`;
                var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = $1 AND race_id = ${race_id} AND budgetParticipation = $4)`;
                var stage_id = `(SELECT stage_id FROM stage WHERE stagenr=$5 AND race_id=${race_id})`
                var stage_selection_id = `(SELECT stage_selection_id FROM stage_selection WHERE account_participation_id=${account_participation_id} AND stage_id=${stage_id})`
                var query = `DELETE FROM stage_selection_rider
                            WHERE stage_selection_id=${stage_selection_id} AND rider_participation_id=$6`;
                sqlDB.query(query, values, (err, sqlres) => {
                    if (err) throw err;
                    var values = [user.account_id, req.body.race, req.body.year, req.body.budgetParticipation, req.body.stage];
                    var race_id = `(SELECT race_id FROM race WHERE name = $2 AND year = $3)`;
                    var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = $1 AND race_id = ${race_id} AND budgetParticipation = $4)`;
                    var stage_id = `(SELECT stage_id FROM stage WHERE stagenr=$5 AND race_id=${race_id})`
                    var query = `SELECT * FROM stage_selection_rider
                                    INNER JOIN stage_selection USING (stage_selection_id)
                                    INNER JOIN rider_participation USING (rider_participation_id)
                                    INNER JOIN rider USING (rider_id)
                                    WHERE account_participation_id = ${account_participation_id} AND stage_id=${stage_id}`;
                    sqlDB.query(query, values, (err, sqlres) => {
                        if (err) throw err;
                        res.send(sqlres.rows)
                    });
                });
                sqlDB.query(query, values, (err, result) => {
                    if (err) throw err;
                })
            }
        })
    })

    app.post('/api/addridertostage', function (req, res) {
        jwt.verify(req.body.token, getSecret(), function (err, user) {
            if (err || isNaN(req.body.stage) || req.body.stage<1 || req.body.stage>21) { //Kijk of de juiste etappe bestaat en de user geverifieerd is
                res.send(false)
                throw err;
            } else {
                var values = [user.account_id, req.body.race, req.body.year, req.body.budgetParticipation, req.body.stage];
                var race_id = `(SELECT race_id FROM race WHERE name = $2 AND year = $3)`;
                var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = $1 AND race_id = ${race_id} AND budgetParticipation = $4)`;
                var stage_id = `(SELECT stage_id FROM stage WHERE stagenr=$5 AND race_id=${race_id})`
                var query = `SELECT * FROM stage_selection_rider
                            INNER JOIN stage_selection USING (stage_selection_id)
                            INNER JOIN rider_participation USING (rider_participation_id)
                            INNER JOIN rider USING (rider_id)
                            WHERE account_participation_id = ${account_participation_id} AND stage_id=${stage_id}`;
                sqlDB.query(query, values, (err, result) => {
                    if (err) throw err;
                    if (result.rows.length === 9) {
                        res.send(false)
                    }else{
                        var values = [user.account_id, req.body.race, req.body.year, req.body.budgetParticipation, req.body.stage, req.body.rider_participation_id];
                        var stage_selection_id = `(SELECT stage_selection_id FROM stage_selection WHERE account_participation_id=${account_participation_id} AND stage_id=${stage_id})`
                        var query = `INSERT INTO stage_selection_rider (stage_selection_id, rider_participation_id)
                                            VALUES (${stage_selection_id},$6)
                                            ON CONFLICT (rider_participation_id,stage_selection_id) DO NOTHING`
                        sqlDB.query(query, values, (err, sqlres) => {
                            if (err) throw err;
                            var values = [user.account_id, req.body.race, req.body.year, req.body.budgetParticipation, req.body.stage];
                            var race_id = `(SELECT race_id FROM race WHERE name = $2 AND year = $3)`;
                            var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = $1 AND race_id = ${race_id} AND budgetParticipation = $4)`;
                            var stage_id = `(SELECT stage_id FROM stage WHERE stagenr=$5 AND race_id=${race_id})`
                            var query = `SELECT * FROM stage_selection_rider
                                            INNER JOIN stage_selection USING (stage_selection_id)
                                            INNER JOIN rider_participation USING (rider_participation_id)
                                            INNER JOIN rider USING (rider_id)
                                            WHERE account_participation_id = ${account_participation_id} AND stage_id=${stage_id}`;
                            sqlDB.query(query, values, (err, sqlres) => {
                                if (err) throw err;
                                res.send(sqlres.rows)
                            });
                        });
                    }
                });
            }
        })
    });

    app.post('/api/getstage', function (req, res) {
        jwt.verify(req.body.token, getSecret(), function (err, user) {
            if (err || isNaN(req.body.stage) || req.body.stage<1 || req.body.stage>21) {
                res.send({ 'mode': '404' })
                throw err;
            } else {
                var race_id = `(SELECT race_id FROM race WHERE name = '${req.body.race}' AND year = '${req.body.year}')`;
                var now = new Date();
                var query = `SELECT starttime FROM stage WHERE race_id=${race_id} AND stagenr='${req.body.stage}'`;
                sqlDB.query(query, (err, results) => {
                            if (err) {console.log("WRONG QUERY:",query); throw err;}
                    if (now < results.rows[0].starttime) {
                        async.auto({
                            userSelectionGewoon: function (callback) {
                                SQLread.getTeamSelection(user.account_id, false, req.body.race, req.body.year, callback)
                            },
                            userSelectionBudget: function (callback) {
                                SQLread.getTeamSelection(user.account_id, true, req.body.race, req.body.year, callback)
                            },
                            stageSelectionGewoon: function (callback) {
                                SQLread.getStageSelection(user.account_id, false, req.body.race, req.body.year, req.body.stage, callback)
                            },
                            stageSelectionBudget: function (callback) {
                                SQLread.getStageSelection(user.account_id, true, req.body.race, req.body.year, req.body.stage, callback)
                            },
                            kopmanGewoon: function (callback) {
                                SQLread.getKopman(user.account_id, false, req.body.race, req.body.year, req.body.stage, callback)
                            },
                            kopmanBudget: function (callback) {
                                SQLread.getKopman(user.account_id, true, req.body.race, req.body.year, req.body.stage, callback)
                            },
                            startTime: function (callback) {
                                SQLread.getStageStarttime(5, req.body.stage, callback)// TODO Fix hardcoded race_id
                            }
                        }, function (err, asyncresults) {
                            if (err) throw err;
                            res.send({
                                'mode': 'selection',
                                'userTeamGewoon': asyncresults.userSelectionGewoon,
                                'userTeamBudget': asyncresults.userSelectionBudget,
                                'stageSelectionGewoon': asyncresults.stageSelectionGewoon,
                                'stageSelectionBudget': asyncresults.stageSelectionBudget,
                                'kopmanGewoon': asyncresults.kopmanGewoon,
                                'kopmanBudget': asyncresults.kopmanBudget,
                                starttime: asyncresults.startTime.starttime,
                            })
                        });
                    } else {

                        var stage_id = `(SELECT stage_id FROM stage WHERE race_id=${race_id} AND stagenr= ${req.body.stage})`;
                        var account_participation_idGewoon = `(SELECT account_participation_id FROM account_participation 
                            WHERE account_id=${user.account_id} AND race_id=${race_id} AND NOT budgetparticipation)`;
                        var stage_selection_idGewoon = `(SELECT stage_selection_id FROM stage_selection WHERE account_participation_id = ${account_participation_idGewoon} AND stage_id=${stage_id})`

                        var stagescoreGewoon = `CASE rider_participation_id WHEN (SELECT kopman_id FROM stage_selection WHERE account_participation_id = ${account_participation_idGewoon} AND stage_id=${stage_id}) THEN stagescore * 1.5 ELSE stagescore END`
                        var totalscoreGewoon = `CASE rider_participation_id WHEN (SELECT kopman_id FROM stage_selection WHERE account_participation_id = ${account_participation_idGewoon} AND stage_id=${stage_id}) THEN totalscore + stagescore * .5 ELSE totalscore END`
                        
                        var teamresultGewoonQuery = `SELECT concat(firstname, ' ', lastname) AS "Name", ${stagescoreGewoon} AS "Stage", gcscore AS "AK", pointsscore AS "Punten", komscore AS "Berg", yocscore AS "Jong",  teamscore as "Team", ${totalscoreGewoon} as "Total"
                                FROM stage_selection_rider 
                                INNER JOIN rider_participation USING(rider_participation_id)
                                INNER JOIN results_points USING(rider_participation_id)
                                INNER JOIN rider USING(rider_id)
                                WHERE stage_selection_id = ${stage_selection_idGewoon} AND results_points.stage_id = ${stage_id}
                                ORDER BY "Total" DESC, "Stage" DESC; `;

                        var userscoresGewoonQuery = `SELECT username, stagescore, totalscore FROM stage_selection
                                            INNER JOIN account_participation USING(account_participation_id)
                                            INNER JOIN account USING(account_id)
                                            WHERE stage_id=${stage_id} AND NOT budgetparticipation
                                            ORDER BY totalscore DESC; `;   

                    var rowClassNameGewoon = `CASE SUM(CASE stage_selection_id WHEN ${stage_selection_idGewoon} THEN 1 END) WHEN 1 THEN 'inteam' ELSE '' END AS "rowClassName"`;
                                            
                        var stageresultsGewoonQuery = `SELECT stagepos AS " ", concat(firstname, ' ', lastname) AS "Name", team AS "Team", stageresult AS "Time", ${rowClassNameGewoon}
                                FROM results_points
                                INNER JOIN rider_participation USING(rider_participation_id)
                                INNER JOIN rider USING(rider_id)
                                LEFT JOIN stage_selection_rider USING(rider_participation_id)
                                WHERE stage_id=${stage_id} AND stagepos > 0 
                                GROUP BY " ", "Name", "Team", "Time"
                                ORDER BY " " ASC; `;

                        var GCresultsGewoonQuery = `SELECT gcpos AS " ", concat(firstname, ' ', lastname) AS "Name", team AS "Team", gcresult AS "Time", ${rowClassNameGewoon}
                                FROM results_points
                                INNER JOIN rider_participation USING(rider_participation_id)
                                INNER JOIN rider USING(rider_id)
                                LEFT JOIN stage_selection_rider USING(rider_participation_id)
                                WHERE stage_id=${stage_id} AND gcpos > 0 
                                GROUP BY " ", "Name", "Team", "Time"
                                ORDER BY " " ASC; `;

                        var pointsresultsGewoonQuery = `SELECT pointspos AS " ", concat(firstname, ' ', lastname) AS "Name", team AS "Team", pointsresult AS "Punten", ${rowClassNameGewoon}
                                FROM results_points
                                INNER JOIN rider_participation USING(rider_participation_id)
                                INNER JOIN rider USING(rider_id)
                                LEFT JOIN stage_selection_rider USING(rider_participation_id)
                                WHERE stage_id=${stage_id} AND pointspos > 0 
                                GROUP BY " ", "Name", "Team", "Punten"
                                ORDER BY " " ASC; `;

                        var komresultsGewoonQuery = `SELECT kompos AS " ", concat(firstname, ' ', lastname) AS "Name", team AS "Team", komresult AS "Punten", ${rowClassNameGewoon}
                                FROM results_points
                                INNER JOIN rider_participation USING(rider_participation_id)
                                INNER JOIN rider USING(rider_id)
                                LEFT JOIN stage_selection_rider USING(rider_participation_id)
                                WHERE stage_id=${stage_id} AND kompos > 0 
                                GROUP BY " ", "Name", "Team", "Punten"
                                ORDER BY " " ASC; `;

                        var youthresultsGewoonQuery = `SELECT yocpos AS " ", concat(firstname, ' ', lastname) AS "Name", team AS "Team", yocresult AS "Time", ${rowClassNameGewoon}
                                FROM results_points
                                INNER JOIN rider_participation USING(rider_participation_id)
                                INNER JOIN rider USING(rider_id)
                                LEFT JOIN stage_selection_rider USING(rider_participation_id)
                                WHERE stage_id=${stage_id} AND yocpos > 0 
                                GROUP BY " ", "Name", "Team", "Time"
                                ORDER BY " " ASC; `;

                        var resultsGewoonQuery = stageresultsGewoonQuery + GCresultsGewoonQuery + pointsresultsGewoonQuery + komresultsGewoonQuery + youthresultsGewoonQuery;

                        var selectionsQuery = `SELECT username, COALESCE(COUNT(rider_participation_id),0) as count, ARRAY_AGG(json_build_object(
                                            'Name', CONCAT(firstname, ' ', lastname), 
                                            'totalscore', totalscore ,
                                            'inteam', CASE WHEN rider_participation_id in (SELECT rider_participation_id FROM team_selection_rider WHERE account_participation_id = ${account_participation_idGewoon}) THEN 'inteam' ELSE ' ' END 
                                            )) as riders FROM  results_points
                                            INNER JOIN team_selection_rider USING(rider_participation_id)
                                            INNER JOIN account_participation USING(account_participation_id)
                                            INNER JOIN account USING(account_id)
                                            INNER JOIN rider_participation USING (rider_participation_id)
                                            INNER JOIN rider USING (rider_id)
                                            WHERE stage_id = ${stage_id} and rider_participation_id in (SELECT rider_participation_id FROM team_selection_rider)
                                            GROUP BY username; `

                        var account_participation_idBudget = `(SELECT account_participation_id FROM account_participation 
                            WHERE account_id=${user.account_id} AND race_id=${race_id} AND budgetparticipation)`;
                        var stage_selection_idBudget = `(SELECT stage_selection_id FROM stage_selection WHERE account_participation_id = ${account_participation_idBudget} AND stage_id=${stage_id})`

                        var stagescoreBudget = `CASE rider_participation_id WHEN (SELECT kopman_id FROM stage_selection WHERE account_participation_id = ${account_participation_idBudget} AND stage_id=${stage_id}) THEN stagescore * 1.5 ELSE stagescore END`
                        var totalscoreBudget = `CASE rider_participation_id WHEN (SELECT kopman_id FROM stage_selection WHERE account_participation_id = ${account_participation_idBudget} AND stage_id=${stage_id}) THEN totalscore + stagescore * .5 - teamscore ELSE totalscore - teamscore END`
                        
                        var teamresultBudgetQuery = `SELECT concat(firstname, ' ', lastname) AS "Name", ${stagescoreBudget} AS "Stage", gcscore AS "AK", pointsscore AS "Punten", komscore AS "Berg", yocscore AS "Jong", ${totalscoreBudget} as "Total"
                                FROM stage_selection_rider 
                                INNER JOIN rider_participation USING(rider_participation_id)
                                INNER JOIN results_points USING(rider_participation_id)
                                INNER JOIN rider USING(rider_id)
                                WHERE stage_selection_id = ${stage_selection_idBudget} AND results_points.stage_id = ${stage_id}
                                ORDER BY "Total" DESC, "Stage" DESC; `;

                        var userscoresBudgetQuery = `SELECT username, stagescore, totalscore FROM stage_selection
                                            INNER JOIN account_participation USING(account_participation_id)
                                            INNER JOIN account USING(account_id)
                                            WHERE stage_id=${stage_id} AND budgetparticipation
                                            ORDER BY totalscore DESC; `;   
                                            
                        var rowClassNameBudget = `CASE SUM(CASE stage_selection_id WHEN ${stage_selection_idBudget} THEN 1 END) WHEN 1 THEN 'inteam' ELSE '' END AS "rowClassName"`;

                        var stageresultsBudgetQuery = `SELECT stagepos AS " ", concat(firstname, ' ', lastname) AS "Name", team AS "Team", stageresult AS "Time", ${rowClassNameBudget}
                                FROM results_points
                                INNER JOIN rider_participation USING(rider_participation_id)
                                INNER JOIN rider USING(rider_id)
                                LEFT JOIN stage_selection_rider USING(rider_participation_id)
                                WHERE stage_id=${stage_id} AND stagepos > 0 
                                GROUP BY " ", "Name", "Team", "Time"
                                ORDER BY " " ASC; `;
                
                        var GCresultsBudgetQuery = `SELECT gcpos AS " ", concat(firstname, ' ', lastname) AS "Name", team AS "Team", gcresult AS "Time", ${rowClassNameBudget}
                                FROM results_points
                                INNER JOIN rider_participation USING(rider_participation_id)
                                INNER JOIN rider USING(rider_id)
                                LEFT JOIN stage_selection_rider USING(rider_participation_id)
                                WHERE stage_id=${stage_id} AND gcpos > 0 
                                GROUP BY " ", "Name", "Team", "Time"
                                ORDER BY " " ASC; `;

                        var pointsresultsBudgetQuery = `SELECT pointspos AS " ", concat(firstname, ' ', lastname) AS "Name", team AS "Team", pointsresult AS "Punten", ${rowClassNameBudget}
                                FROM results_points
                                INNER JOIN rider_participation USING(rider_participation_id)
                                INNER JOIN rider USING(rider_id)
                                LEFT JOIN stage_selection_rider USING(rider_participation_id)
                                WHERE stage_id=${stage_id} AND pointspos > 0 
                                GROUP BY " ", "Name", "Team", "Punten"
                                ORDER BY " " ASC; `;

                        var komresultsBudgetQuery = `SELECT kompos AS " ", concat(firstname, ' ', lastname) AS "Name", team AS "Team", komresult AS "Punten", ${rowClassNameBudget}
                                FROM results_points
                                INNER JOIN rider_participation USING(rider_participation_id)
                                INNER JOIN rider USING(rider_id)
                                LEFT JOIN stage_selection_rider USING(rider_participation_id)
                                WHERE stage_id=${stage_id} AND kompos > 0 
                                GROUP BY " ", "Name", "Team", "Punten"
                                ORDER BY " " ASC; `;

                        var youthresultsBudgetQuery = `SELECT yocpos AS " ", concat(firstname, ' ', lastname) AS "Name", team AS "Team", yocresult AS "Time", ${rowClassNameBudget}
                                FROM results_points
                                INNER JOIN rider_participation USING(rider_participation_id)
                                INNER JOIN rider USING(rider_id)
                                LEFT JOIN stage_selection_rider USING(rider_participation_id)
                                WHERE stage_id=${stage_id} AND yocpos > 0 
                                GROUP BY " ", "Name", "Team", "Time"
                                ORDER BY " " ASC; `;

                        var resultsBudgetQuery = stageresultsBudgetQuery + GCresultsBudgetQuery + pointsresultsBudgetQuery + komresultsBudgetQuery + youthresultsBudgetQuery;
                    
                        var gewoonQuery = teamresultGewoonQuery + userscoresGewoonQuery + resultsGewoonQuery;
                        var budgetQuery = teamresultBudgetQuery + userscoresBudgetQuery + resultsBudgetQuery;
                        var totalQuery = gewoonQuery + budgetQuery;
                        var userScoresColtype = { stagescore: 1, totalscore: 1 };
                        sqlDB.query(totalQuery, (err, uitslagresults) => {
                            if (err) {console.log("WRONG QUERY:",totalQuery); throw err;}
                            var userscoresGewoon = uitslagresults[1].rows;
                            var userscoresBudget = uitslagresults[8].rows;
                            // for (var i in userscores) { // VOOR DE selecties popup
                            //     for (var j in selecties) {
                            //         if (userscores[i].username == selecties[j].username) {
                            //             userscores[i]['riderCount'] = selecties[j].count;
                            //             userscores[i]['riders'] = selecties[j].riders.sort(function (a, b) { return b.totalscore - a.totalscore });
                            //         }
                            //     }
                            // }
                            var teamresultGewoon = [];
                            if(uitslagresults[0].rowCount){
                                teamresultGewoon = uitslagresults[0].rows;
                            }
                            var stageresultsGewoon = [];
                            if(uitslagresults[2].rowCount){
                                stageresultsGewoon.push(uitslagresults[2].rows);
                                stageresultsGewoon.push(uitslagresults[3].rows);
                                stageresultsGewoon.push(uitslagresults[4].rows);
                                stageresultsGewoon.push(uitslagresults[5].rows);
                                stageresultsGewoon.push(uitslagresults[6].rows);
                            }
                            var teamresultBudget = [];
                            if(uitslagresults[7].rowCount){
                                teamresultBudget = uitslagresults[7].rows;
                            }
                            var stageresultsBudget = [];
                            if(uitslagresults[9].rowCount){
                                stageresultsBudget.push(uitslagresults[9].rows);
                                stageresultsBudget.push(uitslagresults[10].rows);
                                stageresultsBudget.push(uitslagresults[11].rows);
                                stageresultsBudget.push(uitslagresults[12].rows);
                                stageresultsBudget.push(uitslagresults[13].rows);
                            }

                            res.send({
                                'mode': 'results',
                                teamresultGewoon,
                                userscoresGewoon,
                                stageresultsGewoon,
                                teamresultBudget,
                                userscoresBudget,
                                stageresultsBudget,
                                userScoresColtype: userScoresColtype,
                            })
                        })
                    }
                })
            }
        })
    });

    app.post('/api/getstageresultsclassics', function (req, res) {

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

            var race_id = `(SELECT race_id FROM race WHERE name = '${req.body.race}' AND year = ${req.body.year})`;
            var stage_id = `(SELECT stage_id FROM stage WHERE race_id=${race_id} AND stagenr= ${req.body.stageNumber})`;
            var account_participation_id = `(SELECT account_participation_id FROM account_participation 
                WHERE account_id=${req.user.account_id} AND race_id=${race_id})`;

            var teamresultQuery = `SELECT concat(firstname, ' ', lastname) AS "Name", team AS "Team", stagescore as "Stage Score", teamscore as "Team Score", totalscore as "Total"
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

            // concat('<a href="/rider/', rider_participation_id,'">',firstname, ' ', lastname,'</a>') voor later

            var stageresultsQuery = `SELECT stagepos AS " ", concat(firstname, ' ', lastname) AS "Name", team AS "Team", stageresult AS "Time", CASE SUM(CASE account_participation_id WHEN ${account_participation_id} THEN 1 END) WHEN 1 THEN 'inteam' ELSE '' END AS "rowClassName"
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
                                'inteam', CASE WHEN rider_participation_id in (SELECT rider_participation_id FROM team_selection_rider WHERE account_participation_id = ${account_participation_id}) THEN 'inteam' ELSE ' ' END 
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


            var userScoresColtype = { stagescore: 1, totalscore: 1 };

            sqlDB.query(totalQuery, (err, results) => {
                if (err) { console.log("WRONG QUERY:", totalQuery); throw err; }
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
                console.log(results)
                res.send({
                    mode: '',
                    teamresult: results[0].rows,
                    userscores: userscores,
                    stageresults: results[2].rows,
                    userScoresColtype: userScoresColtype,
                    prevText: prevText,
                    currText: currText,
                    nextText: nextText,
                    lastStage: lastStage,
                    raceStarted: results[4].rows[0].racestarted
                });
            })
        }
    });

    app.post('/api/getfinalclassics', function (req, res) {
        if (!req.user) {
            res.send({ 'mode': '404' });
            return;
        } else {
            console.log("userdata: ", req.user)
            var prevText = "Naar 14: Eschborn-Frankfurt";//TODO get race name or stage 21 for GT
            var lastStageLink = "/stage/14";
            res.send({
                prevText: prevText,
                lastStageLink: lastStageLink,
                username: req.user.username
            })
        }
    })
}