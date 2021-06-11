import { Component } from "react";
import PasswordRecoveryForm from './PasswordRecoveryForm';

class Modal extends Component {
  render() {
    const cssClass = this.props.show ? "modal display-block" : "modal display-none";
    const cssClass2 = this.props.show ? "display-block" : "modal display-none";
    return (
      <div className={cssClass}>
        <div className={cssClass2}>
          <PasswordRecoveryForm hideModal={this.props.hideModal}/>
        </div>
      </div>
    )
  }
}

class PasswordRecoveryModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
    }
    this.showModal = this.showModal.bind(this)
    this.hideModal = this.hideModal.bind(this)
  }

  showModal = (e) => {
    e.preventDefault();
    if (typeof (this.props.callback) === 'function') this.props.callback();
    this.setState({ visible: true });
    document.addEventListener("keydown", this.hideModal)
  }

  hideModal = (e) => {
    e.preventDefault();
    if ((e.type === "click" && !window.getSelection().toString().length) || e.keyCode === 27) {
      this.setState({ visible: false });
      document.removeEventListener("keydown", this.hideModal)
    }
  }

  render() {
    const buttonText = this.props.buttonText
    return (
      <>
        <button className='bg-transparent h-6 ml-2 mt-2' onClick={this.showModal}><span className="text-xs text-blue-500">Forgot password?</span></button>
        <Modal signup={this.props.signup} hideModal={this.hideModal} show={this.state.visible} />
      </>
    )
  }
}

export default PasswordRecoveryModal;