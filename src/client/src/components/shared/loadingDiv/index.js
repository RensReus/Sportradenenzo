import React, { Component } from "react";

class LoadingDiv extends Component {
    render() {
        return (
            <div className={"loadingData " + this.props.loading} ><img src="/images/loading.gif" alt="Loading..."></img><div className="h4"></div></div>
        )
    }
}

export default LoadingDiv;