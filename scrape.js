const cheerio = require('cheerio');
const request = require('request');
const Renner = require('./app/models/renner');
const Etappe = require('./app/models/etappe');
const functies = require('./functies');
const fs = require('fs');
const schedule = require('node-schedule');
getStartlist = function (callback) {
    var renners;
    fs.readFile('prijzen.txt', function (err, file) {
        var data = file.toString();
        var renners = data.split("\n");
        request('https://www.procyclingstats.com/race/giro-d-italia/2018/startlist', function (error, response, html) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(html);
                $(".black").each(function (index, element) { //gaat ieder team af
                    var teamName = $(this).text();
                    $(this).parent().children(".rider").each(function (index, element) { //gaat iedere renner af
                        var name = $(this).text();
                        // sla achternaam voor naam en voorletters op
                        var lastname = $(this).children().first().text();
                        var voornaam = name.substring(lastname.length + 1);
                        var voornamen = voornaam.split(' ').filter(x => x);
                        var voorletters = "";
                        for (var i = 0; i < voornamen.length; i++) {
                            voorletters += voornamen[i].substring(0, 1) + ".";
                        }

                        var ID = $(this).attr('href').substring(6);
                        if ($(this).siblings().eq(4 * index + 4).attr("class") != null) {
                            var country = $(this).siblings().eq(4 * index + 4).attr("class").split(' ')[1];
                        }
                        var prijs = 66666666;
                        for (i in renners) {
                            var renprijs = renners[i].split(" :");
                            if (ID === renprijs[0]) {
                                prijs = parseFloat(renprijs[1]) * 1e6;
                            } else {
                            }
                        }
                        if (prijs === 66666666)
                            console.log("% staat niet in Prijslijst", ID);
                        var rider = { _id: ID, naam: name, team: teamName, land: country, prijs: prijs };
                        Renner.findOne({ '_id': ID }, function (err, renner) {
                            if (err) throw err;
                            if (renner == "" || renner == null) {
                                renner = new Renner(rider);
                            } else {
                                renner._id = ID;
                                renner.naam = name;
                                renner.team = teamName;
                                renner.land = country;
                                renner.prijs = prijs;
                                renner.voornaam = voornaam;
                                renner.voorletters = voorletters;
                                renner.achternaam = lastname;
                            }
                            // renner.update(
                                
                            //     { 'voornaam': voornaam, 'voorletters':voorletters,'achternaam':lastname },
                            //     { multi: true },
                            //     function (err, numberAffected) {
                            //         console.log("updated " + renner.naam)
                            //     }
                            // );
                            renner.save(function (err) {
                                if (err) throw err;
                            });
                        })
                    })
                });
                console.log("Loaded Startlist");
                callback();
            }
        });
    });

}

