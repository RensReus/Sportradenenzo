import axios from "axios";
import { updateArray } from '../helperfunctions'

export async function getSelectionData(stage: number, state: any, props: any): Promise<object> {
  const budget = props.data.budget;
  const res = await axios.post('/api/getstageselection', { race_id: props.data.race_id, stage, budgetParticipation: budget })
  const data = res.data;
  if (data.mode === '404') {
    return { mode: '404' }
  } else {
    return {
      mode: 'selection',
      teamSelection: updateArray(state.teamSelection, data.teamSelection, budget),
      stageSelection: updateArray(state.stageSelection, data.stageSelection, budget),
      kopman: updateArray(state.kopman, data.kopman, budget),
      starttime: data.starttime,
      prevClassifications: updateArray(state.prevClassifications, data.prevClassifications, budget),
      selectionsComplete: data.selectionsComplete,
      loading: false
    }
  }
}

export async function updateKopmanCall(rider_participation_id: number, setremove: string, state: any, props: any) {
  const budget = props.data.budget;
  const link = setremove === 'set' ? 'setkopman' : 'removekopman';
  const res = await axios.post('/api/' + link, { race_id: props.data.race_id, stage: props.data.stage, rider_participation_id, budgetParticipation: budget })
  return {
    kopman: updateArray(state.kopman, res.data.kopman, budget),
    selectionsComplete: res.data.selectionsComplete
  }
}

export async function updateRiderCall(rider_participation_id: number, addRemove: string, state: any, props: any) {
  const budget = props.data.budget;
  const link = addRemove === 'add' ? 'addridertostage' : 'removeriderfromstage';
  const res = await axios.post('/api/' + link, { race_id: props.data.race_id, stage: props.data.stage, rider_participation_id, budgetParticipation: budget })
  return {
    stageSelection: updateArray(state.stageSelection, res.data.stageSelection, budget),
    kopman: updateArray(state.kopman, res.data.kopman, budget),
    prevClassifications: updateArray(state.prevClassifications, res.data.prevClassifications, budget),
    selectionsComplete: res.data.selectionsComplete
  }
}
