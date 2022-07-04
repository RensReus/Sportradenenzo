import DropdownLink from "../../shared/DropdownLink";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons";
import { useState } from 'react';

const DropdownMenu = (props) => {
    const [showMenu, setShowMenu] = useState(false);

    const openMenu = () => {
        if (!showMenu) { // Hoeft alleen iets te doen als menu gesloten
            setShowMenu(true);
            setTimeout(() => {
                window.addEventListener("click", closeMenu);
            }, 0);
        }
    }

    const closeMenu = () => {
        setShowMenu(false);
        setTimeout(() => {
            window.removeEventListener("click", closeMenu);
        }, 0);
    }

    var alwaysLinks = props.alwaysLinks.map(link => <DropdownLink key={link.title} url={link.url} title={link.title} />)
    var raceOnlyLinks = props.raceOnlyLinks.map(link => <DropdownLink key={link.title} url={link.url} title={link.title} />)

    return (
        <div className="navbar_link">
            <span onClick={openMenu}>
                {props.name} <FontAwesomeIcon icon={showMenu ? faAngleUp : faAngleDown} />
            </span>
            {showMenu ? (
                <div className="navbar_dropdown-content">
                    {props.showRaceSpecificData && raceOnlyLinks}
                    {alwaysLinks}
                </div>
            ) : null}
        </div>
    );
}

export default DropdownMenu;