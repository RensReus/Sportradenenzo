import { useSelector, useDispatch } from 'react-redux';
import { flip } from '../../../storeManagement/fabFourSwitch';
import SwitchButton from '../../ui/SwitchButton';

export function FabFourSwitchButton() {
    const dispatch = useDispatch();
    const fabFour = useSelector((state) => state.fabFourSwitch.value)
    return (
      <SwitchButton labelRight='FabFour' value={fabFour} action={() => dispatch(flip())}/>
    )
}

export default FabFourSwitchButton;