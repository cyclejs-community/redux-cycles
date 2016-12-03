import { createStore, applyMiddleware, compose } from 'redux';
import { createEpicMiddleware } from 'redux-observable';
import { browserHistory } from 'react-router';
import { routerMiddleware } from 'react-router-redux';
import rootReducer from './reducers';
import {makeHTTPDriver} from '@cycle/http';

import { createCycleMiddleware } from './createCycleMiddleware';
import { receiveUserRepos } from './actions';
import * as ActionTypes from './ActionTypes';

import xs from 'xstream';
import debounce from 'xstream/extra/debounce';

function main(sources) {
  const user$ = sources.ACTION
    // .debug(action => console.log(action))
    .filter(action => action.type === ActionTypes.REQUESTED_USER_REPOS)
    .map(action => action.payload.user);

  const request$ = user$
    .map(user => ({
      url: `https://api.github.com/users/${user}/repos`,
      category: 'users'
    }));

  const response$ = sources.HTTP
    .select('users')
    .flatten();

  const action$ = xs.combine(response$)
    .map(args => console.log(arguments));
    // .map(receiveUserRepos.bind(null, user))

  const searchQuery$ = sources.ACTION
    .filter(action => action.type === ActionTypes.SEARCHED_USERS)
    .map(action => action.payload.query)
    .filter(q => !!q)
    .compose(debounce(800))
    .endWhen(
      sources.ACTION.filter(action =>
        action.type === ActionTypes.CLEARED_SEARCH_RESULTS)
    )

  const searchQueryRequest$ = searchQuery$
    .map(q => ({
      url: `https://api.github.com/search/users?q=${q}`,
      category: 'query'
    }))

  const searchQueryResponse$ = sources.HTTP
    .select('query')
    .flatten()
    .map(res => res.items)
    .debug(items => console.log(items))
    // .map(receiveUsers)

  return {
    HTTP: xs.merge(request$, searchQueryRequest$),
    ACTION: xs.of({ type: 'foo' }),
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
