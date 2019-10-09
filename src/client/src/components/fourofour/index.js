import React, { Component } from 'react';
import './index.css';

class Fourofour extends Component{
    render(){
        return(
            <div className="fourofourContainer h5 bold">
                Something went wrong<br />
                <img src="/images/404white.png" alt="404: image not found" width="400"></img><br />
                {this.props.message}
            </div>
        )       
    }
}

export default Fourofour