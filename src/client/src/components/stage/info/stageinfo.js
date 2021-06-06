import { Component } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleLeft, faAngleRight, faMountain, faClock } from "@fortawesome/free-solid-svg-icons"; //Pijltjes next/prev stage  //Berg voor de stageprofielknop // add/remove riders
import BudgetSwitchButton from '../../shared/budgetSwitchButton';
import ModalButton from '../../shared/modal';
const jwtDecode = require('jwt-decode');


class stageInfo extends Component {
  constructor() {
    super();
    this.handleChange = this.handleChange.bind(this);
  }
  handleChange(e) {
    this.props.functions.getStage(e.target.value);
  }
  render() {
    // always
    var stageProfile = '';
    stageProfile = <div>
      <img className='profileImage' src={'/images/stageProfiles/' + this.props.data.race_id + '/stage-' + this.props.data.stage + '-profile.jpg'} alt="profile" />
      <br></br>
      finish
      <br></br>
      <img className='profileImage' src={'/images/stageProfiles/' + this.props.data.race_id + '/stage-' + this.props.data.stage + '-finish.jpg'} alt="" />
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
      <div className="flex flex-col space-y-3 w-full sm:w-96 p-4 border-2 border-solid border-blue-200 rounded-md">
        <div className='flex items-center justify-center'>
          {(this.props.data.mode === 'selection' || this.props.data.stage !== 1) ?
            <button className="button_standard blue" onClick={() => this.props.functions.getStage(this.props.data.stage - 1)}>
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
            <button className="button_standard blue" onClick={() => this.props.functions.getStage(this.props.data.stage + 1)}>
              <FontAwesomeIcon icon={faAngleRight} />
            </button>
            :
            <button className="button_standard gray disabled">
              <FontAwesomeIcon icon={faAngleRight} />
            </button>
          }
        </div>
        
        <div className='m-auto'>
            {this.props.functions.starttimeString(this.props.data.starttime)}
          
        </div>
        <div className='flex items-center'>
        {jwtDecode(localStorage.getItem('authToken')).account_id<5?
          <div className='mr-4'>
            <BudgetSwitchButton budget={this.props.data.budget} budgetSwitch={this.props.functions.budgetSwitch} />
          </div>
          :<></>
          }
        <ModalButton
          cssClassButton="button_standard blue"
          content="Profile "
          contentIcon={<FontAwesomeIcon icon={faMountain} />}
          modalContent={stageProfile}
        />
        </div>
      </div>
    )
  }
}

export default stageInfo;