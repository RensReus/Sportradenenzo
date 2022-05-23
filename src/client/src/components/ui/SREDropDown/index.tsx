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

  componentDidMount() {
    document.addEventListener('click', this.handleWindowClick);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleWindowClick);
  }

  toggleMenu(event: React.MouseEvent) {
    event.stopPropagation();
    this.setState({ showMenu: !this.state.showMenu })
  }

  handleWindowClick(event: MouseEvent) {
    if (!event.target || !(event.target instanceof Element)) {
      return;
    }
    if (event.target.className === "navbar_dropdown_item") {
      return;
    }
    this.setState({ showMenu: false })
  }


  render() {
    return (
      <div className="contents">
        <button onClick={this.toggleMenu}>
          <span>
            { this.props.buttonText + ' ' }
            <FontAwesomeIcon icon={this.state.showMenu ? (faAngleUp) : (faAngleDown)} /> 
          </span>
        </button>
        {
          this.state.showMenu
            ? (
              <div className="navbar_dropdown-content">
                { this.props.menuContent }
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
