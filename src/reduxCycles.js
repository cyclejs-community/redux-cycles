import xs from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';

export default function reduxCycles () {
  let store = null;
  let actionListener = null;
  let stateListener = null;

  function makeActionDriver () {
    return function actionDriver(outgoing$) {
      outgoing$.addListener({
        next: outgoing => {
          store.dispatch(outgoing);
        },
        error: () => {},
        complete: () => {},
      });

      return adapt(xs.create({
        start: listener => {
          actionListener = listener;
        },
        stop: () => {},
      }));
    }
  }

  function makeStateDriver () {
    const isSame = {};
    const getCurrent = store.getState;
    return function stateDriver() {
      return adapt(xs.create({
        start: listener => {
          stateListener = listener;
        },
        stop: () => {},
      })
      .fold((prevState, currState) => {
        if (prevState === getCurrent) {
          prevState = getCurrent();
        }
        if (prevState === currState) {
          return isSame;
        }
        return currState;
      }, getCurrent)
      .map(state => state === getCurrent ? getCurrent() : state)
      .filter(state => state !== isSame));
    }
  }

  function createCycleMiddleware () {
    return _store => {
      store = _store;
      return next => {
        return action => {
          let result = next(action)
          if (actionListener) {
            actionListener.next(action);
          }
          if (stateListener) {
            stateListener.next(store.getState());
          }
          return result
        }
      }
    }
  }

  return {
    createCycleMiddleware,
    makeActionDriver,
    makeStateDriver
  }
}
