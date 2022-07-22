import { useSelector, useDispatch } from 'react-redux';
import { flip } from '../../../storeManagement/budgetSwitch';
import SwitchButton from '../../ui/SwitchButton';

export function BudgetSwitchButton() {
    const dispatch = useDispatch();
    const budget = useSelector((state) => state.budgetSwitch.value)
    return (
      <SwitchButton labelRight='Budget' value={budget} action={() => dispatch(flip())}/>
    )
}

export default BudgetSwitchButton;