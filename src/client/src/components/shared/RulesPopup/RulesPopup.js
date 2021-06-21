import { useState } from 'react';
import EndPoints from './EndPoints';
import StagePoints from './StagePoints';
import StageSelectionExplanation from './StageSelectionExplanation';
import TeamSelectionExplanation from './TeamSelectionExplanation';

const RulesPopup = (props) => {
  const [page, setPage] = useState(props.page);
  const [showModal, setShowModal] = useState(false);
  const cssClass = showModal ? "modal display-block" : "modal display-none";
  const cssClass2 = showModal ? "modal-content display-block" : "modal display-none";

  return (
    <div className="stageprofilebutton">
      <button className="button_standard blue" onClick={() => setShowModal(!showModal)}>{"Uitleg/ Regels "}</button>
      <div className={cssClass}>
        <div className={cssClass2}>
          <div>
            <button className="button_standard blue" onClick={() => setPage('teamSelection')}>Team Selectie</button>
            <button className="button_standard blue" onClick={() => setPage('endPoints')}>Eind punten</button>
            <button className="button_standard blue" onClick={() => setPage('stageSelection')}>Etappe opstelling</button>
            <button className="button_standard blue" onClick={() => setPage('stagePoints')}>Etappe punten</button>
            <button className="button_standard blue" onClick={() => setShowModal(!showModal)}>X</button>
          </div>
            {page == "teamSelection" && <TeamSelectionExplanation raceName={props.raceName}/>}
            {page == "endPoints" && <EndPoints />}
            {page == "stageSelection" && <StageSelectionExplanation />}
            {page == "stagePoints" && <StagePoints />}
        </div>
      </div>
    </div>
  )
}

export default RulesPopup