getResult = function (et, callback) {
    request({
        url: 'https://www.procyclingstats.com/race/giro-d-italia/2018/stage-' + et,
        headers: { "Connection": "keep-alive" }
    }, function (error, response, html) {
        var jongprev = new Array();
        var akprevlength = 176;
        if (et != 1) {
            Etappe.findOne({ '_id': et - 1 }, function (err, etap) {
                jongprev = etap.uitslagen.jong;
                akprevlength = etap.uitslagen.ak.length;
            })
        }
        Etappe.findOne({ '_id': et }, function (err, etap) {
            if (err) throw err;
            var etappe;
            var currentTime = new Date();
            currentTime = currentTime.getTime();
            if (etap == "" || etap == null) {
                etappe = new Etappe({ _id: et, creationTime: currentTime });
                console.log("nieuwe etappe " + et);
            } else {
                etappe = etap;
                etappe.creationTime = new Date().getTime();
                console.log("laad etappe " + et);
            }
            et = parseInt(et);
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(html);
                var teamWinners = new Array(5).fill("");
                var cases = new Array();
                $(".resTabnav").each(function (index, element) {
                    cases.push($(this).attr("class").split(' ')[2]);
                })
                if(!cases.length){
                    cases.push('stage');
                }
                $(".basic").each(function (kl, element) {//Slaat de teams en renner id van de dagwinnaar/klassementsleiders op
                    var end = $(this).children().eq(1).children().first().children().length;
                    var klas = cases[kl];
                    if (end && klas != 'teams') {
                        var columns = new Array();
                        $(this).children().first().children().first().children().each(function (index, element) {
                            columns.push($(this).text())
                        })
                        var teamCol = columns.indexOf("Team");
                        teamWinners[klas] = $(this).children().eq(1).children().first().children().eq(teamCol).children().eq(0).text();
                    }
                });
                var rennersDag = new Array();
                var rennersDNF = new Array();
                var rennersAk = new Array();
                var rennersSprint = new Array();
                var rennersJong = new Array();
                var rennersBerg = new Array();
                var etappeDag = new Array();
                var etappeDNF = new Array();
                var etappeAk = new Array();
                var etappeSprint = new Array();
                var etappeJong = new Array();
                var etappeBerg = new Array();
                $(".basic").each(function (kl, element) {//gaat alle klassementen af (dag,ak,sprint,jongeren,berg,team) en slaat op in arrays
                    var end = $(this).children().eq(1).children().first().children().length;
                    if (end && cases[kl] != 'teams') {
                        var klas = cases[kl];
                        var columns = new Array();
                        $(this).children().first().children().first().children().each(function (index, element) {
                            columns.push($(this).text())
                        })
                        var renCol = columns.indexOf("Rider");
                        var teamCol = columns.indexOf("Team");
                        $(this).children().eq(1).children().each(function (index, element) {//voor iedere renner in de uitslag
                            var id = $(this).children().eq(renCol).children().eq(1).attr('href').substring(6);
                            var name = $(this).children().eq(renCol).children().eq(1).text();
                            var lastname = $(this).children().eq(renCol).children().eq(1).children().first().text();
                            var voornaam = name.substring(lastname.length + 1);
                            var voornamen = voornaam.split(' ').filter(x => x);
                            var voorletters = "";
                            for (var i = 0; i < voornamen.length; i++) {
                                voorletters += voornamen[i].substring(0, 1) + ".";
                            }          
                            name = lastname + " " + voorletters;
                            console.log(name);
                            var teamName = $(this).children().eq(teamCol).children().eq(0).text();
                            var timeCol = columns.indexOf('Time');
                            var pntCol = columns.indexOf('Pnt');
                            switch (klas) {
                                case 'stage'://Dag uitslag
                                    var pos = $(this).children().first().text();
                                    pos = parseInt(pos);
                                    if (isNaN(pos)) pos = 0; //als DNF enzo
                                    var time = $(this).children().eq(timeCol).children().eq(0).text();
                                    var etappeRenner = { _id: id, naam: name, team: teamName, tijd: time }
                                    if (pos) {//doesn't add rider if pos==0
                                        rennersDag.push(id);
                                        etappeDag.push(etappeRenner);
                                    } else {
                                        rennersDNF.push(id);
                                        etappeDNF.push(etappeRenner);
                                    }
                                    break;

                                case 'gc'://Algemeen Klassement
                                    var time = $(this).children().eq(timeCol).children().eq(0).text();
                                    var etappeRenner = { _id: id, naam: name, team: teamName, tijd: time }
                                    rennersAk.push(id);
                                    etappeAk.push(etappeRenner);
                                    break;

                                case 'points'://Sprinter Klassement
                                    var score = $(this).children().eq(pntCol).text();
                                    var etappeRenner = { _id: id, naam: name, team: teamName, score: score }
                                    rennersSprint.push(id);
                                    etappeSprint.push(etappeRenner);
                                    break;

                                case 'youth'://Jongeren Klassement
                                    var time = $(this).children().eq(timeCol).children().eq(0).text();
                                    var etappeRenner = { _id: id, naam: name, team: teamName, tijd: time }
                                    rennersJong.push(id);
                                    etappeJong.push(etappeRenner);
                                    break;

                                case 'kom'://Berg Klassement
                                    var score = $(this).children().eq(pntCol).text();
                                    var etappeRenner = { _id: id, naam: name, team: teamName, score: score }
                                    rennersBerg.push(id);
                                    etappeBerg.push(etappeRenner);
                                    break;
                            }
                        })
                    }
                });
                //set renners als uitgevallen
                Renner.find({ '_id': { $in: rennersDNF } }, function (err, renners) {// set uitgevallen to true 
                    renners.forEach(function (renner, index) {
                        renner.uitgevallen = true;
                        renner.markModified;
                        renner.save(function (err, result) {
                            if (err) throw err;
                        });
                    })
                })
                ////////// check of resultaten compleet zijn
                var jongDNF = 0;
                for (i in rennersDNF) {
                    if (jongprev.map(jongren => jongren._id).includes(rennersDNF[i]))
                        jongDNF++;
                }
                var uitslagKompleet = false;
                var akKomp = rennersAk.length + rennersDNF.length == akprevlength;
                var sprintKomp = rennersSprint.length;
                var bergKomp = rennersBerg.length;
                var jongKomp = rennersJong.length + jongDNF == jongprev.length;
                if (et == 1) { jongKomp = true; bergKomp = true; }
                if (akKomp && sprintKomp && bergKomp && jongKomp) {
                    uitslagKompleet = true;
                }
                //////////
                var GTfinished = false;
                if (et == 21) GTfinished = true; // laatste etappe 
                console.log("rennersdag length: " + rennersDag.length);

                Renner.find({ '_id': { $in: rennersDag } }, function (err, renners) {
                    renners.forEach(function (renner, index) { //voeg uitslag toe aan renner element en de verzamelde punten
                        if (err) throw err;
                        var id = renner._id;
                        if (renner == "" || renner == null) {
                            console.log('onbekende renner' + id);
                        } else {
                            //dag uitslag
                            var dagpos = rennersDag.indexOf(id) + 1; // positie in de uitslag
                            var dagpunten = getPunten('stage', dagpos); // dagpunten worden berekend
                            renner.uitslagen.dag.set(et - 1, dagpos); // positie wordt in de renner
                            renner.punten.dag.set(et - 1, dagpunten); // punten in de renner opgeslagen
                            if (renner.team === teamWinners['stage'] && dagpos != 1 && et != 1 && et != 16) {// teampunten
                                renner.punten.team.dag.set(et - 1, 10);
                            } else {//geen teampunten, op 0 gezet indien het een keer fout gegaan is
                                renner.punten.team.dag.set(et - 1, 0);
                            }

                            //AK voor uitleg zie dag uitslag
                            var akpos = rennersAk.indexOf(id) + 1;
                            var akpunten = getPunten('gc', akpos);
                            renner.uitslagen.ak.set(et - 1, akpos);
                            renner.punten.ak.set(et - 1, akpunten);
                            if (GTfinished) renner.punten.ak.set(et, getEindPunten('gc', akpos)); //alleen doen als het de laatste etappe is en de eindklassement punten berekend moeten worden
                            if (renner.team === teamWinners['gc'] && akpos != 1) {
                                renner.punten.team.ak.set(et - 1, 8);
                                if (GTfinished) renner.punten.team.ak.set(et, 24); //alleen doen als het de laatste etappe is en de eindklassement punten berekend moeten worden
                            } else {
                                renner.punten.team.ak.set(et - 1, 0);
                                if (GTfinished) renner.punten.team.ak.set(et, 0); //alleen doen als het de laatste etappe is en de eindklassement punten berekend moeten worden
                            }

                            //Sprint voor uitleg zie dag uitslag
                            var sprintpos = rennersSprint.indexOf(id) + 1;
                            var sprintpunten = getPunten('points', sprintpos);
                            renner.uitslagen.sprint.set(et - 1, sprintpos);
                            renner.punten.sprint.set(et - 1, sprintpunten);
                            if (GTfinished) renner.punten.sprint.set(et, getEindPunten('points', sprintpos)); //alleen doen als het de laatste etappe is en de eindklassement punten berekend moeten worden
                            if (renner.team === teamWinners['points'] && sprintpos != 1) {
                                renner.punten.team.sprint.set(et - 1, 6);
                                if (GTfinished) renner.punten.team.sprint.set(et, 18); //alleen doen als het de laatste etappe is en de eindklassement punten berekend moeten worden
                            } else {
                                renner.punten.team.sprint.set(et - 1, 0);
                                if (GTfinished) renner.punten.team.sprint.set(et, 0); //alleen doen als het de laatste etappe is en de eindklassement punten berekend moeten worden
                            }

                            //Jong voor uitleg zie dag uitslag
                            var jongpos = rennersJong.indexOf(id) + 1;
                            var jongpunten = getPunten('youth', jongpos);
                            renner.uitslagen.jong.set(et - 1, jongpos);
                            renner.punten.jong.set(et - 1, jongpunten);
                            if (GTfinished) renner.punten.jong.set(et, getEindPunten('youth', jongpos)); //alleen doen als het de laatste etappe is en de eindklassement punten berekend moeten worden
                            if (renner.team === teamWinners['youth'] && jongpos != 1) {
                                renner.punten.team.jong.set(et - 1, 2);
                                if (GTfinished) renner.punten.team.jong.set(et, 6); //alleen doen als het de laatste etappe is en de eindklassement punten berekend moeten worden
                            } else {
                                renner.punten.team.jong.set(et - 1, 0);
                                if (GTfinished) renner.punten.team.jong.set(et, 0); //alleen doen als het de laatste etappe is en de eindklassement punten berekend moeten worden
                            }

                            //Berg voor uitleg zie dag uitslag
                            var bergpos = rennersBerg.indexOf(id) + 1;
                            var bergpunten = getPunten('kom', bergpos);
                            renner.uitslagen.berg.set(et - 1, bergpos);
                            renner.punten.berg.set(et - 1, bergpunten);
                            if (GTfinished) renner.punten.berg.set(et, getEindPunten('kom', bergpos)); //alleen doen als het de laatste etappe is en de eindklassement punten berekend moeten worden
                            if (renner.team === teamWinners['kom'] && bergpos != 1) {
                                renner.punten.team.berg.set(et - 1, 3);
                                if (GTfinished) renner.punten.team.berg.set(et, 9); //alleen doen als het de laatste etappe is en de eindklassement punten berekend moeten worden
                            } else {
                                renner.punten.team.berg.set(et - 1, 0);
                                if (GTfinished) renner.punten.team.berg.set(et, 0); //alleen doen als het de laatste etappe is en de eindklassement punten berekend moeten worden
                            }

                            // set totals
                            renner.punten.team.totaal.set(et - 1, renner.punten.team.dag[et - 1] + renner.punten.team.ak[et - 1] + renner.punten.team.sprint[et - 1] + renner.punten.team.jong[et - 1] + renner.punten.team.berg[et - 1]);
                            renner.punten.totaal.set(et - 1, dagpunten + akpunten + sprintpunten + jongpunten + bergpunten + renner.punten.team.totaal[et - 1]);
                            if (GTfinished) { // alleen relevant voor de laatste etappe
                                renner.punten.team.totaal.set(et, renner.punten.team.ak[et] + renner.punten.team.sprint[et] + renner.punten.team.jong[et] + renner.punten.team.berg[et]);
                                renner.punten.totaal.set(et, akeindpunten + sprinteindpunten + jongeindpunten + bergeindpunten + renner.punten.team.totaal[et]);
                            }
                            renner.save(function (err, result) {
                                if (err) throw err;
                                if (index === rennersDag.length - 1) {// als laaste renner dan calculate user en continue code
                                    console.log("renners et: %s done", et);
                                    calculateUserScores(et, function () {
                                        callback();
                                    });
                                }
                            });
                        }
                    })
                    if (renners.length === 0) { // zorgt dat callback wordt aangeroepen als er geen renners in de uitslag staan
                        calculateUserScores(et, function () {
                            callback();
                        });
                    }
                });
            }
            etappe.uitslagen.dag = etappeDag;
            etappe.uitslagen.ak = etappeAk;
            etappe.uitslagen.sprint = etappeSprint;
            etappe.uitslagen.jong = etappeJong;
            etappe.uitslagen.berg = etappeBerg;
            etappe.uitslagKompleet = uitslagKompleet;
            etappe.markModified('uitslagen');
            etappe.save(function (err) {
                if (err) throw err;
                console.log("uitslagen et: %s done", et);
            });
        });
    });
}



