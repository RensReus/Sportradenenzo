const Renner = require('./app/models/renner');
var User = require('./app/models/user');
const Etappe = require('./app/models/etappe');
calculateUserScores = function(et,callback){
    User.find({},function(err,users){
        users.forEach(function(user,index){//get all users
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
                    user.profieldata.totaalscore=user.profieldata.poulescore.reduce((a, b) => a + b);
                    user.save(function(err,result) {//save score
                        if (err) throw err;
                        if(index===users.length-1){// als laaste renner dan calculate user en continue code
                            callback();
                        }
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
                {'local.admin' : false },
                {multi:true}, 
                  function(err, numberAffected){  
                  });
        });
    });
}

transferEtappes = function(){
    Etappe.find({},function(err,etappes){
        etappes.forEach(function(etappe){
            etappe.update( 
                {'uitslagKompleet' : false },
                {multi:true}, 
                  function(err, numberAffected){  
                  });
        });
    });
}

transferRenners = function(){
    Renner.find({},function(err,renners){
        renners.forEach(function(renner){
            renner.update( 
                {'uitgevallen' : false },
                {multi:true}, 
                  function(err, numberAffected){  
                  });
        });
    });
}

module.exports.calculateUserScores = calculateUserScores;
module.exports.transferUsers = transferUsers;
module.exports.transferEtappes = transferEtappes;