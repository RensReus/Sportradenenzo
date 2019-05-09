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

    app.post('/api/addridertostage', function (req, res) {
        console.log(req.body)
        jwt.verify(req.body.token, getSecret(), function (err, user) {
            if (err) {
                res.send(false)
                throw err;
            }else{
                var values = [user.account_id, req.body.race, req.body.year, req.body.budgetParticipation, req.body.stage];
                console.log(values)
                var race_id = `(SELECT race_id FROM race WHERE name = $2 AND year = $3)`;
                var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = $1 AND race_id = ${race_id} AND budgetParticipation = $4)`;
                var stage_id = `(SELECT stage_id FROM stage WHERE stagenr=$5 AND race_id=${race_id})`
                var query = `SELECT * FROM stage_selection_rider
                            INNER JOIN stage_selection USING (stage_selection_id)
                            INNER JOIN rider_participation USING (rider_participation_id)
                            INNER JOIN rider USING (rider_id)
                            WHERE account_participation_id = ${account_participation_id} AND stage_id=${stage_id}`;
                console.log(query)
                sqlDB.query(query, values, (err, result) => {
                    if (err) throw err;
                    res.send(result.rows)
                });
            }
        })
    });

    app.post('/api/getstage', function (req, res) {
        jwt.verify(req.body.token, getSecret(), function (err, user) {
            if (err) {
                res.send({ 'mode': '404' })
                throw err;
            } else {
                var race_id = `(SELECT race_id FROM race WHERE name = '${req.body.race}' AND year = '${req.body.year}')`;
                var now = new Date();
                var query = `SELECT starttime FROM stage WHERE race_id=${race_id} AND stagenr='${req.body.stage}'`;
                sqlDB.query(query, (err, results) => {
                    if (err) throw err;
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
                            }
                        }, function (err, results) {
                            if (err) throw err;
                            res.send({
                                'mode': 'selection',
                                'userTeamGewoon': results.userSelectionGewoon,
                                'userTeamBudget': results.userSelectionBudget,
                                'stageSelectionGewoon': results.stageSelectionGewoon,
                                'stageSelectionBudget': results.stageSelectionBudget
                            })
                        });
                    } else {
                        sqlDB.query(childquery, (err, sqlres) => {
                            if (err) throw err;
                            res.send({
                                'mode': 'results'
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
                if (err) throw err;
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