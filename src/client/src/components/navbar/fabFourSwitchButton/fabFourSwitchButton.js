import { useSelector, useDispatch } from 'react-redux'
import { flip } from '../../../storeManagement/fabFourSwitch'

export function FabFourSwitchButton() {
    const dispatch = useDispatch();
    const fabFour = useSelector((state) => state.fabFourSwitch.value)
    return (
        <div className='fabFourtext h7'>
            <span className={fabFour ? 'bold grayedOut' : 'bold'}></span>
            <label className="switch">
                <input type="checkbox" onClick={() => dispatch(flip())}></input>
                <span className="slider round"></span>
            </label>
            <span className={fabFour ? 'bold' : 'bold grayedOut'}> FabFour </span>
        </div>
    )
}

export default FabFourSwitchButton;