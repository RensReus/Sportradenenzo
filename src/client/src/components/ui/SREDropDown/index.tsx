import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons"; //Pijltjes voor de dropdown

interface SREDropdownProps {
  buttonText: string;
  menuContent: any;
}

interface SREDropdownState {
  showMenu: boolean;
}

class SREDropdown extends Component<SREDropdownProps, SREDropdownState> {
  constructor(props: SREDropdownProps) {
    super(props);

    this.state = {
      showMenu: false,
    }

    this.toggleMenu = this.toggleMenu.bind(this);
    this.handleWindowClick = this.handleWindowClick.bind(this);
  }

  toggleMenu(event: React.MouseEvent) {
    if (!this.state.showMenu) {
      setTimeout(() => { document.addEventListener('click', this.handleWindowClick) }, 0);
    }
    this.setState({ showMenu: !this.state.showMenu })
  }

  handleWindowClick(event: MouseEvent) {
    document.removeEventListener('click', this.handleWindowClick);
    this.setState({ showMenu: false })
  }


  render() {
    return (
      <div className="contents">
        <button onClick={this.toggleMenu}>
          <span>
            {this.props.buttonText + ' '}
            <FontAwesomeIcon icon={this.state.showMenu ? (faAngleUp) : (faAngleDown)} />
          </span>
        </button>
        {
          this.state.showMenu
            ? (
              <div className="navbar_dropdown-content">
                {this.props.menuContent}
              </div>
            )
            : (
              null
            )
        }
      </div>
    );
  }
}

export default SREDropdown
