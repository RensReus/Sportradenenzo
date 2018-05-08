// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({

    local           : {
        username    : String,
        email       : String,
        password    : String,
        admin       : {type: Boolean, default: false}
    },
    profieldata     : {
        favwieler   : {type: String, default: "Bram Tankink"},
        favclub     : {type: String, default: "De Bram Tankink Fanclub"},
        poulescore  : {type: Array, default: new Array(22).fill(0)},
        totaalscore : Number
    },
    teamselectie    : {
        userrenners : {type: Array, default: new Array(0).fill({'_id':String,'naam':String,'team':String,'prijs':Number})},
        geld        : {type: Number, default: 42000000}
    },
    opstellingen    : { type: Array, default: new Array(21).fill(
        {'kopman':String,'opstelling':{'_id':new Array(0),'naam':new Array(0)}})
    },
    userstats       : {
        prijzenkast : Array,
        punten      : Array
    },
    groups          :{
        budget      : {type: Boolean, default: false},
        poules      : Array
    }
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

var User = mongoose.model('User', userSchema); 
// create the model for users and expose it to our app
module.exports = User; //mongoose.model('User', userSchema);    