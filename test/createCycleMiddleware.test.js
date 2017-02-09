import { createCycleMiddleware, makeStoreDriver } from '../';
import { createStore, applyMiddleware } from 'redux';
import xs from 'xstream';
import {run} from '@cycle/xstream-run';
jest.useFakeTimers();

function initStore(main, drivers, reducer = null) {
  const rootReducer = reducer || ((state = [], action) => state.concat(action));
  const cycleMiddleware = createCycleMiddleware();

  const store = createStore(
    rootReducer,
    applyMiddleware(cycleMiddleware)
  );

  run(main, {
    STORE: makeStoreDriver(store)
  });

  return store;
}

describe('Redux cycle middleware', () => {
  it('dispatches a PING to see whether the middleware dispatches a PONG', (done) => {
    function main(sources) {
      const pong$ = sources.STORE
        .filter(({ action }) => action.type === 'PING')
        .mapTo({ type: 'PONG' });

      return {
        STORE: pong$
      }
    }

    const expectedActions = [
      { type: '@@redux/INIT' },
      { type: 'PING' },
      { type: 'PONG' }
    ]
    const store = initStore(main, {})

    store.dispatch({ type: 'PING' })

    expect(store.getState()).toMatchObject(expectedActions)

    done();
  })

  it('dispatches a PING to see whether the middleware dispatches a PONG after 10 seconds', (done) => {
    function main(sources) {
      const pong$ = sources.STORE
        .filter(({ action }) => action.type === 'PING')
        .map(a =>
            xs.periodic(10000)
                .take(1)
                .mapTo({ type: 'PONG' })
        )
        .flatten();

      return {
        STORE: pong$
      }
    }

    const expectedActions = [
      { type: '@@redux/INIT' },
      { type: 'PING' },
      { type: 'PONG' }
    ]
    const store = initStore(main, {})

    store.dispatch({ type: 'PING' })

    expect(store.getState()).toEqual([
      { type: '@@redux/INIT' },
      { type: 'PING' }
    ])

    expect(store.getState()).not.toMatchObject(expectedActions);
    jest.runAllTimers();
    expect(setInterval.mock.calls[0][1]).toBe(10000);
    expect(store.getState()).toMatchObject(expectedActions);
    done();
  })

  it('dispatches INCREMENT_ASYNC and INCREMENT_IF_ODD actions to check whether state updates correctly', (done) => {
    function main(sources) {
      const incrementIfOdd$ = sources.STORE
        .filter(({ action, state }) =>
          action.type === 'INCREMENT_IF_ODD' && state % 2 === 1
        )
        .mapTo({ type: 'INCREMENT' });

      const increment$ = sources.STORE
        .filter(({ action }) => action.type === 'INCREMENT_ASYNC')
        .mapTo({ type: 'INCREMENT' });

      const decrement$ = sources.STORE
        .filter(({ action }) => action.type === 'DECREMENT_ASYNC')
        .mapTo({ type: 'DECREMENT' });

      const both$ = xs.merge(increment$, decrement$)

      return {
        STORE: xs.merge(both$, incrementIfOdd$)
      }
    }

    const store = initStore(main, {}, (state = 0, action) => {
      switch (action.type) {
        case 'INCREMENT':
          return state + 1;
        case 'DECREMENT':
          return state - 1;
        default:
          return state;
      }
    })

    store.dispatch({ type: 'INCREMENT_ASYNC' })
    expect(store.getState()).toBe(1);
    store.dispatch({ type: 'INCREMENT_ASYNC' })
    expect(store.getState()).toBe(2);
    store.dispatch({ type: 'INCREMENT_ASYNC' })
    expect(store.getState()).toBe(3);
    store.dispatch({ type: 'INCREMENT_IF_ODD' })
    expect(store.getState()).toBe(4);
    store.dispatch({ type: 'INCREMENT_IF_ODD' })
    expect(store.getState()).toBe(4);
    store.dispatch({ type: 'INCREMENT_ASYNC' })
    expect(store.getState()).toBe(5);

    done();

  })
})