getPunten = function (kl, pos) {
    pos -= 1;
    var dag = [50, 44, 40, 36, 32, 30, 28, 26, 24, 22, 20, 18, 16, 14, 12, 10, 8, 6, 4, 2];
    var ak = [10, 8, 6, 4, 2];
    var punt = [8, 6, 4, 2, 1];
    var jong = [5, 3, 1];
    var berg = [6, 4, 3, 2, 1];
    if (pos < 0) return 0;
    switch (kl) {
        case 'stage'://dag
            if (pos < dag.length) return dag[pos];
            return 0;
        case 'gc'://ak
            if (pos < ak.length) return ak[pos];
            return 0;
        case 'points'://punt
            if (pos < punt.length) return punt[pos];
            return 0;
        case 'youth'://jong
            if (pos < jong.length) return jong[pos];
            return 0;
        case 'kom'://berg
            if (pos < berg.length) return berg[pos];
            return 0;
    }
}

getEindPunten = function (kl, pos) {
    pos -= 1;
    var ak = [100, 80, 60, 50, 40, 36, 32, 28, 24, 22, 20, 18, 16, 14, 12, 10, 8, 6, 4, 2];
    var punt = [80, 60, 40, 30, 20, 10, 8, 6, 4, 2];
    var jong = [50, 30, 20, 10, 5];
    var berg = [60, 40, 30, 20, 10];
    if (pos < 0) return 0;
    switch (kl) {
        case 'gc'://ak
            if (pos < ak.length) return ak[pos];
            return 0;
        case 'points'://punt
            if (pos < punt.length) return punt[pos];
            return 0;
        case 'youth'://jong
            if (pos < jong.length) return jong[pos];
            return 0;
        case 'kom'://berg
            if (pos < berg.length) return berg[pos];
            return 0;
    }
}

