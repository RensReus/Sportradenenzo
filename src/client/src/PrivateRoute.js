import { Redirect, Route } from 'react-router-dom';
import jwt_decode from "jwt-decode";

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
            localStorage.getItem('authToken')? (
            jwt_decode(localStorage.getItem('authToken')).admin ? (
                <Component {...props} />
            ) : (
                <Redirect
                    to={{
                        pathname: "/",
                        state: { from: props.location }
                    }}
                />
            )) : (<></>)
        }
    />
)