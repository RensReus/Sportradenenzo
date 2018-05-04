const Renner = require('./app/models/renner');
var User = require('./app/models/user');

calculateUserScores = function(et){
    User.find({},function(err,users){
        users.forEach(function(user){//get all users
            var punten = 0;
            if(user.opstellingen[et-1].opstelling!=undefined){
                Renner.find( { '_id':{$in: user.opstellingen[et-1].opstelling._id}}, function(err,renners){// get all renners in opstelling
                    renners.forEach(function(renner,index){
                        if(user.groups.budget){// aparte budget score berekening
                            if(renner._id === user.opstellingen[et-1].kopman){//de niet teampunten gaan x1.5
                                punten += renner.punten.dag[et-1]*0.5+renner.punten.totaal[et-1]-renner.punten.team.totaal[et-1];
                            }else{//voor niet kopman
                                punten += renner.punten.totaal[et-1]-renner.punten.team.totaal[et-1];
                            };
                        }else{//gewone score
                            if(renner._id === user.opstellingen[et-1].kopman){//de niet teampunten gaan x1.5
                                punten += renner.punten.dag[et-1]*0.5+renner.punten.totaal[et-1];
                            }else{//voor niet kopman
                                punten += renner.punten.totaal[et-1];
                            };
                        }
                    });
                    user.profieldata.poulescore.set(et-1,punten);
                    user.save(function(err,result) {//save score
                        if (err) throw err;
                    });
                });
            };
        });  
    });
}

transferUsers = function(){
    User.find({},function(err,users){
        users.forEach(function(user){
            user.update( 
                {'groups.budget' : false },
                {multi:true}, 
                  function(err, numberAffected){  
                  });
        });
    });
}

module.exports.calculateUserScores = calculateUserScores;
module.exports.transferUsers = transferUsers;