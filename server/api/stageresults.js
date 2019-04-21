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
            
            var teamresultQuery =   `SELECT concat(firstname, ' ', lastname) AS "Name", team AS "Team", stagescore as "Stage Score", teamscore as "Team Score", totalscore as "Total"
                                FROM team_selection_rider 
                                INNER JOIN rider_participation USING(rider_participation_id)
                                INNER JOIN results_points USING(rider_participation_id)
                                INNER JOIN rider USING(rider_id)
                                WHERE account_participation_id=${account_participation_id} AND stage_id=${stage_id}
                                ORDER BY "Total" DESC, "Team" ; `;
            
            var userscoresQuery =   `SELECT username, stagescore, totalscore FROM stage_selection
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
            
            
            
            var totalQuery = teamresultQuery + userscoresQuery + stageresultsQuery + selectionsQuery;
            
            
            var userScoresColtype = {stagescore:1, totalscore:1};

            sqlDB.query(totalQuery, (err, results) => {
                if (err) throw err;
                var userscores = results[1].rows;
                var selecties = results[3].rows
                for (var i in userscores){
                    for (var j in selecties){
                        if (userscores[i].username == selecties[j].username){
                            userscores[i]['riderCount'] = selecties[j].count;
                            userscores[i]['riders'] = selecties[j].riders.sort(function(a,b){return b.totalscore - a.totalscore});
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
                });
            })
        }
    });
}