getPrijs = function (id) {
    // var rawFile = new XMLHttpRequest();
    // rawFile.open("GET", "file:///D:/Documents/sportradenenzo/prijzen.txt", false);
    fs.readFile('prijzen.txt', function (err, file) {
        var data = file.toString();
        var renners = data.split("\n");
        for (i in renners) {
            var renprijs = renners[i].split(" :");
            if (id === renprijs[0]) {
                return parseFloat(renprijs[1]) * 1e6;
            }
        }
        console.log("% staat niet in Prijslijst", id);
        return 5000000
    });
}

getTimetoFinish = function (callback) {
    request({
        url: 'https://www.procyclingstats.com/',
        headers: { "Connection": "keep-alive" }
    }, function (error, response, html) {
        var $ = cheerio.load(html);
        var rule = new schedule.RecurrenceRule()
        var finished = false;
        var girobeschikbaar = false;
        
        $(".ind_td").first().children().eq(1).children().each(function () {
            if ($(this).children().eq(2).text().startsWith('Giro d')) { // voor de giro
                girobeschikbaar = true;
                if ($(this).children().eq(5).text() != 'finished') {
                    var timeRemaining = $(this).children().eq(0).text();
                    if (timeRemaining[timeRemaining.length - 1] == 'm' || timeRemaining[0] == 1) { // als nog een uur of minder
                        rule.minute = new schedule.Range(0, 59, 5); // iedere 5 min checken
                        callback([finished, rule]);
                        return;
                    } else {
                        rule.minute = 7; // ieder uur als finish nog ver weg
                        callback([finished, rule]);
                        return;
                        
                    }

                } else {//als gefinisht
                    rule.minute = new schedule.Range(0, 59, 1); // iedere minuut checken
                    finished = true;
                    callback([finished, rule]);
                    return;
                }
            }
        });
        if(!girobeschikbaar){
        rule.minute = 7;
        callback([finished, rule]);
        return;
        }
    });


}

module.exports.getStartlist = getStartlist;
module.exports.getResult = getResult;
module.exports.getTimetoFinish = getTimetoFinish;