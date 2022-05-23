import { Link } from 'react-router-dom';
import SREDropdown from '../../ui/SREDropDown'

interface ChartsDropdownProps {
  showRaceSpecificData: boolean;
}

const ChartsDropdown = (props: ChartsDropdownProps) => {
  return (
    <div className="navbar_link">
      <SREDropdown
        buttonText='Charts'
        menuContent={
          <div className="navbar_dropdown-content">
            {props.showRaceSpecificData && [
              <Link className='navbar_dropdown_item' to='/charts/userscores' key={'userscores'}>
                Relatief Scoreverloop
              </Link>,
              <Link className='navbar_dropdown_item' to='/charts/userrank' key={'userrank'}>
                Ranking
              </Link>,
              <Link className='navbar_dropdown_item' to='/charts/riderpercentage' key={'riderpercentage'}>
                Puntenaandeel Renner per Etappe
              </Link>,
              <Link className='navbar_dropdown_item' to='/charts/scorespread' key={'scorespread'}>
                Score verdeling
              </Link>
            ]}
            <Link className='navbar_dropdown_item' to='/charts/totalscorespread' key={'totalscorespread'}>
              Score verdeling Totaal
            </Link>
          </div>
        }
      />
    </div>
  );
}

export default ChartsDropdown
