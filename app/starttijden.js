var etappe1 = new Date('August 25, 2018 17:26:00');
var etappe2 = new Date('August 26, 2018 13:35:00');
var etappe3 = new Date('August 27, 2018 13:06:00');
var etappe4 = new Date('August 28, 2018 13:19:00');
var etappe5 = new Date('August 29, 2018 12:34:00');
var etappe6 = new Date('August 30, 2018 13:58:00');
var etappe7 = new Date('August 31, 2018 13:02:00');
var etappe8 = new Date('September 1, 2018 12:28:00');
var etappe9 = new Date('September 2, 2018 12:06:00');
var etappe10 = new Date('September 4, 2018 13:21:00');
var etappe11 = new Date('September 5, 2018 12:04:00');
var etappe12 = new Date('September 6, 2018 12:55:00');
var etappe13 = new Date('September 7, 2018 12:57:00');
var etappe14 = new Date('September 8, 2018 12:55:00');
var etappe15 = new Date('September 9, 2018 12:44:00');
var etappe16 = new Date('September 11, 2018 14:06:00');
var etappe17 = new Date('September 12, 2018 13:26:00');
var etappe18 = new Date('September 13, 2018 13:08:00');
var etappe19 = new Date('September 14, 2018 13:30:00');
var etappe20 = new Date('September 15, 2018 14:54:00');
var etappe21 = new Date('September 16, 2018 17:15:00');
var etappetijden = [etappe1, etappe2, etappe3, etappe4, etappe5, etappe6, etappe7, etappe8, etappe9, etappe10, etappe11, etappe12, etappe13, etappe14, etappe15, etappe16, etappe17, etappe18, etappe19, etappe20, etappe21]

const Etappe = require('./models/etappe');

function currently(e) {
    var currentTime = new Date(); //kijken wanneer we leven
    return e > currentTime;
}

function currentlyfinish(e) {
    var currentTime = new Date();
    currentTime = currentTime.getTime() + (12 * 60 * 60 * 1000) //etappe finish met wat speling voor redirects
    return e > currentTime;
}

stageStart = function (et) { // voor de deadline display
    var day = etappetijden[et - 1];
    return day.toDateString() + " " + day.toLocaleTimeString();
}

var etapstart = etappetijden.findIndex(currently) + 1; //huidige etappe start
var etapfinish = etappetijden.findIndex(currentlyfinish) + 1 //huidige etappe finish

currentDisplay = function () { //return de etappe om te weergeven 
    var now = parseInt(new Date().getTime());
    for (var i = etappetijden.length - 1; i > -1; i--) {
        if (now < parseInt(etappetijden[0].getTime())) {
            return 0; //voor de start van etappe 1 dus display teamselectie of et 1
        }
        if (now > parseInt(etappetijden[i].getTime())) {//als minder dan 12 uur na de start
            if (now < (parseInt(etappetijden[i].getTime()) + 12 * 60 * 60 * 1000)) {
                return (i + 1); // return de recent gestartte etappe
            } else { // niet binnen 12 uur
                return (i + 2);// return de volgende etappe
            }
        }

    }
    return 22;// als er niks voldaan wordt return eindklassement
}

recentFinish = function () {
    var et = currentDisplay();
    Etappe.findOne({ '_id': et }, function (err, etap) {
        if (err) throw err;
        if (etap.uitslagKompleet) {
            return et;
        } else {
            return (et - 1);
        }
    });
}

displayResults = etappe => new Date() > etappetijden[etappe - 1];


module.exports.displayResults = displayResults;
module.exports.currentDisplay = currentDisplay;
exports.etappetijden = etappetijden;
exports.etapstart = etapstart;
exports.etapfinish = etapfinish;
exports.girostart = etappe1;
exports.stageStart = stageStart;
exports.recentFinish = recentFinish;