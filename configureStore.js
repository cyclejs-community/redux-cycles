import { createStore, applyMiddleware, compose } from 'redux';
import { createEpicMiddleware } from 'redux-observable';
import { browserHistory } from 'react-router';
import { routerMiddleware } from 'react-router-redux';
import rootReducer from './reducers';
import {makeHTTPDriver} from '@cycle/http';

import { createCycleMiddleware } from './createCycleMiddleware';
import { receiveUserRepos } from '../actions';
import * as ActionTypes from '../ActionTypes';

function main(sources) {
  const request$ = sources.ACTION
    .filter(action => action.type === ActionTypes.REQUESTED_USER_REPOS)
    .map(action => action.payload.user)
    .map(user => {
      url: `https://api.github.com/users/${user}/repos`,
      category: 'users'
    })

  const action$ = sources.HTTP
    .select('users')
    .flatten()
    .map(receiveUserRepos.bind(null, user))

  return {
    ACTION: action$,
    HTTP: request$
  };
}

const cycleMiddleware = createCycleMiddleware(main, { HTTP: makeHTTPDriver() });

export default function configureStore() {
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
  const store = createStore(
    rootReducer,
    composeEnhancers(
      applyMiddleware(
        cycleMiddleware,
        routerMiddleware(browserHistory)
      )
    )
  );
  return store;
}
