import { Link } from 'react-router-dom';
import SREDropdown from '../../ui/SREDropDown'

interface StatistiekenDropdownProps {
  showRaceSpecificData: boolean;
}

const StatistiekenDropdown = (props: StatistiekenDropdownProps) => {
  return (
    <div className="navbar_link">
      <SREDropdown
        buttonText='Statistieken'
        menuContent={
          <div className="navbar_dropdown-content">
            <Link className='navbar_dropdown_item' to='/statistics/rondewinsten' key={'rondewinsten'}>
              Uitslagen per ronde
            </Link>
            { props.showRaceSpecificData && [
              <Link className='navbar_dropdown_item' to='/statistics/etappewinsten' key={'etappewinsten'}>
                Uitslagen per etappe
              </Link>,
              <Link className='navbar_dropdown_item' to='/statistics/allriders' key={'allriders'}>
                Alle renners
              </Link>,
              <Link className='navbar_dropdown_item' to='/statistics/klassementen' key={'klassementen'}>
                Klassementen
              </Link>,
              <Link className='navbar_dropdown_item' to='/statistics/missedpointsall' key={'missedpointsall'}>
                Gemiste punten iedereen
              </Link>,
              <Link className='navbar_dropdown_item' to='/statistics/missedPointsPerRider'>
                Gemiste punten Per Renner
              </Link>,
              <Link className='navbar_dropdown_item' to='/statistics/teams' key={'teams'}>
                Team overzichten
              </Link>,
              <Link className='navbar_dropdown_item' to='/statistics/teamcomparisons' key={'teamcomparisons'}>
                Selectie vergelijking
              </Link>,
              <Link className='navbar_dropdown_item' to='/statistics/overigestats' key={'overigestats'}>
                Overige Statistieken
              </Link>
            ]}
          </div>
        }
      />
    </div>
  )
}

export default StatistiekenDropdown
