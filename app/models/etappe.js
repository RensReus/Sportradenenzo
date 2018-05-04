var mongoose = require('mongoose');

var etappeSchema = mongoose.Schema({
    _id             : String,
    creationTime    : Number,
    uitslagen       : 
    {
        dag      : [{_id: String,naam: String,team: String,tijd  : String}],
        ak       : [{_id: String,naam: String,team: String,tijd  : String}],
        sprint   : [{_id: String,naam: String,team: String,score : String}],
        berg     : [{_id: String,naam: String,team: String,score : String}],
        jong     : [{_id: String,naam: String,team: String,tijd  : String}]
    }
});

var etappe = mongoose.model('Etappe', etappeSchema);
module.exports = etappe;