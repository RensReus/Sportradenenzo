import React, { Component } from 'react';
// import axios from 'axios';
//import './index.css';
import underConstruction from '../../under_construction.gif'

class ActiveRacesTable extends Component{
    render(){
        return(
            <div>Geen Openstaande races</div>
        )
    }
}

class Home extends Component{
    constructor(props) {
        super(props);
        this.state = ({
            
        });
      }

    componentDidMount(){
        document.title = "Profiel";
    }

       
    render(){
        return(
            <div className="standardContainer">
                <div className="activeRaces">
                    <ActiveRacesTable/>
                </div>
                <img src={underConstruction}  alt="still building" />
                Coming Soon meer hier
                stuur suggesties naar Arjen Peijen
            </div>
        )
    }
}

export default Home