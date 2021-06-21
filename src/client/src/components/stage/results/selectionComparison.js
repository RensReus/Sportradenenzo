import ModalButton from "../../shared/modal"
import { useState } from 'react';
import { updateArray } from '../helperfunctions'
import axios from 'axios';
import Table from '../../shared/table'

const selectionComparison = (props) => {
  const [allSelections, setAllSelections] = useState([[], []]);
  const [notSelected, setNotSelected] = useState([[], []]);

  const budget = props.data.budget;

  const getAllSelections = async () => { //TODO add loader
    var res;
    if (props.userToCompareId !== undefined){
      res = await axios.post('/api/getSelectionComparison', { race_id: props.data.race_id, stage: props.data.stage, budgetParticipation: budget, userToCompareId: props.userToCompareId })
    } else {
      res = await axios.post('/api/getAllSelections', { race_id: props.data.race_id, stage: props.data.stage, budgetParticipation: budget })
    }
    setAllSelections(updateArray(allSelections, res.data.allSelections, budget));
    setNotSelected(updateArray(notSelected, res.data.notSelected, budget));
  }


  let allSelections2 = allSelections[budget];
  let notSelected2 = notSelected[budget];
  var allSelectionsPopupContent = [];
  var index = 0;
  for (var i in allSelections2) {
    var notSelectedTable = '';

    if (index < notSelected2.length && allSelections2[i].title === notSelected2[index].username) {
      notSelectedTable = <Table data={notSelected2[index].riders} title={"Niet Opgesteld"} />
      index++;
    }
    var totalRiders = '';
    if (parseInt(i) === allSelections2.length - 1) {
      totalRiders = ' Totaal: ' + allSelections2[i].tableData.length
    }
    allSelectionsPopupContent.push(<div className="tableDiv"><Table data={allSelections2[i].tableData} title={allSelections2[i].title + totalRiders} coltype={allSelections2[i].coltype} />{notSelectedTable}</div>)
  }
  return (
    <ModalButton
      cssClassButton={"buttonStandard " + props.data.racename}
      content={props.title}
      modalContent={allSelectionsPopupContent}
      callback={getAllSelections}
    />
  )
}

export default selectionComparison