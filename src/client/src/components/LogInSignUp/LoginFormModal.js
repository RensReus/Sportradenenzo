import { Component } from "react";
import LoginForm from './LoginForm';

class Modal extends Component {
  render() {
    const cssClass = this.props.show ? "modal display-block" : "modal display-none";
    const cssClass2 = this.props.show ? "display-block" : "modal display-none";
    return (
      <div className={cssClass} onClick={(e) => this.props.hideModal(e)}>
        <div className={cssClass2}>
          <LoginForm history={this.props.history} signup={this.props.signup}/>
        </div>
      </div>
    )
  }
}

class LoginFormModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
    }
    this.showModal = this.showModal.bind(this)
    this.hideModal = this.hideModal.bind(this)
  }

  showModal = () => {
    if (typeof (this.props.callback) === 'function') this.props.callback();
    this.setState({ visible: true });
    document.addEventListener("keydown", this.hideModal)
  }

  hideModal = (e) => {
    if ((e.type === "click" && !window.getSelection().toString().length) || e.keyCode === 27) {
      this.setState({ visible: false });
      document.removeEventListener("keydown", this.hideModal)
    }
  }

  render() {
    const buttonText = this.props.buttonText
    return (
      <>
        <button className='landing_button' onClick={this.showModal}>{buttonText}</button>
        <Modal signup={this.props.signup} hideModal={this.hideModal} show={this.state.visible} />
      </>
    )
  }
}

export default LoginFormModal;