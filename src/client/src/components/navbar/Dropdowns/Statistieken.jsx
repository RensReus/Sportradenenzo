import { Component } from "react";
import DropdownLink from "../../shared/DropdownLink";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons"; //Pijltjes voor de dropdown
class StatistiekenDropdown extends Component {
  constructor() {
    super();

    this.state = {
      showMenu: false
    };

    this.showMenu = this.showMenu.bind(this);
    this.closeMenu = this.closeMenu.bind(this);
  }

  showMenu(event) {
    event.preventDefault();

    this.setState({ showMenu: true }, () => {
      setTimeout(() => {
        document.addEventListener("click", this.closeMenu);
      }, 0);
    });
  }

  closeMenu() {
    this.setState({ showMenu: false }, () => {
      setTimeout(() => {
        document.removeEventListener("click", this.closeMenu);
      }, 0);
    });
  }

  render() {
    return (
      <div className="navbar_link">
        <a href="/statistieken/overview" onClick={this.showMenu}>
          <span>
            Statistieken <FontAwesomeIcon icon={this.state.showMenu ? faAngleUp : faAngleDown} />
          </span>
        </a>
        {this.state.showMenu ? (
          <div className="navbar_dropdown-content">
            <DropdownLink url="/statistics/rondewinsten" title="Uitslagen per ronde" />
            {this.props.showRaceSpecificData && [
              <DropdownLink url="/statistics/etappewinsten" title="Uitslagen per etappe" />,
              <DropdownLink url="/statistics/allriders" title="Alle renners" />,
              <DropdownLink url="/statistics/klassementen" title="Klassementen" />,
              <DropdownLink url="/statistics/missedpointsall" title="Gemiste punten iedereen" />,
              <DropdownLink url="/statistics/missedPointsPerRider" title="Gemiste punten Per Renner" />,
              <DropdownLink url="/statistics/teams" title="Team overzichten" />,
              <DropdownLink url="/statistics/teamcomparisons" title="Selectie vergelijking" />,
              <DropdownLink url="/statistics/overigestats" title="Overige Statistieken" />
            ]}
          </div>
        ) : null}
      </div>
    );
  }
}

export default StatistiekenDropdown;
