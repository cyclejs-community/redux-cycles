import {run} from '@cycle/xstream-run';
import xs from 'xstream';

export function createCycleMiddleware(mainFn, drivers) {
  return store => {
    return next => {
      let actionListener = null;
      let stateListener = null;

      function actionDriver(outgoing$) {
        outgoing$.addListener({
          next: outgoing => {
            store.dispatch(outgoing);
          },
          error: () => {},
          complete: () => {},
        });

        return xs.create({
          start: listener => {
            actionListener = listener;
          },
          stop: () => {},
        });
      }

      const isSame = {};
      const getCurrent = store.getState;
      function stateDriver() {
        return xs.create({
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
        .filter(state => state !== isSame);
      }

      drivers.ACTION = actionDriver;
      drivers.STATE = stateDriver;
      run(mainFn, drivers);

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
