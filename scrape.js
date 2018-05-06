const cheerio = require('cheerio');
const request = require('request');
const Renner = require('./app/models/renner');
const Etappe = require('./app/models/etappe');
const functies = require('./functies');
const fs = require('fs');

getStartlist = function(callback){
    var renners;
    fs.readFile('prijzen.txt', function(err, file) {
        var data = file.toString();
        var renners = data.split("\n");
        request('https://www.procyclingstats.com/race/giro-d-italia/2018/startlist', function (error, response, html) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(html);
            $(".black").each(function(index,element){ //gaat ieder team af
                var teamName = $( this ).text();
                $( this ).parent().children(".rider").each(function(index, element){ //gaat iedere renner af
                    var name = $(this).text();
                    var ID = $(this).attr('href').substring(6);
                    if($(this).siblings().eq(4*index + 4).attr("class")!=null){
                        var country = $(this).siblings().eq(4*index + 4).attr("class").split(' ')[1];
                    }
                    var prijs = 66666666;
                    for (i in renners){
                        var renprijs = renners[i].split(" :");
                        if(ID===renprijs[0]){
                            prijs = parseFloat(renprijs[1])*1e6;
                        }else{
                        }
                    }
                    if (prijs === 66666666)
                        console.log("% staat niet in Prijslijst",ID);
                    var rider = {_id : ID, naam : name, team : teamName, land : country, prijs : prijs};
                    Renner.findOne({'_id':ID}, function(err, renner){
                        if (err) throw err;
                        if (renner=="" || renner==null){
                            renner = new Renner(rider);
                        }else{
                            renner._id = ID;
                            renner.naam = name;
                            renner.team = teamName;
                            renner.land = country;
                            renner.prijs = prijs;
                        }
                        renner.save(function(err) {
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

getResult = function(et,callback){
    if(et==21){
        getFinal(callback);
        return;
    }
    request({url:'https://www.procyclingstats.com/race/giro-d-italia/2018/stage-' + et,
    headers: {"Connection": "keep-alive"}}, function (error, response, html) {
        Etappe.findOne({'_id':et}, function(err, etap){
            if (err) throw err;
            var etappe;
            var currentTime = new Date();
            currentTime = currentTime.getTime();
            if (etap=="" || etap==null){
                etappe = new Etappe({_id:et,creationTime:currentTime});
                console.log("nieuwe etappe " + et);
            }else{
                etappe = etap;
                etappe.creationTime = new Date().getTime();
                console.log("laad etappe " + et);
            }
            et = parseInt(et);
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(html);
                var teamWinners = new Array(5).fill("");
                var rennerWinners = new Array(5).fill("");
                var cases = new Array();
                $(".resTabnav").each(function(index,element){
                    cases.push($(this).attr("class").split(' ')[2]);
                })
                $(".basic").each(function(kl, element){//Slaat de teams en renner id van de dagwinnaar/klassementsleiders op
                    var end = $(this).children().eq(1).children().first().children().length;
                    if(end){
                        var klas = cases[kl];
                        switch(klas){
                            case 'stage'://Dag uitslag
                                teamWinners[klas] = $(this).children().eq(1).children().first().children().eq(2).children().eq(0).text();
                                rennerWinners[klas] = $(this).children().eq(1).children().first().children().eq(1).children().eq(1).attr('href').substring(6);
                                break;
                            case 'gc'://Algemeen Klassement
                                teamWinners[klas] = $(this).children().eq(1).children().first().children().eq(end-3).children().eq(0).text();
                                rennerWinners[klas] = $(this).children().eq(1).children().first().children().eq(end-4).children().eq(1).attr('href').substring(6)
                                break;
                            case 'points'://Sprinter Klassement
                                teamWinners[klas] = $(this).children().eq(1).children().first().children().eq(end-2).children().eq(0).text();
                                rennerWinners[klas] = $(this).children().eq(1).children().first().children().eq(end-3).children().eq(1).attr('href').substring(6)
                                break;
                            case 'youth'://Jongeren Klassement
                                teamWinners[klas] = $(this).children().eq(1).children().first().children().eq(end-2).children().eq(0).text();
                                rennerWinners[klas] = $(this).children().eq(1).children().first().children().eq(end-3).children().eq(1).attr('href').substring(6)
                                break;
                            case 'kom'://Berg Klassement
                                teamWinners[klas] = $(this).children().eq(1).children().first().children().eq(end-2).children().eq(0).text();
                                rennerWinners[klas] = $(this).children().eq(1).children().first().children().eq(end-3).children().eq(1).attr('href').substring(6)
                                break;
                        }
                    }
                });
                var rennersDag = new Array();
                var etappeDag = new Array();
                var rennersDNF = new Array();
                var etappeDNF = new Array();
                var rennersAk = new Array();
                var etappeAk = new Array();
                var rennersSprint = new Array();
                var etappeSprint = new Array();
                var rennersJong = new Array();
                var etappeJong = new Array();
                var rennersBerg = new Array();
                var etappeBerg = new Array();
                $(".basic").each(function(kl, element){//gaat alle klassementen af (dag,ak,sprint,jongeren,berg,team) en slaat op in arrays
                    var end = $(this).children().eq(1).children().first().children().length;
                    if(end){
                        var klas = cases[kl];
                        switch(klas){
                            case 'stage'://Dag uitslag
                            $(this).children().eq(1).children().each(function(index, element){//voor iedere renner in de uitslag
                                var pos = $(this).children().first().text();
                                if(pos =='DNS'||pos=='DNF'||pos=='NQ'||pos=='DSQ') pos=0;
                                pos = parseInt(pos);
                                var id = $(this).children().eq(1).children().eq(1).attr('href').substring(6);
                                var name = $(this).children().eq(1).children().eq(1).text();
                                if(!name.indexOf(" "))//als er een spatie is op plek nu verwijder spatie
                                    name = name.substring(1);
                                var teamName = $(this).children().eq(2).children().eq(0).text();
                                var time = $(this).children().eq(end-1).children().eq(0).text();
                                var etappeRenner = {_id : id, naam : name, team : teamName, tijd : time}
                                if(pos) {//doesn't add rider if pos==0
                                    rennersDag.push(id);
                                    etappeDag.push(etappeRenner);
                                }else{
                                    rennersDNF.push(id);
                                    etappeDNF.push(etappeRenner);
                                }
                            })
                            break;

                            case 'gc'://Algemeen Klassement
                            $(this).children().eq(1).children().each(function(index, element){//voor iedere renner in de uitslag
                                var id = $(this).children().eq(end-4).children().eq(1).attr('href').substring(6);
                                var name = $(this).children().eq(end-4).children().eq(1).text();
                                if(!name.indexOf(" "))//als er een spatie is op plek nu verwijder spatie
                                    name = name.substring(1);
                                var teamName = $(this).children().eq(end-3).children().eq(0).text();
                                var time = $(this).children().eq(end-1).children().eq(0).text();
                                var etappeRenner = {_id : id, naam : name, team : teamName, tijd : time}
                                rennersAk.push(id);
                                etappeAk.push(etappeRenner);
                            })   
                            break;

                            case 'points'://Sprinter Klassement
                            $(this).children().eq(1).children().each(function(index, element){//voor iedere renner in de uitslag
                                var id = $(this).children().eq(end-3).children().eq(1).attr('href').substring(6);
                                var name = $(this).children().eq(end-3).children().eq(1).text();
                                if(!name.indexOf(" "))//als er een spatie is op plek nu verwijder spatie
                                    name = name.substring(1);
                                var teamName = $(this).children().eq(end-2).children().eq(0).text();
                                var score = $(this).children().eq(end-1).text();
                                var etappeRenner = {_id : id, naam : name, team : teamName, score : score}
                                rennersSprint.push(id);
                                etappeSprint.push(etappeRenner);

                            })    
                            break;

                            case 'youth'://Jongeren Klassement
                            $(this).children().eq(1).children().each(function(index, element){//voor iedere renner in de uitslag
                                var id = $(this).children().eq(end-3).children().eq(1).attr('href').substring(6);
                                var name = $(this).children().eq(end-3).children().eq(1).text();
                                if(!name.indexOf(" "))//als er een spatie is op plek nu verwijder spatie
                                    name = name.substring(1);
                                var teamName = $(this).children().eq(end-2).children().eq(0).text();
                                var time = $(this).children().eq(end-1).children().eq(0).text();
                                var etappeRenner = {_id : id, naam : name, team : teamName, tijd : time}
                                rennersJong.push(id);
                                etappeJong.push(etappeRenner);
                            })    
                            break;

                            case 'kom'://Berg Klassement
                            $(this).children().eq(1).children().each(function(index, element){//voor iedere renner in de uitslag
                                var id = $(this).children().eq(end-3).children().eq(1).attr('href').substring(6);
                                var name = $(this).children().eq(end-3).children().eq(1).text();
                                if(!name.indexOf(" "))//als er een spatie is op plek nu verwijder spatie
                                    name = name.substring(1);
                                var teamName = $(this).children().eq(end-2).children().eq(0).text();
                                var score = $(this).children().eq(end-1).text();
                                var etappeRenner = {_id : id, naam : name, team : teamName, score : score}
                                rennersBerg.push(id);
                                etappeBerg.push(etappeRenner);
                            })
                            break;
                        }
                    }
                });
                Renner.find( { '_id':{$in: rennersDag}}, function(err,renners){
                    renners.forEach(function(renner,index){ //voeg uitslag toe aan renner element en de verzamelde punten
                        if (err) throw err;
                        var id = renner._id;
                        if (renner=="" || renner==null){
                            console.log('onbekende renner' + id);
                        }else{
                            //dag uitslag
                            var dagpos = rennersDag.indexOf(id)+1;
                            var dagpunten = getPunten('stage',dagpos);
                            renner.uitslagen.dag.set(et-1,dagpos);
                            renner.punten.dag.set(et-1,dagpunten);
                            if(renner.team===teamWinners['stage'] && dagpos!=1 && et!=1 && et!=16){
                                renner.punten.team.dag.set(et-1,10);
                            }else{
                                renner.punten.team.dag.set(et-1,0);
                            }

                            //AK
                            var akpos = rennersAk.indexOf(id)+1;
                            var akpunten = getPunten('gc',akpos);
                            renner.uitslagen.ak.set(et-1,akpos);
                            renner.punten.ak.set(et-1,akpunten);
                            if(renner.team===teamWinners['gc'] && akpos!=1){
                                renner.punten.team.ak.set(et-1,8);
                            }else{
                                renner.punten.team.ak.set(et-1,0);
                            }

                            //Sprint
                            var sprintpos = rennersSprint.indexOf(id)+1;
                            var sprintpunten = getPunten('points',sprintpos);
                            renner.uitslagen.sprint.set(et-1,sprintpos);
                            renner.punten.sprint.set(et-1,sprintpunten);
                            if(renner.team===teamWinners['points'] && sprintpos!=1){
                                renner.punten.team.sprint.set(et-1,6);
                            }else{
                                renner.punten.team.sprint.set(et-1,0);
                            }

                            //Jong
                            var jongpos = rennersJong.indexOf(id)+1;
                            var jongpunten = getPunten('youth',jongpos);
                            renner.uitslagen.jong.set(et-1,jongpos);
                            renner.punten.jong.set(et-1,jongpunten);
                            if(renner.team===teamWinners['youth'] && jongpos!=1){
                                renner.punten.team.jong.set(et-1,2);
                            }else{
                                renner.punten.team.jong.set(et-1,0);
                            }

                            //Berg
                            var bergpos = rennersBerg.indexOf(id)+1;
                            var bergpunten = getPunten('kom',bergpos);
                            renner.uitslagen.berg.set(et-1,bergpos);
                            renner.punten.berg.set(et-1,bergpunten);
                            if(renner.team===teamWinners['kom'] && bergpos!=1){
                                renner.punten.team.berg.set(et-1,3);
                            }else{
                                renner.punten.team.berg.set(et-1,0);
                            }

                            // set totals
                            renner.punten.team.totaal.set(et-1,renner.punten.team.dag[et-1] + renner.punten.team.ak[et-1] + renner.punten.team.sprint[et-1] + renner.punten.team.jong[et-1] + renner.punten.team.berg[et-1]);
                            renner.punten.totaal.set(et-1, dagpunten + akpunten + sprintpunten + jongpunten + bergpunten + renner.punten.team.totaal[et-1]);

                            renner.save(function(err,result) {
                                if (err) throw err;
                                if(index===rennersDag.length-1){// als laaste renner dan calculate user en continue code
                                    console.log("renners et: %s done",et);
                                    calculateUserScores(et);
                                    callback();
                                }
                            });
                        }
                    })
                    if(renners.length===0){ // zorgt dat callback wordt aangeroepen als er geen renners in de uitslag staan
                        calculateUserScores(et);
                        callback();
                    }
                });
            }
            etappe.uitslagen.dag = etappeDag;
            etappe.uitslagen.ak = etappeAk;
            etappe.uitslagen.sprint = etappeSprint;
            etappe.uitslagen.jong = etappeJong;
            etappe.uitslagen.berg = etappeBerg;
        
            etappe.markModified('uitslagen');
            etappe.save(function(err){
                if (err) throw err;
                console.log("uitslagen et: %s done",et);
            });
        });
    });
}


getFinal = function(callback){
    var et = 21;
    request({url:'https://www.procyclingstats.com/race/giro-d-italia/2018/stage-' + et,
    headers: {"Connection": "keep-alive"}}, function (error, response, html) {
        Etappe.findOne({'_id':et}, function(err, etap){
            if (err) throw err;
            var etappe;
            var currentTime = new Date();
            currentTime = currentTime.getTime();
            if (etap=="" || etap==null){
                etappe = new Etappe({_id:et,creationTime:currentTime});
                console.log("nieuwe etappe " + et);
            }else{
                etappe = etap;
                etappe.creationTime = new Date().getTime();
                console.log("laad etappe " + et);
            }
            et = parseInt(et);
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(html);
                var teamWinners = new Array(5).fill("");
                var rennerWinners = new Array(5).fill("");
                $(".resTabnav").each(function(index,element){
                    cases.push($(this).attr("class").split(' ')[2]);
                })
                $(".basic").each(function(kl, element){//Slaat de teams en renner id van de dagwinnaar/klassementsleiders op
                    var end = $(this).children().eq(1).children().first().children().length;
                    if(end){
                        var klas = cases[kl];
                        switch(klas){
                            case 'stage'://Dag uitslag
                                teamWinners[klas] = $(this).children().eq(1).children().first().children().eq(2).children().eq(0).text();
                                rennerWinners[klas] = $(this).children().eq(1).children().first().children().eq(1).children().eq(1).attr('href').substring(6);
                                break;
                            case 'gc'://Algemeen Klassement
                                teamWinners[klas] = $(this).children().eq(1).children().first().children().eq(end-4).children().eq(0).text();
                                rennerWinners[klas] = $(this).children().eq(1).children().first().children().eq(end-5).children().eq(1).attr('href').substring(6)
                                break;
                            case 'points'://Sprinter Klassement
                                teamWinners[klas] = $(this).children().eq(1).children().first().children().eq(end-3).children().eq(0).text();
                                rennerWinners[klas] = $(this).children().eq(1).children().first().children().eq(end-4).children().eq(1).attr('href').substring(6)
                                break;
                            case 'youth'://Jongeren Klassement
                                teamWinners[klas] = $(this).children().eq(1).children().first().children().eq(end-2).children().eq(0).text();
                                rennerWinners[klas] = $(this).children().eq(1).children().first().children().eq(end-3).children().eq(1).attr('href').substring(6)
                                break;
                            case 'kom'://Berg Klassement
                                teamWinners[klas] = $(this).children().eq(1).children().first().children().eq(end-3).children().eq(0).text();
                                rennerWinners[klas] = $(this).children().eq(1).children().first().children().eq(end-4).children().eq(1).attr('href').substring(6)
                                break;
                        }
                    }
                });
                var rennersDag = new Array();
                var etappeDag = new Array();
                var rennersDNF = new Array();
                var etappeDNF = new Array();
                var rennersAk = new Array();
                var etappeAk = new Array();
                var rennersSprint = new Array();
                var etappeSprint = new Array();
                var rennersJong = new Array();
                var etappeJong = new Array();
                var rennersBerg = new Array();
                var etappeBerg = new Array();
                $(".basic").each(function(kl, element){//gaat alle klassementen af (dag,ak,sprint,jongeren,berg,team) en slaat op in arrays
                    var end = $(this).children().eq(1).children().first().children().length;
                    if(end){
                        var klas = cases[kl];
                        switch(klas){
                            case 'stage'://Dag uitslag
                            $(this).children().eq(1).children().each(function(index, element){//voor iedere renner in de uitslag
                                var pos = $(this).children().first().text();
                                if(pos =='DNS'||pos=='DNF'||pos=='NQ'||pos=='DSQ') pos=0;
                                pos = parseInt(pos);
                                var id = $(this).children().eq(1).children().eq(1).attr('href').substring(6);
                                var name = $(this).children().eq(1).children().eq(1).text();
                                if(!name.indexOf(" "))//als er een spatie is op plek nu verwijder spatie
                                    name = name.substring(1);
                                var teamName = $(this).children().eq(2).children().eq(0).text();
                                var time = $(this).children().eq(end-1).children().eq(0).text();
                                var etappeRenner = {_id : id, naam : name, team : teamName, tijd : time}
                                if(pos) {//doesn't add rider if pos==0
                                    etappeDag.push(etappeRenner);
                                    rennersDag.push(id);
                                }else{
                                    rennersDNF.push(id);
                                    etappeDNF.push(etappeRenner);
                                }
                            })
                            break;

                            case 'gc'://Algemeen Klassement
                            $(this).children().eq(1).children().each(function(index, element){//voor iedere renner in de uitslag
                                var id = $(this).children().eq(end-5).children().eq(1).attr('href').substring(6);
                                var name = $(this).children().eq(end-5).children().eq(1).text();
                                if(!name.indexOf(" "))//als er een spatie is op plek nu verwijder spatie
                                    name = name.substring(1);
                                var teamName = $(this).children().eq(end-4).children().eq(0).text();
                                var time = $(this).children().eq(end-1).children().eq(0).text();
                                var etappeRenner = {_id : id, naam : name, team : teamName, tijd : time}
                                rennersAk.push(id);
                                etappeAk.push(etappeRenner);
                            })   
                            break;

                            case 'points'://Sprinter Klassement
                            $(this).children().eq(1).children().each(function(index, element){//voor iedere renner in de uitslag
                                var id = $(this).children().eq(end-4).children().eq(1).attr('href').substring(6);
                                var name = $(this).children().eq(end-4).children().eq(1).text();
                                if(!name.indexOf(" "))//als er een spatie is op plek nu verwijder spatie
                                    name = name.substring(1);
                                var teamName = $(this).children().eq(end-3).children().eq(0).text();
                                var score = $(this).children().eq(end-1).text();
                                var etappeRenner = {_id : id, naam : name, team : teamName, score : score}
                                rennersSprint.push(id);
                                etappeSprint.push(etappeRenner);
                            })    
                            break;

                            case 'youth'://Jongeren Klassement
                            $(this).children().eq(1).children().each(function(index, element){//voor iedere renner in de uitslag
                                var id = $(this).children().eq(end-3).children().eq(1).attr('href').substring(6);
                                var name = $(this).children().eq(end-3).children().eq(1).text();
                                if(!name.indexOf(" "))//als er een spatie is op plek nu verwijder spatie
                                    name = name.substring(1);
                                var teamName = $(this).children().eq(end-2).children().eq(0).text();
                                var time = $(this).children().eq(end-1).children().eq(0).text();
                                var etappeRenner = {_id : id, naam : name, team : teamName, tijd : time}
                                rennersJong.push(id);
                                etappeJong.push(etappeRenner);
                            })    
                            break;

                            case 'kom'://Berg Klassement
                            $(this).children().eq(1).children().each(function(index, element){//voor iedere renner in de uitslag
                                var id = $(this).children().eq(end-4).children().eq(1).attr('href').substring(6);
                                var name = $(this).children().eq(end-4).children().eq(1).text();
                                if(!name.indexOf(" "))//als er een spatie is op plek nu verwijder spatie
                                    name = name.substring(1);
                                var teamName = $(this).children().eq(end-3).children().eq(0).text();
                                var score = $(this).children().eq(end-1).text();
                                var etappeRenner = {_id : id, naam : name, team : teamName, score : score}
                                rennersBerg.push(id);
                                etappeBerg.push(etappeRenner);
                            })
                            break;
                        }
                    }
                });
               //voeg uitslag toe aan renner element
                Renner.find( { '_id':{$in: rennersDag}}, function(err,renners){
                    renners.forEach(function(renner,index){
                        if (err) throw err;
                        var id = renner._id;
                        if (renner=="" || renner==null){
                            console.log('onbekende renner' + id);
                        }else{
                            //dag uitslag
                            var dagpos = rennersDag.indexOf(id)+1;
                            var dagpunten = getPunten('stage',dagpos);
                            renner.uitslagen.dag.set(et-1,dagpos);
                            renner.punten.dag.set(et-1,dagpunten);
                            if(renner.team===teamWinners['stage'] && dagpos!=1){
                                renner.punten.team.dag.set(et-1,10);
                            }else{
                                renner.punten.team.dag.set(et-1,0);
                            }

                            //AK
                            var akpos = rennersAk.indexOf(id)+1;
                            var akpunten = getPunten('gc',akpos);
                            var akeindpunten = getEindPunten('gc',akpos);
                            renner.uitslagen.ak.set(et-1,akpos);
                            renner.punten.ak.set(et-1,akpunten);
                            renner.punten.ak.set(et,akeindpunten);
                            if(renner.team===teamWinners['gc'] && akpos!=1){
                                renner.punten.team.ak.set(et-1,8);
                                renner.punten.team.ak.set(et,24);
                            }else{
                                renner.punten.team.ak.set(et-1,0);
                                renner.punten.team.ak.set(et,0);
                            }

                            //Sprint
                            var sprintpos = rennersSprint.indexOf(id)+1;
                            var sprintpunten = getPunten('points',sprintpos);
                            var sprinteindpunten = getEindPunten('points',sprintpos);
                            renner.uitslagen.sprint.set(et-1,sprintpos);
                            renner.punten.sprint.set(et-1,sprintpunten);
                            renner.punten.sprint.set(et,sprinteindpunten);
                            if(renner.team===teamWinners['points'] && sprintpos!=1){
                                renner.punten.team.sprint.set(et-1,6);
                                renner.punten.team.sprint.set(et,18);
                            }else{
                                renner.punten.team.sprint.set(et-1,0);
                                renner.punten.team.sprint.set(et,0);
                            }

                            //Jong
                            var jongpos = rennersJong.indexOf(id)+1;
                            var jongpunten = getPunten('youth',jongpos);
                            var jongeindpunten = getEindPunten('youth',jongpos);
                            renner.uitslagen.jong.set(et-1,jongpos);
                            renner.punten.jong.set(et-1,jongpunten);
                            renner.punten.jong.set(et,jongeindpunten);
                            if(renner.team===teamWinners['youth'] && jongpos!=1){
                                renner.punten.team.jong.set(et-1,2);
                                renner.punten.team.jong.set(et,6);
                            }else{
                                renner.punten.team.jong.set(et-1,0);
                                renner.punten.team.jong.set(et,0);
                            }

                            //Berg
                            var bergpos = rennersBerg.indexOf(id)+1;
                            var bergpunten = getPunten('kom',bergpos);
                            var bergeindpunten = getEindPunten('kom',bergpos);
                            renner.uitslagen.berg.set(et-1,bergpos);
                            renner.punten.berg.set(et-1,bergpunten);
                            renner.punten.berg.set(et,bergeindpunten);
                            if(renner.team===teamWinners['kom'] && bergpos!=1){
                                renner.punten.team.berg.set(et-1,3);
                                renner.punten.team.berg.set(et,9);
                            }else{
                                renner.punten.team.berg.set(et-1,0);
                                renner.punten.team.berg.set(et,0);
                            }
                            
                            // set totals
                            renner.punten.team.totaal.set(et-1,renner.punten.team.dag[et-1] + renner.punten.team.ak[et-1] + renner.punten.team.sprint[et-1] + renner.punten.team.jong[et-1] + renner.punten.team.berg[et-1]);
                            renner.punten.team.totaal.set(et,renner.punten.team.ak[et] + renner.punten.team.sprint[et] + renner.punten.team.jong[et] + renner.punten.team.berg[et]);
                            renner.punten.totaal.set(et-1, dagpunten + akpunten + sprintpunten + jongpunten + bergpunten + renner.punten.team.totaal[et-1]);
                            renner.punten.totaal.set(et, akeindpunten + sprinteindpunten + jongeindpunten + bergeindpunten + renner.punten.team.totaal[et]);

                            renner.save(function(err,result) {
                                if (err) throw err;
                                if(index===rennersDag.length-1){// als laaste renner dan calculate user en continue code
                                    console.log("renners et: %s done",et);
                                    calculateUserScores(et);
                                    callback();
                                }
                            });
                        }
                    })
                });
            }
            etappe.uitslagen.dag = etappeDag;
            etappe.uitslagen.ak = etappeAk;
            etappe.uitslagen.sprint = etappeSprint;
            etappe.uitslagen.jong = etappeJong;
            etappe.uitslagen.berg = etappeBerg;
            etappe.markModified('uitslagen');
            etappe.save(function(err){
                if (err) throw err;
                console.log("uitslagen et: %s done",et); 
            });
        });
    });
}

getPunten = function(kl,pos){
    pos-=1;
    var dag = [50,44,40,36,32,30,28,26,24,22,20,18,16,14,12,10,8,6,4,2];
    var ak = [10,8,6,4,2];
    var punt = [8,6,4,2,1];
    var jong = [5,3,1];
    var berg = [6,4,3,2,1];
    if(pos<0) return 0;
    switch(kl){
        case 'stage'://dag
            if(pos<dag.length) return dag[pos];
            return 0;
        case 'gc'://ak
            if(pos<ak.length) return ak[pos];
            return 0;
        case 'points'://punt
            if(pos<punt.length) return punt[pos];
            return 0;
        case 'youth'://jong
            if(pos<jong.length) return jong[pos];
            return 0; 
        case 'kom'://berg
            if(pos<berg.length) return berg[pos];
            return 0;  
    }
}

getEindPunten = function(kl,pos){
    pos-=1;
    var ak = [100,80,60,50,40,36,32,28,24,22,20,18,16,14,12,10,8,6,4,2];
    var punt = [80,60,40,30,20,10,8,6,4,2];
    var jong = [50,30,20,10,5];
    var berg = [60,40,30,20,10];
    if(pos<0) return 0;
    switch(kl){
        case 'gc'://ak
            if(pos<ak.length) return ak[pos];
            return 0;
        case 'points'://punt
            if(pos<punt.length) return punt[pos];
            return 0;
        case 'youth'://jong
            if(pos<jong.length) return jong[pos];
            return 0; 
        case 'kom'://berg
            if(pos<berg.length) return berg[pos];
            return 0;  
    }
}

getPrijs = function(id){
    // var rawFile = new XMLHttpRequest();
    // rawFile.open("GET", "file:///D:/Documents/sportradenenzo/prijzen.txt", false);
    fs.readFile('prijzen.txt', function(err, file) {
        var data = file.toString();
        var renners = data.split("\n");
        for (i in renners){
            var renprijs = renners[i].split(" :");
            if(id===renprijs[0]){
                return parseFloat(renprijs[1])*1e6;
            }
        }
        console.log("% staat niet in Prijslijst",id);
        return 5000000
      });
}

module.exports.getStartlist = getStartlist;
module.exports.getResult = getResult;