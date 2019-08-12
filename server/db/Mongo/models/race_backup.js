// load the things we need
var mongoose = require('mongoose');

var raceSchema = mongoose.Schema({
    race_id     : Number,
    results_points  : Array, //stage_id	rider_participation_id	stagepos	gcpos	pointspos	kompos	yocpos	stagescore	gcscore	pointsscore	komscore	yocscore	teamscore	totalscore	stageresult	gcresult	pointsresult	komresult	yocresult
    stage_selection_rider: Array, //stage_selection_id	rider_participation_id
    rider_participation : Array //rider_participation_id(PRIMARY)	race_id	rider_id	price	dnf	team
});

var race_backup = mongoose.model('race_backup', raceSchema); 
module.exports = race_backup;