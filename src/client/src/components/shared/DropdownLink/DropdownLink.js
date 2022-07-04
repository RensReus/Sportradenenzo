import { Link } from "react-router-dom";

const DropdownLink = (props) => {
    return (
        <Link className="navbar_dropdown_item" to={props.url}>
            {props.title}
        </Link>
    )
}

export default DropdownLink
