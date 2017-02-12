import { createStore, applyMiddleware, compose } from 'redux';
import { browserHistory } from 'react-router';
import { routerMiddleware } from 'react-router-redux';
import rootReducer from './reducers';
import main from './cycle';
import { createCycleMiddleware } from 'redux-cycles';
import {run} from '@cycle/xstream-run';
import {makeHTTPDriver} from '@cycle/http';
import {timeDriver} from '@cycle/time';

export default function configureStore() {
  const cycleMiddleware = createCycleMiddleware();
  const { makeActionDriver, makeStateDriver } = cycleMiddleware;

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

  run(main, {
    ACTION: makeActionDriver(),
    STATE: makeStateDriver(),
    Time: timeDriver,
    HTTP: makeHTTPDriver(),
  })
  
  return store;
}
