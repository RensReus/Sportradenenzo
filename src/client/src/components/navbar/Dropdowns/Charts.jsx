import { Component } from "react";
import DropdownLink from "../../shared/DropdownLink";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons"; //Pijltjes voor de dropdown
class ChartsDropdown extends Component {
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
        <a href="/charts/overview" onClick={this.showMenu}>
          <span>
            Charts <FontAwesomeIcon icon={this.state.showMenu ? faAngleUp : faAngleDown} />
          </span>
        </a>
        {this.state.showMenu ? (
          <div className="navbar_dropdown-content">
            {this.props.showRaceSpecificData && [
              <DropdownLink url="/charts/userscores" title="Relatief Scoreverloop" />,
              <DropdownLink url="/charts/userrank" title="Ranking" />,
              <DropdownLink url="/charts/riderpercentage" title="Puntenaandeel Renner per Etappe" />,
              <DropdownLink url="/charts/scorespread" title="Score verdeling" />
            ]}
            <DropdownLink url="/charts/totalscorespread" title="Score verdeling Totaal" />
          </div>
        ) : null}
      </div>
    );
  }
}

export default ChartsDropdown;
