var  etappe1 = new Date('May 4, 2018 12:50:00');
var  etappe2 = new Date('May 5, 2018 12:50:00');
var  etappe3 = new Date('May 6, 2018 11:30:00');
var  etappe4 = new Date('May 8, 2018 12:15:00');
var  etappe5 = new Date('May 9, 2018 13:20:00');
var  etappe6 = new Date('May 10, 2018 12:50:00');
var  etappe7 = new Date('May 11, 2018 13:25:00');
var  etappe8 = new Date('May 12, 2018 11:55:00');
var  etappe9 = new Date('May 13, 2018 11:00:00');
var  etappe10 = new Date('May 15, 2018 10:55:00');
var  etappe11 = new Date('May 16, 2018 13:05:00');
var  etappe12 = new Date('May 17, 2018 12:05:00');
var  etappe13 = new Date('May 18, 2018 12:55:00');
var  etappe14 = new Date('May 19, 2018 11:50:00');
var  etappe15 = new Date('May 20, 2018 12:15:00');
var  etappe16 = new Date('May 22, 2018 13:20:00');
var  etappe17 = new Date('May 23, 2018 13:20:00');
var  etappe18 = new Date('May 24, 2018 12:00:00');
var  etappe19 = new Date('May 25, 2018 11:40:00');
var  etappe20 = new Date('May 26, 2018 10:10:00');
var  etappe21 = new Date('May 27, 2018 15:55:00');
var  etappetijden = [etappe1,etappe2,etappe3,etappe4,etappe5,etappe6,etappe7,etappe8,etappe9,etappe10,etappe11,etappe12,etappe13,etappe14,etappe15,etappe16,etappe17,etappe18,etappe19,etappe20,etappe21]

function currently(e){
    var currentTime = new Date(); //kijken wanneer we leven
    return e>currentTime;
}

function currentlyfinish(e){
    var currentTime = new Date();
    currentTime = currentTime.getTime() + (12*60*60*1000) //etappe finish met wat speling voor redirects
    return e>currentTime;
}

stageStart = function(et){ // voor de deadline display
    var day = etappetijden[et-1];
    return day.toDateString() + " " + day.toLocaleTimeString();
}

var etapstart  = etappetijden.findIndex(currently)+1; //huidige etappe start
var etapfinish = etappetijden.findIndex(currentlyfinish)+1 //huidige etappe finish

currentDisplay = function(){ //return de etappe om te weergeven 
    var now = new Date().getTime();
    for (i in etappetijden){
        if(now<etappetijden[0].getTime()){
            return 0; //voor de start van etappe 1 dus display teamselectie of et 1
        }
        if(now>etappetijden[i].getTime()){//als minder dan 12 uur na de start
            if(now<etappetijden[i].getTime()+12*60*60*1000){
                return (parseInt(i)+1); // return de recent gestartte etappe
            }
            else{ // niet binnen 12 uur
                return (parseInt(i)+2);// return de volgende etappe
            }
        }
        
    }
    return 22;// als er niks voldaan wordt return eindklassement
}

displayResults = function(etappe){
    var now = new Date().getTime();
    if(now>etappetijden[etappe-1]){// als na etappe start
        return true;//display results
    }
    return false;//display opstelling
}

module.exports.displayResults = displayResults;
module.exports.currentDisplay = currentDisplay;
exports.etapstart  = etapstart;
exports.etapfinish = etapfinish;
exports.girostart = etappe1;
exports.stageStart = stageStart;