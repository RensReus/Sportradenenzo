//In dit bestand staan alle calls die betrekking hebben tot de resultaten van een stage
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
            
            var race_id = `(SELECT race_id FROM race WHERE name = '${req.body.race}' AND year = ${req.body.year})`;
            var stage_id = `(SELECT stage_id FROM stage WHERE race_id=${race_id} AND stagenr= ${req.body.stageNumber})`;
            var account_participation_id = `(SELECT account_participation_id FROM account_participation 
                WHERE account_id=${req.user.account_id} AND race_id=${race_id})`;
            
            teamresultQuery =   `SELECT *
                                FROM team_selection_rider 
                                INNER JOIN rider_participation USING(rider_participation_id)
                                INNER JOIN results_points USING(rider_participation_id)
                                INNER JOIN rider USING(rider_id)
                                WHERE account_participation_id=${account_participation_id} AND stage_id=${stage_id}
                                ORDER BY totalscore DESC, team ; `;
            
            userscoresQuery =   `SELECT username, stagescore, totalscore FROM stage_selection
                                INNER JOIN account_participation USING(account_participation_id)
                                INNER JOIN account USING(account_id)
                                WHERE stage_id=${stage_id}
                                ORDER BY totalscore DESC; `;

            stageresultsQuery = `SELECT stagepos, firstname, lastname, team, stageresult, SUM(CASE account_participation_id WHEN ${account_participation_id} THEN 1 END) AS inteam
                                FROM results_points
                                INNER JOIN rider_participation USING(rider_participation_id)
                                INNER JOIN rider USING(rider_id)
                                LEFT JOIN team_selection_rider USING(rider_participation_id)
                                WHERE stage_id=${stage_id} AND stagepos > 0 
                                GROUP BY stagepos, firstname, lastname, team, stageresult
                                ORDER BY stagepos ASC; `;
            
            var selectionsQuery = `SELECT username, COUNT(rider_participation_id), STRING_AGG(lastname || ':' || totalscore, ', ') as riders FROM results_points
            INNER JOIN team_selection_rider USING(rider_participation_id)
            INNER JOIN account_participation USING(account_participation_id)
            INNER JOIN account USING(account_id)
            INNER JOIN rider_participation USING (rider_participation_id)
            INNER JOIN rider USING (rider_id)
            WHERE stage_id = ${stage_id} and rider_participation_id in (SELECT rider_participation_id FROM team_selection_rider)
            GROUP BY username; `
            
            
            
            var totalQuery = teamresultQuery + userscoresQuery + stageresultsQuery + selectionsQuery;
            
            


            sqlDB.query(totalQuery, (err, results) => {
                if (err) throw err;
                // if (!response.rows[0]) { 
                //     res.send({'mode': '404'});
                //     return;
                // nieuwe exists check moet nog toegevoegd worden
                var userscores = results[1].rows;
                var selecties = results[3].rows
                for (var i in userscores){
                    for (var j in selecties){
                        if (userscores[i].username == selecties[j].username){
                            userscores[i]['riderCount'] = selecties[j].count;
                            userscores[i]['riders'] = selecties[j].riders;
                        }
                    }
                }
                console.log(results)
                res.send({
                    mode: '',
                    teamresult: results[0].rows,
                    userscores: userscores,
                    stageresults: results[2].rows,
                    prevText: prevText,
                    currText: currText,
                    nextText: nextText,
                });
            })
        }
    });
}