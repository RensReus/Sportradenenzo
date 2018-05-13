const Renner = require('./app/models/renner');
var User = require('./app/models/user');
const Etappe = require('./app/models/etappe');
calculateUserScores = function (et, callback) {
    User.find({}, function (err, users) {
        if (err) throw err;
        users.forEach(function (user, index) {//get all users
            var punten = 0;
            if (user.opstellingen[et - 1].opstelling != undefined) {
                Renner.find({ '_id': { $in: user.opstellingen[et - 1].opstelling._id } }, function (err, renners) {// get all renners in opstelling
                    if (err) throw err;
                    renners.forEach(function (renner, index) {
                        if (user.groups.budget) {// aparte budget score berekening
                            if (renner._id === user.opstellingen[et - 1].kopman) {//de niet teampunten gaan x1.5
                                punten += renner.punten.dag[et - 1] * 0.5 + renner.punten.totaal[et - 1] - renner.punten.team.totaal[et - 1];
                            } else {//voor niet kopman
                                punten += renner.punten.totaal[et - 1] - renner.punten.team.totaal[et - 1];
                            };
                        } else {//gewone score
                            if (renner._id === user.opstellingen[et - 1].kopman) {//de niet teampunten gaan x1.5
                                punten += renner.punten.dag[et - 1] * 0.5 + renner.punten.totaal[et - 1];
                            } else {//voor niet kopman
                                punten += renner.punten.totaal[et - 1];
                            };
                        }
                    });
                    user.profieldata.poulescore.set(et - 1, punten);
                    user.profieldata.totaalscore = user.profieldata.poulescore.reduce((a, b) => a + b);
                    user.save(function (err, result) {//save score
                        if (err) throw err;
                        if (index === users.length - 1) {// als laaste renner dan calculate user en continue code
                            callback();
                        }
                    });
                });
            };
        });
    });
}

transferUsers = function () {
    User.find({}, function (err, users) {
        users.forEach(function (user) {
            user.update(
                { 'local.admin': false },
                { multi: true },
                function (err, numberAffected) {
                });
        });
    });
}

transferEtappes = function () {
    Etappe.find({}, function (err, etappes) {
        etappes.forEach(function (etappe) {
            etappe.update(
                { 'uitslagKompleet': false },
                { multi: true },
                function (err, numberAffected) {
                });
        });
    });
}

transferRenners = function () {
    Renner.find({}, function (err, renners) {
        renners.forEach(function (renner) {
            renner.update(
                { 'uitgevallen': false },
                { multi: true },
                function (err, numberAffected) {
                });
        });
    });
}

optimaleScoresUser = function (teamselectie, etappes, callback) {
    Renner.find({'_id': { $in: teamselectie }},function(err, renners){
        if (err) throw err;
        var punten = new Array(etappes).fill(0);
        for (var i = 0; i < etappes; i++) {
            // console.log("renners: " + renners.length);
            var totaalpunten = renners.map((renner, index) => ({index : index, punten : renner.punten.totaal[i]}));
            // console.log("totaal: " + totaalpunten.length);
            
            var dagpunten = renners.map((renner, index) => ({index : index, punten : renner.punten.dag[i]}));
            // console.log("dag: " + dagpunten.length);
            totaalpunten.sort(sortNumber);
            dagpunten.sort(sortNumber);
            //als de beste dag resultaten met kopmanpunten niet binnen de 9 beste renners dan
            for(var j = 0; j<9; j++){
                var bestedag = dagpunten[j].index;
                var positie = attrIndex(totaalpunten,'index',bestedag);
                if(positie < 8 ){// een van de 9 beste dag resultaten zit in de beste 9 totaal punten simpele som
                    punten[i] += dagpunten[j].punten*0.5;
                    for(var k = 0;k<9;k++){
                        punten[i]+=totaalpunten[k].punten;
                    }
                    break;
                }else if ((totaalpunten[positie].punten+0.5*dagpunten[j].punten)>totaalpunten[8].punten){
                    //neem de top 8 kwa totaal punten en de renner die door kopman bonus hoger komt dan nr 9
                    punten[i] += dagpunten[j].punten*0.5;
                    for(var k = 0;k<8;k++){
                        punten[i]+=totaalpunten[k].punten;
                    }
                    punten[i] += totaalpunten[positie].punten;
                    break;                   
                }
            }
            if(isNaN(punten[i]))
                punten[i]=0;
            if(punten[i]!=0)
                continue;
            // als geen van de 9 beste in de dag uitslag dan gewoon 
            for(var k = 0;k<9;k++){
                punten[i]+=totaalpunten[k].punten;
            }
            // moet nog 0.5*dagpunten voor de beste in de dag uitslag van deze groep maar deze code wordt wss nooit gerund 
            //en zelfs dan zal het wss toch 0 zij
        }
        callback(punten);
    })
}

function sortNumber(a,b) {
    return b.punten - a.punten;
}

function attrIndex(array, attr, value) {
    for(var i = 0; i < array.length; i += 1) {
        if(array[i][attr] === value) {
            return i;
        }
    }
    return -1;
}

module.exports.calculateUserScores = calculateUserScores;
module.exports.transferUsers = transferUsers;
module.exports.transferEtappes = transferEtappes;
module.exports.optimaleScoresUser = optimaleScoresUser;