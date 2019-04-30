import React from 'react';
import { Redirect, Route } from 'react-router-dom';
const jwtDecode = require('jwt-decode');

export const PrivateRoute = ({ component: Component, ...rest }) => (
    <Route
        {...rest}
        render={props =>
            localStorage.getItem('authToken') ? (
                <Component {...props} />
            ) : (
                <Redirect
                    to={{
                        pathname: "/",
                        state: { from: props.location }
                    }}
                />
            )
        }
    />
)

export const AdminRoute = ({ component: Component, ...rest }) => (
    <Route
        {...rest}
        render={props =>
            jwtDecode(localStorage.getItem('authToken')).admin ? (
                <Component {...props} />
            ) : (
                <Redirect
                    to={{
                        pathname: "/",
                        state: { from: props.location }
                    }}
                />
            )
        }
    />
)