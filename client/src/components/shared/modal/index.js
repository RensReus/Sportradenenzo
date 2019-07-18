import React, { Component } from "react";
import './index.css';

class Modal extends Component {
    render() {
        const cssClass = this.props.show ? "modal display-block" : "modal display-none";
        const cssClass2 = this.props.show ? "modal-content display-block" : "modal display-none";
        return (
            <div className={cssClass} onClick={() => this.props.hideModal()}>
                <div className={cssClass2}>{this.props.content}</div>
            </div>
        )
    }
}

class ModalButton extends Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
        }
        this.showModal = this.showModal.bind(this)
        this.hideModal = this.hideModal.bind(this)
    }

    showModal = () => {
        this.setState({ visible: true });
    }

    hideModal = () => {
        this.setState({ visible: false });
    }

    render() {
        const cssClassButton = this.props.cssClassButton
        const content = this.props.content
        const contentIcon = this.props.contentIcon
        const modalContent = this.props.modalContent
        return (
            <div className="stageprofilebutton">
                <button className={cssClassButton} onClick={this.showModal}>{content}{contentIcon}</button>
                <Modal content={modalContent} hideModal={this.hideModal} show={this.state.visible} />
            </div>
        )
    }
}

export default ModalButton;