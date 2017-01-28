import { createCycleMiddleware } from '../';
import { createStore, applyMiddleware } from 'redux';
import expect from 'expect'
import xs from 'xstream';

function initStore(main, drivers, reducer = null) {
  const rootReducer = reducer || ((state = [], action) => state.concat(action));
  const cycleMiddleware = createCycleMiddleware(main, drivers);
  const store = createStore(
    rootReducer,
    applyMiddleware(cycleMiddleware)
  );
  return store;
}

describe('Redux cycle middleware', () => {
  it('dispatches a PING to see whether the middleware dispatches a PONG', (done) => {
    function main(sources) {
      const pong$ = sources.ACTION
        .filter(action => action.type === 'PING')
        .mapTo({ type: 'PONG' });

      return {
        ACTION: pong$
      }
    }

    const expectedActions = [
      { type: '@@redux/INIT' },
      { type: 'PING' },
      { type: 'PONG' }
    ]
    const store = initStore(main, {})

    store.dispatch({ type: 'PING' })

    expect(store.getState()).toEqual(expectedActions)

    done();
  })

  it('dispatches a PING to see whether the middleware dispatches a PONG after 10 milliseconds', (done) => {
    function main(sources) {
      const pong$ = sources.ACTION
        .filter(action => action.type === 'PING')
        .map(a =>
            xs.periodic(10)
                .take(1)
                .mapTo({ type: 'PONG' })
        )
        .flatten();

      return {
        ACTION: pong$
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

    setTimeout(() =>
        expect(store.getState()).toEqual(expectedActions)
        &&
        done()
    , 10)
  })

  it('dispatches INCREMENT_ASYNC and INCREMENT_IF_ODD actions to check whether state updates correctly', (done) => {
    function main(sources) {
      const state$ = sources.STATE;
      const isOdd$ = state$
        .map(state => state % 2 === 1)
        .take(1);

      const incrementIfOdd$ = sources.ACTION
        .filter(action => action.type === 'INCREMENT_IF_ODD')
        .map(action =>
          isOdd$
        )
        .flatten()
        .filter(isOdd => isOdd)
        .mapTo({ type: 'INCREMENT' });

      const increment$ = sources.ACTION
        .filter(action => action.type === 'INCREMENT_ASYNC')
        .mapTo({ type: 'INCREMENT' });

      const decrement$ = sources.ACTION
        .filter(action => action.type === 'DECREMENT_ASYNC')
        .mapTo({ type: 'DECREMENT' });

      const both$ = xs.merge(increment$, decrement$)

      return {
        ACTION: xs.merge(both$, incrementIfOdd$)
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
    expect(store.getState()).toEqual(1);
    store.dispatch({ type: 'INCREMENT_ASYNC' })
    expect(store.getState()).toEqual(2);
    store.dispatch({ type: 'INCREMENT_ASYNC' })
    expect(store.getState()).toEqual(3);
    store.dispatch({ type: 'INCREMENT_IF_ODD' })
    expect(store.getState()).toEqual(4);
    store.dispatch({ type: 'INCREMENT_IF_ODD' })
    expect(store.getState()).toEqual(4);
    store.dispatch({ type: 'INCREMENT_ASYNC' })
    expect(store.getState()).toEqual(5);

    done();

  })
})
