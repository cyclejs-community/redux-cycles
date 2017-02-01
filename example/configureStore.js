import { createStore, applyMiddleware, compose } from 'redux';
import { browserHistory } from 'react-router';
import { routerMiddleware } from 'react-router-redux';
import rootReducer from './reducers';
import main from './cycle';
import { createCycleMiddleware } from 'redux-cycles';
import {makeHTTPDriver} from '@cycle/http';
import {timeDriver} from '@cycle/time';

const cycleMiddleware = createCycleMiddleware(main, {
  Time: timeDriver,
  HTTP: makeHTTPDriver()
});

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
