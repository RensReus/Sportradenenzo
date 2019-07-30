import React, { Component } from 'react';
import axios from 'axios';

class Profile extends Component{
    constructor(props) {
        super(props);
        this.state = ({
            tourpos: "",
        });
      }

    componentWillMount(){
        axios.post('/api/getprofiledata',{account_id: this.props.match.params.account_id,token: localStorage.getItem('authToken')})
        .then((res)=>{
            if(res.data.userNotFound){

            }else{//render user profile
                document.title = res.data.username;
                this.setState({
                    tourpos: res.data.tourpos,
                    username: res.data.username,
                })
            }
        })
    }
    
    render(){
        return(
            <div className="standardContainer">
                <div className='h1'style={{display: this.state.upcomingParticipation ? 'none' : 'block'}}>
                    {this.state.username} was {this.state.tourpos}e in de Tour 2019
                </div>
            </div>
        )
    }
}

export default Profile