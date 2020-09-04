import React, { Component } from 'react';
import { Route, Redirect } from 'react-router-dom';
import './index.css';
import axios from 'axios';

import { ReactRoute, AdminRoute } from './PrivateRoute'

import Navbar from './components/navbar';

import LogInSignUp from './components/LogInSignUp';
import Home from './components/home';
import Stage from './components/stage'
import Teamselection from './components/teamselection';
import Admin from './components/admin';
import Overzicht from './components/overzicht';
import Charts from './components/charts';
import Rider from './components/rider';
import Rulesandpoints from './components/rulesandpoints';
import Profile from './components/profile'
import Fourofour from './components/fourofour'

//Import de standaard css stukken
import './components/css/buttons.css'
import './components/css/colours.css'
import './components/css/fonts.css'
import './components/css/tables.css'

const jwtDecode = require('jwt-decode');

class App extends Component {
  constructor(props) {
    super(props);
    this.state = ({
      loading: true,
      isLoggedIn: false,
      redirect: '/home',
      isAdmin: false,
      getLogin: true,
      message: '',
      currentStageLink: '/home',
      race_id: undefined
    });
    this.setRace = this.setRace.bind(this)
  }

  componentDidMount() {
    //Eenmalig controleren of de gebruiker is ingelogd bij het initiele laden van de pagina
    //Na dit zal de authentication gaan via de interceptor
    if(localStorage.getItem('authToken') && this.state.getLogin){
      axios.post('/api/getlogin', {token: localStorage.getItem('authToken')})
        .then(res => {
          this.setState({
            isLoggedIn: res.data.isLoggedIn,
            isAdmin: res.data.admin, 
            getLogin: false, 
            loading: false
          })
          if(!res.data){
            this.setState({
              getLogin: false,
              redirect: this.props.history.location.pathname // voor redirect na inloggen
            })
            this.props.history.replace('/login')
          }
        })
    } else {
      this.setState({
        getLogin: false, 
        loading: false, 
        redirect: this.props.history.loacation.pathname
      })
      this.props.history.replace('/login')
    }
    //Start de response interceptor
    createAxiosResponseInterceptor();
    //Bind de huidige this voor gebruik in de interceptors
    const self = this;
    //De request interceptor voegt aan elke response naar de server de authtoken toe aan de request header
    axios.interceptors.request.use(
      reqConfig => {
        if (localStorage.getItem('authToken')) {
          //Voeg token toe aan de req headers
          reqConfig.headers.authorization = localStorage.getItem('authToken');
        } else {
          reqConfig.headers.authorization = null;
        }
        return reqConfig;
      }, (error) => {
        switch (error.response.status) {
          case 400:
            console.log('Bad request');
            break;
          default:
            console.log("Reqerror")
            console.log(error)
            break;
        }
        return Promise.reject(error);
      }
    );
    //Maak een function van de response interceptor zodat deze uitgeschakeld kan worden      
    function createAxiosResponseInterceptor() {
      const interceptor = axios.interceptors.response.use(
        response => {
          if (!self.state.isLoggedIn) {
            if (response.headers.authorization) {
              self.setState({
                isLoggedIn: true,
                isAdmin: jwtDecode(response.headers.authorization).admin
              });
            } else {
              self.setState({
                isLoggedIn: true,
                isAdmin: jwtDecode(localStorage.getItem('authToken')).admin
              });
            }
          }
          return response
        }, (error) => {
          console.log("error:" + error)
          switch (error.response.status) {
            case 401: //Geen token gevonden
              console.log('Not authorized');
              if (self.state.isLoggedIn) {
                self.setState({
                  isLoggedIn: false,
                  isAdmin: false
                })
              }                
              //Redirect als uitgelogd en niet op de main pagina
              if (self.props.history.location.pathname !== '/') {
                console.log('redir')
                self.setState({
                  redirect: self.props.history.location.pathname // voor redirect na inloggen
                })
                self.props.history.replace('/')
              }
              break;
            case 404:
              self.setState({
                redirect: self.props.history.location.pathname // voor redirect na inloggen
              })
              self.setState({
                message: error.response.data
              })
              self.props.history.replace('/404')
              break;
            case 498: //Refresh token aangemaakt, stuur request opnieuw
              return new Promise((resolve) => {
                //Eject de interceptor voor de retry om loop te voorkomen
                axios.interceptors.response.eject(interceptor);
                //Sla de teruggestuurde token op in de local storage
                localStorage.setItem('authToken', error.response.headers.authorization)
                //Voeg de token toe aan de headers
                error.config.headers.authorization = error.response.headers.authorization;
                //Retry de request
                axios(error.config).then(resolve);
                //Reinstate interceptor
                createAxiosResponseInterceptor();
              })
            default:
              console.log("Unknown response error")
              console.log(error)
              break;
          }
          return Promise.reject(error);
        }
      );
    }
  }

  setRace(race){
    this.setState({
      race_id: race.race_id,
      racename: race.racename,
      currentStageLink: "/stage/" + race.stagenr
    })
  }

  render() {
    return (
      // de switch en redirect zorgen ervoor dat 404 errors niet meer voorkomen 
      //maar maken admin en manual update onbereikbaar wss vanwege de admin check
      <div className="content">
        <div className="backgroundImage"></div>
        <Navbar isLoggedIn={this.state.isLoggedIn} isAdmin={this.state.isAdmin} isLoading={this.state.loading} history={this.props.history} racename={this.state.racename} currentStageLink={this.state.currentStageLink} />
        <div className="pageContainer">
          <Route exact path="/" render={() => (
            this.state.isLoggedIn ? (<Redirect to="/home" />) : (<Redirect to="/login"/>)
          )} />
          <Route exact path="/login" render={() => (
            this.state.isLoggedIn ? (<Redirect to={this.state.redirect} />) : (<LogInSignUp history={this.props.history} Signup={false} />)
          )} />
          <ReactRoute exact path="/stage/:stagenumber" component={Stage} history={this.props.history} race_id={this.state.race_id} racename={this.state.racename} />
          <ReactRoute path="/teamselection" component={Teamselection} history={this.props.history} race_id={this.state.race_id} />
          <AdminRoute path="/admin-:subpage" component={Admin} history={this.props.history} />
          <ReactRoute path="/rulesandpoints" component={Rulesandpoints} history={this.props.history} />
          <ReactRoute exact path="/overzicht/:selection" component={Overzicht} history={this.props.history} race_id={this.state.race_id} />
          <ReactRoute path="/profile/id/:account_id" component={Profile} history={this.props.history} />
          <ReactRoute exact path="/profile/:username" component={Profile} history={this.props.history} />
          <ReactRoute path="/rider/:rider_participation_id" component={Rider} history={this.props.history} /> {/* TODO per rider_id en dan verschillende participations tonen, pas als vorige races in de DB staan */}
          <ReactRoute exact path="/charts/:chartname" component={Charts} history={this.props.history} race_id={this.state.race_id} />
          <ReactRoute path="/home" component={Home} history={this.props.history} setRace={this.setRace}/>
          <ReactRoute path="/404" component={Fourofour} history={this.props.history} message={this.state.message} />
        </div>
      </div>
    );
  }
}

export default App;