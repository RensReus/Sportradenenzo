var mongoose = require('mongoose');

var rennerSchema = mongoose.Schema({
    _id         : String,
    naam        : String,
    team        : String,
    land        : String,
    prijs       : Number,
    uitgevallen : {type: Boolean, default: false},
    uitslagen   : {
        dag      : { type: Array, default: new Array(21).fill(0) },
        ak       : { type: Array, default: new Array(21).fill(0) },
        sprint   : { type: Array, default: new Array(21).fill(0) },
        berg     : { type: Array, default: new Array(21).fill(0) },
        jong     : { type: Array, default: new Array(21).fill(0) }
    },
    punten       : {
        totaal   : { type: Array, default: new Array(22).fill(0) },       
        dag      : { type: Array, default: new Array(21).fill(0) },
        ak       : { type: Array, default: new Array(22).fill(0) },
        sprint   : { type: Array, default: new Array(22).fill(0) },
        berg     : { type: Array, default: new Array(22).fill(0) },
        jong     : { type: Array, default: new Array(22).fill(0) },
        team     : {
            totaal   : { type: Array, default: new Array(22).fill(0) },       
            dag      : { type: Array, default: new Array(21).fill(0) }, 
            ak       : { type: Array, default: new Array(22).fill(0) },
            sprint   : { type: Array, default: new Array(22).fill(0) },
            berg     : { type: Array, default: new Array(22).fill(0) },
            jong     : { type: Array, default: new Array(22).fill(0) }
        }
    }
});

returnPuntenTotaal = function(et){
    var punten = punten.dag + punten.ak + punten.sprint + punten.berg + punten.jong + punten.team.dag + punten.team.ak + punten.team.sprint + punten.team.berg + punten.team.jong;
}
var renner = mongoose.model('Renner', rennerSchema);
module.exports = renner;