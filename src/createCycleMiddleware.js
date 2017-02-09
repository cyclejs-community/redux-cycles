import {run} from '@cycle/xstream-run';
import xs from 'xstream';

let storeListener = null;

export function createCycleMiddleware() {
  return store =>
    next => {
      return action => {
        let result = next(action)
        if (storeListener) {
          storeListener.next({ action, state: store.getState() });
        }
        return result
      }
    }
}

export function makeStoreDriver(store) {
  return function storeDriver(outgoing$) {
    outgoing$.addListener({
      next: outgoing => {
        store.dispatch(outgoing);
      },
      error: () => {},
      complete: () => {},
    });

    return xs.create({
      start: listener => {
        storeListener = listener;
      },
      stop: () => {},
    });
  }
}
