import { useSelector, useDispatch } from 'react-redux'
import { flip } from '../../../storeManagement/budgetSwitch'
import './index.css'

export function BudgetSwitchButton() {
    const dispatch = useDispatch();
    const budget = useSelector((state) => state.budgetSwitch.value)
    return (
        <div className='budgettext h7'>
            <span className={budget ? 'bold grayedOut' : 'bold'}></span>
            <label className="switch">
                <input type="checkbox" onClick={() => dispatch(flip())}></input>
                <span className="slider round"></span>
            </label>
            <span className={budget ? 'bold' : 'bold grayedOut'}> Budget </span>
        </div>
    )
}

export default BudgetSwitchButton;