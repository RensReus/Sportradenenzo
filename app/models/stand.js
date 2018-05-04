var mongoose = require('mongoose');

var standSchema = mongoose.Schema({
    id      :   String,//etappe
    users   :   Array,//array met IDs om te zien welke score bij welke user hoort
    scores  : [
        {
        totaal   : number,//vooral deze is relevant
        dag      : number,
        ak       : number,
        sprint   : number,
        berg     : number,
        jong     : number,
        team     : {
            dag      : number,
            ak       : number,
            sprint   : number,
            berg     : number,
            jong     : number
        }
        }
    ]
});

var stand = mongoose.model('Stand', standSchema);
module.exports = stand;