import { Component } from 'react';
import { Route, Redirect } from 'react-router-dom';
import './index.css';
import axios from 'axios';
import jwt_decode from "jwt-decode";

import { ReactRoute, AdminRoute } from './PrivateRoute'

import Navbar from './components/navbar';

import LogInSignUp from './components/LogInSignUp';
import Home from './components/home';
import Stage from './components/stage'
import Teamselection from './components/teamselection';
import Admin from './components/admin';
import Statistics from './components/statistics';
import Charts from './components/charts';
import Rider from './components/rider';
import Profile from './components/profile'
import Fourofour from './components/fourofour'
import Settings from './components/settings'
import PasswordRecovery from './components/PasswordRecovery';

//Import de standaard css stukken
import './components/css/buttons.css'
import './components/css/colours.css'
import './components/css/fonts.css'
import './components/css/menus.css'
import './components/css/tables.css'


class App extends Component {
  constructor(props) {
    super(props);
    //Start de response interceptor
    this.createAxiosResponseInterceptor();
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
        switch (error.response?.status) {
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
    // check voor huidige race
    let race_id = sessionStorage.getItem('race_id')
    let racename = sessionStorage.getItem('racename')
    let currentStageLink = sessionStorage.getItem('currentStageLink')
    let contentclass = 'content';
    const darkMode = localStorage.getItem('darkMode'); //"dark" | "light"
    if (darkMode === 'dark' || (!(darkMode) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      contentclass = contentclass + '';
    }
    if (currentStageLink === null) currentStageLink = '/home'
    this.state = ({
      loading: true,
      isLoggedIn: false,
      redirect: '/home',
      isAdmin: false,
      message: '',
      currentStageLink,
      race_id,
      racename,
      contentclass
    });
  }

  componentDidMount = async () => {
    const unauthorized = ['/passwordrecovery/'];
    let noAuth = false;
    unauthorized.forEach((url) => {
      if(this.props.history.location.pathname.includes(url)){
        noAuth = true;
        return;
      }
    })
    if (noAuth) {
      return;
    }
    //Eenmalig controleren of de gebruiker is ingelogd bij het initiele laden van de pagina
    //Na dit zal de authentication gaan via de interceptor
    if (localStorage.getItem('authToken')) {
      var res = await axios.post('/api/getlogin', { token: localStorage.getItem('authToken') })
      if (!res.data) {
        this.setState({
          redirect: this.props.history.location.pathname // voor redirect na inloggen
        })
        this.props.history.replace('/login')
      } else {
        this.setState({
          isLoggedIn: res.data.isLoggedIn,
          isAdmin: res.data.admin,
          loading: false
        })
      }
    } else {
      this.setState({
        loading: false,
        redirect: this.props.history.location.pathname
      })
      this.props.history.replace('/login')
    }
  }

  createAxiosResponseInterceptor = () => {
    const interceptor = axios.interceptors.response.use(
      response => {
        if (!this.state.isLoggedIn) {
          if (response.headers.authorization) {
            this.setState({
              isLoggedIn: true,
              isAdmin: jwt_decode(response.headers.authorization).admin
            });
          } else if (localStorage.getItem('authToken')) {
            this.setState({
              isLoggedIn: true,
              isAdmin: jwt_decode(localStorage.getItem('authToken')).admin
            });
          } else {
            this.setState({
              isLoggedIn: false,
            });
          }
        }
        return response
      }, (error) => {
        console.log("error:" + error)
        switch (error.response?.status) {
          case 401: //Geen token gevonden
            console.log('Not authorized');
            if (this.state.isLoggedIn) {
              this.setState({
                isLoggedIn: false,
                isAdmin: false
              })
            }
            //Redirect als uitgelogd en niet op de main pagina
            if (this.props.history.location.pathname !== '/') {
              console.log('redir')
              this.setState({
                redirect: this.props.history.location.pathname // voor redirect na inloggen
              })
              this.props.history.replace('/')
            }
            break;
          case 404:
            this.setState({
              redirect: this.props.history.location.pathname // voor redirect na inloggen
            })
            this.setState({
              message: error.response.data
            })
            this.props.history.replace('/404')
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
              this.createAxiosResponseInterceptor();
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

  setRace = (race) => {
    var currentStageLink = "/stage/" + race.stagenr;
    if (race.stagenr === 0) {
      currentStageLink = "/teamselection";
    }
    this.setState({
      race_id: race.race_id,
      racename: race.name,
      currentStageLink
    })
    sessionStorage.setItem('race_id', race.race_id)
    sessionStorage.setItem('racename', race.name)
    sessionStorage.setItem('currentStageLink', currentStageLink)
  }

  render() {
    return (
      // de switch en redirect zorgen ervoor dat 404 errors niet meer voorkomen 
      //maar maken admin en manual update onbereikbaar wss vanwege de admin check
      <div className={this.state.contentclass}>
        <Navbar isLoggedIn={this.state.isLoggedIn} isAdmin={this.state.isAdmin} isLoading={this.state.loading} history={this.props.history} racename={this.state.racename} currentStageLink={this.state.currentStageLink} />
        <div className="pageContainer">
          <Route exact path="/" render={() => (
            this.state.isLoggedIn ? (<Redirect to="/home" />) : (<Redirect to="/login" />)
          )} />
          <Route exact path="/login" render={() => (
            this.state.isLoggedIn ? (<Redirect to={this.state.redirect} />) : this.state.loading ? <></> : (<LogInSignUp history={this.props.history} Signup={false} />)
          )} />
          <Route path="/passwordrecovery/:token" component={PasswordRecovery} history={this.props.history} />
          <ReactRoute exact path="/stage/:stagenumber" component={Stage} history={this.props.history} race_id={this.state.race_id} racename={this.state.racename} />
          <ReactRoute path="/teamselection" component={Teamselection} history={this.props.history} race_id={this.state.race_id} racename={this.state.racename} />
          <AdminRoute path="/admin-:subpage" component={Admin} history={this.props.history} />
          <ReactRoute exact path="/statistics/:selection" component={Statistics} history={this.props.history} race_id={this.state.race_id} />
          <ReactRoute path="/profile/id/:account_id" component={Profile} history={this.props.history} />
          <ReactRoute exact path="/profile/:username" component={Profile} history={this.props.history} />
          <ReactRoute path="/rider/:rider_id" component={Rider} history={this.props.history} />
          <ReactRoute exact path="/charts/:chartname" component={Charts} history={this.props.history} race_id={this.state.race_id} />
          <ReactRoute path="/home" component={Home} history={this.props.history} setRace={this.setRace} />
          <ReactRoute path="/404" component={Fourofour} history={this.props.history} message={this.state.message} />
          <ReactRoute path="/settings" component={Settings} history={this.props.history} />
        </div>
      </div>
    );
  }
}

export default App;