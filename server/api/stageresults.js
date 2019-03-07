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
}