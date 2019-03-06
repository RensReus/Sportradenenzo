//In dit bestand staan alle calls die betrekking hebben tot de resultaten van een stage

module.exports = function (app,sqlDB) {
    const async = require('async')
    const SQLread = require('../db/SQLread')
    SQLread.passConnection(sqlDB)
    const SQLwrite = require('../db/SQLwrite')
    SQLwrite.passConnection(sqlDB)
    const SQLscrape = require('../SQLscrape')
    SQLscrape.passConnection(sqlDB)

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
    })
}