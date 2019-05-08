// In dit bestand staan alle calls die te maken hebben met het selecteren van het team voor een race

module.exports = function (app) {
    const async = require('async')
    const sqlDB = require('../db/sqlDB')
    const SQLread = require('../db/SQLread')
    const SQLwrite = require('../db/SQLwrite')
    const SQLscrape = require('../SQLscrape')

    app.post('/api/getridersandteam', function (req,res){
        if(!req.user){
            res.redirect('/')
        }else{
            async.auto({
                allRiders: function(callback){
                    SQLread.getAllRiders(req.body.race,req.body.year,callback)
                },
                userSelectionGewoon: function(callback){
                    SQLread.getTeamSelection(req.user.account_id,false,req.body.race,req.body.year,callback)
                },
                userSelectionBudget: function(callback){
                    SQLread.getTeamSelection(req.user.account_id,true,req.body.race,req.body.year,callback)
                },
                race: function(callback){
                    SQLread.getRace(req.body.race,req.body.year,callback)
                }
            },function(err,results){
                if(err) throw err;

                var IDsGewoon = [];
                var IDsBudget = [];
                var budgetGewoon = results.race.budget;   
                
                var budgetBudget = 11250000;
                for(var i=0;i<results.userSelectionGewoon.length;i++){
                    IDsGewoon.push(results.userSelectionGewoon[i].rider_participation_id)
                    budgetGewoon -= results.userSelectionGewoon[i].price
                }
                for(var i=0;i<results.userSelectionBudget.length;i++){
                    IDsBudget.push(results.userSelectionBudget[i].rider_participation_id)
                    budgetBudget -= results.userSelectionBudget[i].price
                }
                // var allRidersGewoon = results.allRiders.map(({name,team,price,rider_participation_id}) => {
                //     var allRidersGewoon = {};                    
                //     if(IDsGewoon.includes(rider_participation_id)){
                //         allRidersGewoon = {name, team, price, rider_participation_id, selected: 'selected'}
                //     }else{
                //         allRidersGewoon = {name, team, price, rider_participation_id, selected: 'unselected'}
                //     }
                //     return allRidersGewoon
                // });
                // var allRidersBudget = results.allRiders.map(({name,team,price,rider_participation_id}) => {
                //     var allRidersBudget = {};                    
                //     if(IDsBudget.includes(rider_participation_id)){
                //         allRidersBudget = {name, team, price, rider_participation_id, selected: 'selected'}
                //     }else{
                //         allRidersBudget = {name, team, price, rider_participation_id, selected: 'unselected'}
                //     }
                //     return allRidersBudget
                // });
                res.send({allRiders: results.allRiders,userSelectionGewoon: results.userSelectionGewoon,userSelectionBudget: results.userSelectionBudget, budgetGewoon: budgetGewoon, budgetBudget:budgetBudget})
            });
        }
    });

    app.post('/api/teamselectionadd', function (req, res) {
        if(!req.user){
            res.redirect('/')
        }else{
            var race_id = `(SELECT race_id FROM race WHERE name = '${req.body.race}' AND year = ${req.body.year})`;
            var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = ${req.user.account_id} AND race_id = ${race_id} AND budgetParticipation = ${req.body.budgetParticipation})`;
            var teamselection = `(SELECT rider_participation_id FROM team_selection_rider WHERE account_participation_id = ${account_participation_id})`;
            
            var riderQuery = `SELECT rider.firstname, rider.lastname, price, team, rider_participation_id FROM rider_participation
            INNER JOIN rider using(rider_id)
            WHERE rider_participation_id = ${req.body.rider_participation_id};\n`
            
            var teamselectionQuery = `SELECT rider.firstname, rider.lastname, price, team, rider_participation_id FROM rider_participation
                INNER JOIN rider using(rider_id)
                WHERE rider_participation_id IN ${teamselection};\n`;
            var budget = 11250000;
            var budgetQuery = `SELECT budget, race_id FROM race WHERE race_id = ${race_id}`

            var totalQuery = riderQuery + teamselectionQuery + budgetQuery;

            sqlDB.query(totalQuery,function(err,results){
                var start = Date.now()
                if(err) {console.log("query: ",totalQuery);throw err};
                if(!req.body.budgetParticipation){
                    budget = results[2].rows[0].budget;   
                }
                var ridersSameTeam = 0;
                for(var i=0;i<results[1].rows.length;i++){
                    budget -= results[1].rows[i].price
                    if(results[0].team === results[1].rows[i].team){
                        ridersSameTeam += 1;
                    }
                }
                if(results[1].rows.length>=20||budget<results[0].rows[0].price + (19-results[1].rows.length)*500000 || ridersSameTeam >= 4){
                    res.send(false)
                }else{
                    var query = `INSERT INTO team_selection_rider(rider_participation_id,account_participation_id)
                                VALUES(${req.body.rider_participation_id},${account_participation_id}) 
                                ON CONFLICT (account_participation_id, rider_participation_id) DO NOTHING`;
                    
                    sqlDB.query(query, (err, response) => {
                        if (err) throw err;
                        results[1].rows.push(results[0].rows[0])
                        var budgetLeft = results[2].rows[0].budget;   
                        if(req.body.budgetParticipation){
                            budgetLeft = 11250000;
                        }
                        for(var i=0;i<results[1].rows.length;i++){
                            budgetLeft -= results[1].rows[i].price;
                        }
                        res.send({userSelection: results[1].rows, budget: budgetLeft})
                    })
                }
            })
        }

    });

    app.post('/api/teamselectionaddclassics', function (req, res) {
        if(!req.user){
            res.redirect('/')
        }else{
            //Scrape de rider opnieuw om foute data te voorkomen
            SQLscrape.getRider(req.body.rider.pcsid.toLowerCase(), function(response){
                if(response==404){
                    res.send(false)
                }else{
                    async.auto({
                        rider_id: function(callback){
                            SQLwrite.addRiderToDatabase(
                                response.pcsid,
                                response.country,
                                response.firstName,
                                response.lastName,
                                response.initials,
                                callback
                            )
                        },
                        race: function(callback){
                            SQLread.getRace(
                                req.body.race,
                                req.body.year,
                                callback
                            )
                        }
                    },function(err,results){
                        if(err) throw err;
                        SQLwrite.addRiderToRace(
                            results.race.race_id,
                            results.rider_id,
                            req.body.price,
                            response.team,
                            function(err,reaction){
                                if(err) throw err;
                                SQLwrite.addRiderToSelection(
                                    reaction.rider_participation_id,
                                    req.user.account_id,
                                    results.race.race_id,
                                    function(err,finalResponse){
                                        if(err) throw err;
                                        res.send(finalResponse)
                                    }
                                )
                            }

                        )
                    })
                }
            });
        }       
    });

    app.post('/api/teamselectionremove', function (req, res) {
        if(!req.user){
            res.send(false)
            res.redirect('/')
        }else{
            var race_id = `(SELECT race_id FROM race WHERE name = '${req.body.race}' AND year = ${req.body.year})`;
            var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = ${req.user.account_id} AND race_id = ${race_id} AND budgetParticipation = ${req.body.budgetParticipation})`;
            var teamselection = `(SELECT rider_participation_id FROM team_selection_rider WHERE account_participation_id = ${account_participation_id})`;
            
            var removeQuery = `DELETE FROM team_selection_rider 
            WHERE account_participation_id = ${account_participation_id}
            AND rider_participation_id = ${req.body.rider_participation_id};\n`

            var teamselectionQuery = `SELECT rider.firstname, rider.lastname, price, team, rider_participation_id FROM rider_participation
                INNER JOIN rider using(rider_id)
                WHERE rider_participation_id IN ${teamselection};\n`;

            var budgetQuery = `SELECT budget, race_id FROM race WHERE race_id = ${race_id}`

            var totalQuery = removeQuery + teamselectionQuery + budgetQuery;
            console.log(totalQuery)

            sqlDB.query(totalQuery,function(err,results){
                if(err) throw err

                var budgetLeft = results[2].rows[0].budget;   
                if(req.body.budgetParticipation){
                    budgetLeft = 11250000;
                }
                for(var i=0;i<results[1].rows.length;i++){
                    budgetLeft -= results[1].rows[i].price;
                }
                res.send({userSelection: results[1].rows, budget: budgetLeft})
            })                
        }
    });

    //Voor klassiekerspel:
    app.post('/api/getuserteamselection', function (req,res){
        if(!req.user){
            res.redirect('/')
        }else{
            async.auto({
                userSelection: function(callback){
                    SQLread.getTeamSelection(req.user.account_id,req.body.race,req.body.year,callback)
                },
                race: function(callback){
                    SQLread.getRace(req.body.race,req.body.year,callback)
                }
            },function(err,results){
                if(err) throw err;
                //Bereken het budget
                var IDs = [];
                var budget = results.race.budget;       
                for(var i=0;i<results.userSelection.length;i++){
                    IDs.push(results.userSelection[i].rider_participation_id)
                    budget = budget - results.userSelection[i].price
                }
                console.log(results)
                res.send({userSelection: results.userSelection, budget: budget}) //{allRiders,userSelection}
            });
        }
    });

    //Haalt de data van een enkele renner van pcs
    app.post('/api/getrider', function(req, res){
        SQLscrape.getRider(req.body.pcsid, function(response){
            if(response==404){
                res.send(false)
            }else{
                res.send({rider: response})
            }
        });
    });
}