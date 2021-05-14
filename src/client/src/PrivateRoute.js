import { Redirect, Route } from 'react-router-dom';
const jwtDecode = require('jwt-decode');

export const ReactRoute = ({ component: Component, ...rest }) => (
    <Route
        {...rest}
        render={props =>
            <Component {...props} {...rest}/>
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