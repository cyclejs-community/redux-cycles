import { createStore, applyMiddleware, compose } from 'redux';
import { createEpicMiddleware } from 'redux-observable';
import { browserHistory } from 'react-router';
import { routerMiddleware } from 'react-router-redux';
import rootReducer from './reducers';
import {makeHTTPDriver} from '@cycle/http';

import { createCycleMiddleware } from './createCycleMiddleware';
import * as actions from './actions';
import * as ActionTypes from './ActionTypes';

import xs from 'xstream';
import debounce from 'xstream/extra/debounce';

function main(sources) {
  const user$ = sources.ACTION
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

  const action$ = xs.combine(response$, user$)
    .map(arr => actions.receiveUserRepos(arr[1], arr[0].body));

  const searchQuery$ = sources.ACTION
    .filter(action => action.type === ActionTypes.SEARCHED_USERS)
    .map(action => action.payload.query)
    .filter(q => !!q)
    .compose(debounce(800))
    // .endWhen(
    //   sources.ACTION.filter(action =>
    //     action.type === ActionTypes.CLEARED_SEARCH_RESULTS)
    // )

  const searchQueryRequest$ = searchQuery$
    .map(q => ({
      url: `https://api.github.com/search/users?q=${q}`,
      category: 'query'
    }))

  const searchQueryResponse$ = sources.HTTP
    .select('query')
    .flatten()
    .map(res => res.body.items)
    .map(actions.receiveUsers)

  const clear$ = sources.ACTION
    .filter(action => action.type === ActionTypes.SEARCHED_USERS)
    .filter(action => !!!action.payload.query)
    .map(actions.clearSearchResults);

  return {
    HTTP: xs.merge(request$, searchQueryRequest$),
    ACTION: xs.merge(searchQueryResponse$, clear$, action$),
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
