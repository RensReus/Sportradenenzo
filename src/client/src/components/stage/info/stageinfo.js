import { Component } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleLeft, faAngleRight, faMountain } from "@fortawesome/free-solid-svg-icons"; //Pijltjes next/prev stage  //Berg voor de stageprofielknop // add/remove riders
import BudgetSwitchButton from '../../shared/budgetSwitchButton';
import ModalButton from '../../shared/modal';
import Button from '../../shared/button';


class stageInfo extends Component {
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
    return (
      <div className="stageContainer">
        <div className="stageInfo">
          <div className='stagetext'>
            {/* TODO (arjen) disable button ipv hide */}
            { (this.props.data.mode === 'selection' || this.props.data.stage !== 1) && <div id="prevStageButton"> 
              <Button color="blue" action={this.props.functions.previousStage} content={<FontAwesomeIcon icon={faAngleLeft}/>} /> 
                         </div> }
            <span className="bold black h7">Stage: {this.props.data.stage}</span>
            {((this.props.data.stageType !== "FinalStandings" && this.props.data.stageType !== "")) &&
              <div id="nextStageButton">
                <Button color="blue" action={this.props.functions.nextStage} content={<FontAwesomeIcon icon={faAngleRight}/>} />
              </div>
            }
          </div>
          <BudgetSwitchButton budget={this.props.data.budget} budgetSwitch={this.props.functions.budgetSwitch} />
          <ModalButton
            cssClassButton="button"
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