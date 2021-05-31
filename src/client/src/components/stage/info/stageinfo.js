import { Component } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleLeft, faAngleRight, faMountain } from "@fortawesome/free-solid-svg-icons"; //Pijltjes next/prev stage  //Berg voor de stageprofielknop // add/remove riders
import BudgetSwitchButton from '../../shared/budgetSwitchButton';
import ModalButton from '../../shared/modal';
import '../../css/buttons.css';


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
      <div className="border-2 border-solid">
        <div className='flex items-center'>
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
        <BudgetSwitchButton budget={this.props.data.budget} budgetSwitch={this.props.functions.budgetSwitch} />
        <ModalButton
          cssClassButton="button_standard blue"
          content="Profile "
          contentIcon={<FontAwesomeIcon icon={faMountain} />}
          modalContent={stageProfile}
        />
      </div>
    )
  }
}

export default stageInfo;