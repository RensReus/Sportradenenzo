import { useSelector, useDispatch } from 'react-redux'
import { flip } from '../../../storeManagement/budgetSwitch'
import './index.css'

export function BudgetSwitchButton() {
    const dispatch = useDispatch();
    const budget = useSelector((state) => state.budgetSwitch.value)
    return (
      <div className="pl-2 w-28">
        <label className="switch">
          <div class="flex cursor-pointer gap-x-2">
            <div class="min-w-full h-4">
              <input type="checkbox" onClick={() => dispatch(flip())}></input>
              <div className="slider round"></div>
            </div>
            <div className='bold -mt-1'> Budget </div>
          </div>
        </label>
      </div>
    )
}

export default BudgetSwitchButton;