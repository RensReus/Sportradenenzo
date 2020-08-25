// load the things we need
var mongoose = require('mongoose');
const teamselection = require('../../../api/teamselection');

var raceSchema = mongoose.Schema({
  _id: Number,
  results_points: Array, //stage_id	rider_participation_id	stagepos	gcpos	pointspos	kompos	yocpos	stagescore	gcscore	pointsscore	komscore	yocscore	teamscore	totalscore	stageresult	gcresult	pointsresult	komresult	yocresult
  stage_selection_rider: Array, //stage_selection_id	rider_participation_id
  team_selection_rider: Array //rider_participation_id   account_participation_id
});

var race_backup = mongoose.model('race_backup', raceSchema);
module.exports = race_backup;