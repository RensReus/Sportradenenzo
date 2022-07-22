import React, { Component } from "react";

class LoadingDiv extends Component {
    render() {
        return (
            <div className={"loadingData " + this.props.loading} ><img src="/images/wheel.png" alt="Loading"></img><div className="h4"></div></div>
        )
    }
}

export default LoadingDiv;