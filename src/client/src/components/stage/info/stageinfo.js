import { Component } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleLeft, faAngleRight, faMountain, faClock } from "@fortawesome/free-solid-svg-icons"; //Pijltjes next/prev stage  //Berg voor de stageprofielknop // add/remove riders
import ModalButton from '../../shared/modal';
import RulesPopup from '../../shared/RulesPopup';
import './stageinfo.css'


class stageInfo extends Component {
  handleChange = (e) => {
    this.props.updateStage(e.target.value);
  }
  starttimeString = (starttimeInput) => {
    if (starttimeInput === "") return "";
    var starttime = new Date(starttimeInput);
    var dayArray = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return dayArray[starttime.getDay()] + " " + starttime.toLocaleString().replace(/-[0-9]{4}/, '').replace(':00', '')
  }

  render() {
    // always
    var stageProfile = '';
    stageProfile = <div>
      <img className='profileImage' src={'/images/stageProfiles/' + this.props.data.race_id + '/stage-' + this.props.data.stage + '-profile.jpg'} alt="profile" />
      <br></br>
      finish
      <br></br>
      <img className='profileImage' src={'/images/stageProfiles/' + this.props.data.race_id + '/stage-' + this.props.data.stage + '-finish.jpg'} alt="finish" />
      <br></br>
      extra
      <br></br>
      <img className='profileImage' src={'/images/stageProfiles/' + this.props.data.race_id + '/stage-' + this.props.data.stage + '-extra.jpg'} alt="" />
    </div>
    let dropdown = [];
    for (let i = 0; i < 23; i++) {
      dropdown.push(<option value={i} key={i} className='stage_select_dropdown_option'>{i}</option>);
    }
    return (
      <div className="stageinfo-container space-y-4">
        <div className='flex items-center justify-center'>
          {(this.props.data.mode === 'selection' || this.props.data.stage !== 1) ?
            <button className="button_standard blue" onClick={() => this.props.updateStage(this.props.data.stage - 1)}>
              <FontAwesomeIcon icon={faAngleLeft} />
            </button>
            :
            <button className="button_standard gray disabled">
              <FontAwesomeIcon icon={faAngleLeft} />
            </button>
          }
          <select
            className='stage_select_dropdown'
            value={this.props.data.stage}
            name="stagenr"
            onChange={this.handleChange}>
            {dropdown}
          </select>
          {(this.props.data.stageType !== "FinalStandings" && this.props.data.stageType !== "") ?
            <button className="button_standard blue" onClick={() => this.props.updateStage(this.props.data.stage + 1)}>
              <FontAwesomeIcon icon={faAngleRight} />
            </button>
            :
            <button className="button_standard gray disabled">
              <FontAwesomeIcon icon={faAngleRight} />
            </button>
          }
        </div>

        <div className='m-auto'>
          {this.starttimeString(this.props.data.starttime)}

        </div>
        <div className='flex items-center space-x-24'>
          <ModalButton
            cssClassButton="button_standard blue"
            content="Profile "
            contentIcon={<FontAwesomeIcon icon={faMountain} />}
            modalContent={stageProfile}
          />
          <RulesPopup page={"stageSelection"} raceName={this.props.racename} />
        </div>
      </div>
    )
  }
}

export default stageInfo;