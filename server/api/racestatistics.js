//In dit bestand staan alle calls die betrekking hebben tot de resultaten van een stage

module.exports = function (app) {
    const async = require('async')
    const sqlDB = require('../db/sqlDB')

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
                    rankingscount.sort(function(a,b){
                        for(var i = 1; i <totalAccounts+1; i++){
                            if(a[i+"e"]>b[i+"e"]) return false;
                            if(a[i+"e"]<b[i+"e"]) return true;
                        }
                        return false})
                    response.send({stagerankings: stagerankings, rankingscount:rankingscount});
                }
            })
        }
    })

    app.post('/api/getallriderpoints',function(req,res){
        if(!req.user){
            res.redirect('/')
        }else{
            var pointsQuery = `SELECT rider_participation_id, concat(firstname, ' ', lastname) as name, team, SUM(stagescore) as stagescore, SUM(teamscore) as teamscore, SUM(totalscore) as totalscore FROM results_points
            INNER JOIN rider_participation USING (rider_participation_id)
            INNER JOIN rider USING(rider_id)
            WHERE race_id = $1
            GROUP BY name, team, rider_participation_id
            ORDER BY totalscore DESC`;
            var pointsValues = [req.body.race_id];
            console.log(req.user)
            var teamselectionQuery = ``

            var teamselectionValues = [req.user.account_id, 4];//$1,$2,$3
            var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = $1 AND race_id = $2)`;
            var teamselectionQuery = `SELECT rider_participation_id FROM team_selection_rider WHERE account_participation_id = ${account_participation_id}`;

            async.auto({
                teamselection: function(callback){
                    sqlDB.query(teamselectionQuery,teamselectionValues,(err,response)=>{
                        callback(err,response);
                    })
                },
                points: function(callback){
                    sqlDB.query(pointsQuery,pointsValues,(err,response)=>{
                        callback(err,response);
                    })
                }
            },function(err,results){
                if(err) throw err;
                res.send({overzicht: results.points.rows, teamselection: results.teamselection.rows})
            })

        }
    })


}