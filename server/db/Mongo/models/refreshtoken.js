var mongoose = require('mongoose');

var refreshtokenSchema = mongoose.Schema({
    account_id      : Number,
    refreshString      : String
});

var refreshtoken = mongoose.model('refreshtoken', refreshtokenSchema); 
module.exports = refreshtoken;