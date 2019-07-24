import React, { Component } from 'react';
import { Route, Redirect} from 'react-router-dom';
import './index.css';
import axios from 'axios';

import { PrivateRoute, AdminRoute } from './PrivateRoute'

import Navbar from './components/navbar';

import Home from './components/home';
import Profile from './components/profile';
import Stage from './components/stage'
import Teamselection from './components/teamselection';
import Admin from './components/admin';
import Etappewinsten from './components/etappewinsten';
import Overzicht from './components/overzicht';
import Charts from './components/charts';
import Rider from './components/rider';
import ManualUpdate from './components/manualupdate'
import Rulesandpoints from './components/rulesandpoints';

//Import de standaard css stukken
import './components/css/buttons.css'
import './components/css/fonts.css'
import './components/css/tables.css'

const jwtDecode = require('jwt-decode');

class App extends Component {
  constructor(props) {
    console.log(props)
    super(props);
    this.state = ({
      loading: true,
      isLoggedIn: false,
      redirect: '/',
      isAdmin: false 
    });
  }

  render() {
    //Kijken of de gebruiker is ingelogd en adminrechten heeft
    if(localStorage.getItem('authToken')){
      var token = localStorage.getItem('authToken')
      var decoded = jwtDecode(token)
      if(!this.state.isLoggedIn){ //Token bestaat, state moet ingelogd zijn
        this.setState({
          isLoggedIn: true,
          isAdmin: decoded.admin
        })
      }
    }else{
      if(this.state.isLoggedIn){ //Token bestaat, state moet uitgelogd en adminloos zijn
        this.setState({
          isLoggedIn: false,
          isAdmin: false
        })
      }
      if(this.props.history.location.pathname !== '/'){ //Redirect als uitgelogd en niet op de main pagina
        this.setState({
          redirect: this.props.history.location.pathname
        })
        this.props.history.replace('/')
      }
    }
    if(this.state.redirect === '/'){
      axios.post('/api/currentstageredir')
        .then(res =>{
          console.log(res.data)
          this.setState({redirect: res.data.redirect})
        })
    }
    
    return (
      // de switch en redirect zorgen ervoor dat 404 errors niet meer voorkomen 
      //maar maken admin en manual update onbereikbaar wss vanwege de admin check
      <div className="content">
        <div className="backgroundImage"></div>
        <Navbar isLoggedIn={this.state.isLoggedIn} isAdmin={this.state.isAdmin} history={this.props.history}/>
        <div className="pageContainer">
        
        {/* <Switch> */}
            <Route exact path="/" render={() => (
              this.state.isLoggedIn ? (<Redirect to={this.state.redirect} />) : (<Home history={this.props.history} />)
            )} />
            <PrivateRoute path="/profile" component={Profile} history={this.props.history} />
            <PrivateRoute exact path="/stage/:stagenumber" component={Stage} history={this.props.history} />
            <Route path="/teamselection" component={Teamselection} history={this.props.history} redirect = {this.state.redirect}/>
            <AdminRoute path="/admin" component={Admin} history={this.props.history} />
            <AdminRoute path="/manualupdate" component={ManualUpdate} history={this.props.history} />
            
            <Route path="/etappewinsten" component={Etappewinsten} history={this.props.history} />
            <Route path="/rulesandpoints" component={Rulesandpoints} history={this.props.history} />
            <Route path="/overzicht/:selection" component={Overzicht} history={this.props.history} />
            <Route path="/rider/:rider_participation_id" component={Rider} history={this.props.history} />
            <Route path="/charts/:chartname" component={Charts} history={this.props.history} />
            {/* <Redirect to='/'/>
          </Switch> */}
        </div>
      </div>
    );
  }
}

export default App;