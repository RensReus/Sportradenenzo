import { Component } from "react";
import './index.css'

class Button extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return(
      <button
        className={
          'button_standard ' +
          this.props.color +
          (this.props.disabled? ' disabled' : '')
        }
        onClick={this.props.action}
        >
        {this.props.content}
      </button>
    )
  }
}

export default Button;