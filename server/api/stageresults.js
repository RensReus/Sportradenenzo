//In dit bestand staan alle calls die betrekking hebben tot de resultaten van een stage
const async = require('async')
const sqlDB = require('../db/sqlDB')

module.exports = function (app) {
    app.post('/api/getstageresultsclassics', function (req, res) {
        if (!req.user) {
            res.send({ 'mode': '404' });
            return;
        } else {
            var values = [req.body.race, req.body.year, req.body.stageNumber]
            var race_id = `(SELECT race_id FROM race WHERE name = $1 AND year = $2)`
            var query = `SELECT * FROM stage WHERE race_id=${race_id} AND stagenr=$3`
            sqlDB.query(query, values, (err, response) => {
                if (err) throw err;
                if (!response.rows[0]) {
                    res.send({'mode': '404'});
                    return;
                } else {
                    async.auto({
                        teamresult: function (callback) {
                            values = [req.body.race, req.body.year]
                            var account_participation_id = `(SELECT account_participation_id FROM account_participation 
                                WHERE account_id=${req.user.account_id} AND race_id=${race_id})`
                            query = `SELECT *
                                FROM team_selection_rider 
                                INNER JOIN rider_participation
                                ON (rider_participation.rider_participation_id = team_Selection_rider.rider_participation_id)
                                INNER JOIN results_points
                                ON (results_points.rider_participation_id=team_selection_rider.rider_participation_id)
                                INNER JOIN rider
                                ON (rider.rider_id=rider_participation.rider_id)
                                WHERE account_participation_id=${account_participation_id} AND stage_id=${response.rows[0].stage_id}
                                ORDER BY totalscore desc`
                            sqlDB.query(query, values, callback)
                        },
                        userscores: function (callback) {
                            query = `SELECT username, stagescore, totalscore FROM stage_selection
                                INNER JOIN account_participation
                                ON (account_participation.account_participation_id=stage_selection.account_participation_id)
                                INNER JOIN account
                                ON (account.account_id=account_participation.account_id)
                                WHERE stage_id=${response.rows[0].stage_id}`
                            sqlDB.query(query, callback)
                        },
                        stageresults: function (callback) {
                            query = `SELECT stagepos, firstname, lastname, team, stageresult
                                FROM results_points
                                INNER JOIN rider_participation
                                ON (results_points.rider_participation_id=rider_participation.rider_participation_id)
                                INNER JOIN rider
                                ON (rider.rider_id=rider_participation.rider_id)
                                WHERE stage_id=${response.rows[0].stage_id}
                                ORDER BY stagepos asc`
                            sqlDB.query(query, callback)
                        }
                    }, function (err, results) {
                        if (err) throw err;
                        res.send({
                            'mode': '',
                            'teamresult': results.teamresult.rows,
                            'userscores': results.userscores.rows,
                            'stageresults': results.stageresults.rows
                        });
                        return;
                    });
                }
            })
        }
    });
    app.post('/api/getstagevictories', function (req, response) {
        if(!req.user){
            response.redirect('/')
        }else{
            var race_id = req.body.race_id;
            var poule_id = req.body.poule_id;

            var query =`SELECT username, stagenr, rank() over (PARTITION BY stagenr ORDER BY stagescore desc) FROM stage_selection
            INNER JOIN account_participation USING (account_participation_id)
            INNER JOIN account USING (account_id)
            INNER JOIN stage USING (stage_id)
            WHERE stage.race_id = ${race_id}
            ORDER BY stagenr ASC, rank ASC`;//AND poule_id = ${poule_id}
            sqlDB.query(query,(err, res) => {
                if (err) throw err;
                else {
                    var stage = 1;
                    var stagerankings = [];
                    var rankingscount = [];
                    var rankingsObj = {};
                    for (var i in res.rows){
                        rankingsObj["stage"] = stage;

                        var username = res.rows[i].username;
                        var rank = res.rows[i].rank;
                        if(res.rows[i].stagenr == stage){
                            rankingsObj[rank+"e"] = username;
                        }else{
                            stagerankings.push(rankingsObj);
                            stage++;
                            var rankingsObj = {};
                            rankingsObj["stage"] = stage;
                            rankingsObj[rank+"e"] = username;
                        }
                        if(i == res.rows.length - 1){
                          stagerankings.push(rankingsObj);
                        }
                    }
                    var totalAccounts = res.rows.length/stage;
                    for(var j = 1; j <totalAccounts+1; j++){
                        var userObj = {name:stagerankings[0][j+"e"]}
                        for(var k = 1; k <totalAccounts+1; k++){
                            userObj[k+"e"] = 0;
                        }
                        for(var i in stagerankings){
                            for(var k = 1; k <totalAccounts+1; k++){
                                if(stagerankings[i][k+"e"] == userObj.name){
                                    userObj[k+"e"] += 1;
                                }
                            }
                        }
                        rankingscount.push(userObj);
                    }

                    response.send({stagerankings: stagerankings, rankingscount:rankingscount});
                }
            })
        }
    });
} 
