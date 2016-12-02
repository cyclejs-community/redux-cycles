import {run} from '@cycle/xstream-run';
import xs from 'xstream';

export function createCycleMiddleware(mainFn, drivers) {

  return store => {
    return next => {
      var mainListener = null;

      function cycleDriver(outgoing$) {

        outgoing$.addListener({
          next: outgoing => {
            store.dispatch(outgoing);
          },
          error: () => {},
          complete: () => {},
        });

        return xs.create({
          start: listener => {
            mainListener = listener;
          },
          stop: () => {},
        });
      }

      drivers.ACTION = cycleDriver;
      run(mainFn, drivers);

      return action => {
        let result = next(action)
        mainListener.next(action);
        return result
      }
    }
  }
}
