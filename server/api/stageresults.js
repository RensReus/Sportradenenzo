//In dit bestand staan alle calls die betrekking hebben tot de resultaten van een stage
const async = require('async')
const sqlDB = require('../db/sqlDB')

module.exports = function (app) {
    app.post('/api/getstageresultsclassics', function (req, res) {
        
        if (!req.user) {
            res.send({ 'mode': '404' });
            return;
        } else {
            var raceNames = ['omloop-het-nieuwsblad', 'kuurne-brussel-kuurne', 'strade-bianchi','milano-sanremo','e3-harelbeke','gent-wevelgem','dwars-door-vlaanderen','ronde-van-vlaanderen','Scheldeprijs','paris-roubaix','amstel-gold-race','la-fleche-wallone','liege-bastogne-liege','Eschborn-Frankfurt'];
            var prevText = "";
            var currText = "";
            var nextText = "";
            var stagenr = parseInt(req.body.stageNumber);

            if(stagenr > 1 && stagenr < raceNames.length){
                prevText = "Naar " + (stagenr - 1) + ": " + raceNames[stagenr - 2];
                currText = stagenr + ": " + raceNames[stagenr - 1];
                nextText = "Naar " + (stagenr + 1) + ": " + raceNames[stagenr];
            } else if(stagenr < raceNames.length){
                currText = stagenr + ": " + raceNames[stagenr - 1];
                nextText = "Naar " + (stagenr + 1) + ": " + raceNames[stagenr];
            } else if(stagenr > 1){
                prevText = "Naar " + (stagenr - 1) + ": " + raceNames[stagenr - 2];
                currText = stagenr + ": " + raceNames[stagenr - 1];
                nextText = "Naar Einduitslag";
            }

            var values = [req.body.race, req.body.year, stagenr]
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
                                INNER JOIN rider_participation USING(rider_participation_id)
                                INNER JOIN results_points USING(rider_participation_id)
                                INNER JOIN rider USING(rider_id)
                                WHERE account_participation_id=${account_participation_id} AND stage_id=${response.rows[0].stage_id}
                                ORDER BY totalscore DESC`
                            sqlDB.query(query, values, callback)
                        },
                        userscores: function (callback) {
                            query = `SELECT username, stagescore, totalscore FROM stage_selection
                                INNER JOIN account_participation USING(account_participation_id)
                                INNER JOIN account USING(account_id)
                                WHERE stage_id=${response.rows[0].stage_id}
                                ORDER BY totalscore DESC`
                            sqlDB.query(query, callback)
                        },
                        stageresults: function (callback) {
                            var values = [req.body.race, req.body.year]
                            var account_participation_id = `(SELECT account_participation_id FROM account_participation 
                                WHERE account_id=${req.user.account_id} AND race_id=${race_id})`
                            query = `SELECT stagepos, firstname, lastname, team, stageresult, SUM(CASE account_participation_id WHEN ${account_participation_id} THEN 1 END) AS inteam
                                FROM results_points
                                INNER JOIN rider_participation USING(rider_participation_id)
                                INNER JOIN rider USING(rider_id)
                                LEFT JOIN team_selection_rider USING(rider_participation_id)
                                WHERE stage_id=${response.rows[0].stage_id} AND stagepos > 0 
                                GROUP BY stagepos, firstname, lastname, team, stageresult
                                ORDER BY stagepos ASC`
                            sqlDB.query(query, values, callback)
                        }
                    }, function (err, results) {
                        if (err) throw err;
                        res.send({
                            mode: '',
                            teamresult: results.teamresult.rows,
                            userscores: results.userscores.rows,
                            stageresults: results.stageresults.rows,
                            prevText: prevText,
                            currText: currText,
                            nextText: nextText,
                        });
                        return;
                    });
                }
            })
        }
    });
}