import { useSelector, useDispatch } from 'react-redux'
import { flip } from '../../../storeManagement/fabFourSwitch'

export function FabFourSwitchButton() {
    const dispatch = useDispatch();
    const fabFour = useSelector((state) => state.fabFourSwitch.value)
    return (
      <div className="pl-2 w-32">
        <label className="switch">
          <div class="flex cursor-pointer gap-x-2">
            <div class="min-w-full h-4">
              <input type="checkbox" onClick={() => dispatch(flip())}></input>
              <div className="slider round"></div>
            </div>
            <div className='bold -mt-1'> FabFour </div>
          </div>
        </label>
      </div>
    )
}

export default FabFourSwitchButton;