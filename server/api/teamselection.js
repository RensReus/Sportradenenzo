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
                console.log("begin",budgetBudget)
                console.log(typeof(budgetBudget))
                for(var i=0;i<results.userSelectionGewoon.length;i++){
                    IDsGewoon.push(results.userSelectionGewoon[i].rider_participation_id)
                    budgetGewoon -= results.userSelectionGewoon[i].price
                console.log("update",budgetBudget)
                }
                for(var i=0;i<results.userSelectionBudget.length;i++){
                    IDsBudget.push(results.userSelectionBudget[i].rider_participation_id)
                    budgetBudget -= results.userSelectionBudget[i].price
                }
                var allRidersGewoon = results.allRiders.map(({name,team,price,rider_participation_id}) => {
                    var allRidersGewoon = {};                    
                    if(IDsGewoon.includes(rider_participation_id)){
                        allRidersGewoon = {name, team, price, rider_participation_id, selected: 'selected'}
                    }else{
                        allRidersGewoon = {name, team, price, rider_participation_id, selected: 'unselected'}
                    }
                    return allRidersGewoon
                });
                var allRidersBudget = results.allRiders.map(({name,team,price,rider_participation_id}) => {
                    var allRidersBudget = {};                    
                    if(IDsBudget.includes(rider_participation_id)){
                        allRidersBudget = {name, team, price, rider_participation_id, selected: 'selected'}
                    }else{
                        allRidersBudget = {name, team, price, rider_participation_id, selected: 'unselected'}
                    }
                    return allRidersBudget
                });
                console.log("end",budgetBudget)
                res.send({allRidersGewoon: allRidersGewoon,allRidersBudget: allRidersBudget,userSelectionGewoon: results.userSelectionGewoon,userSelectionBudget: results.userSelectionBudget, budgetGewoon: budgetGewoon, budgetBudget:budgetBudget})
            });
        }
    });

    app.post('/api/teamselectionadd', function (req, res) {
        if(!req.user){
            res.redirect('/')
        }else{
            async.auto({
                rider: function(callback){
                    SQLread.getRider(req.body.rider_participation_id,callback)
                },
                userSelection: function(callback){
                    SQLread.getTeamSelection(req.user.account_id,req.body.budget,req.body.race,req.body.year,callback)
                },
                race: function(callback){
                    SQLread.getRace(req.body.race,req.body.year,callback)
                }
            },function(err,results){
                if(err) throw err;
                var budget = results.race.budget;   
                for(var i=0;i<results.userSelection.length;i++){
                    budget = budget - results.userSelection.price
                }
                if(results.userSelection.length>=20||budget<results.rider.price + (20-results.userSelection.length)*500000 ){
                    res.send(false)
                }else{
                    async.auto({
                        rider: function(callback){
                            SQLwrite.addRiderToSelection(req.body.rider_participation_id,req.user.account_id,req.body.budget,results.race.race_id,callback)
                        }
                    },function(err){
                        if(err) throw err;
                        res.send(true)
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
        console.log("remove");
        console.log(req.body)
        if(!req.user){
            res.send(false)
            res.redirect('/')
        }else{
            SQLread.getRace(req.body.race,req.body.year,function(err,race){
                if(err) throw err
                SQLwrite.removeRiderFromSelection(req.user.account_id, req.body.rider_participation_id, req.body.budget, race.race_id,function(err,results){
                    if(err) throw err
                    res.send(true)
                })
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