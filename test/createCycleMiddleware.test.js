/* eslint-disable no-undef */
/* eslint-disable no-console */
import { createCycleMiddleware, combineCycles } from '../'
import { createStore, applyMiddleware } from 'redux'
import xs from 'xstream'
import {run} from '@cycle/run'
import {run as rxjsRun} from '@cycle/rxjs-run'
import {Observable} from 'rxjs/Rx'
import {setAdapt} from '@cycle/run/lib/adapt'
jest.useFakeTimers()

function initStore(main, drivers, reducer = null, r = run) {
  const rootReducer = reducer || ((state = [], action) => state.concat(action))

  const cycleMiddleware = createCycleMiddleware()
  const { makeActionDriver, makeStateDriver } = cycleMiddleware
  const store = createStore(
    rootReducer,
    applyMiddleware(cycleMiddleware)
  )

  r(main, {
    ACTION: makeActionDriver(),
    STATE: makeStateDriver()
  })

  return store
}

describe('Redux cycle middleware xstream', () => {
  beforeEach(() => setAdapt(stream => stream))

  it('dispatches a PING to see whether the middleware dispatches a PONG', (done) => {
    function main(sources) {
      const pong$ = sources.ACTION
        .filter(action => action.type === 'PING')
        .mapTo({ type: 'PONG' })

      return {
        ACTION: pong$
      }
    }

    const expectedActions = [
      { type: '@@redux/INIT' },
      { type: 'PING' },
      { type: 'PONG' }
    ]
    const store = initStore(combineCycles(main), {})

    store.dispatch({ type: 'PING' })

    expect(store.getState()).toMatchObject(expectedActions)

    done()
  })

  it('dispatches a PING to see whether the middleware dispatches a PONG after 10 seconds', (done) => {
    function main(sources) {
      const pong$ = sources.ACTION
        .filter(action => action.type === 'PING')
        .map(() =>
          xs.periodic(10000)
            .take(1)
            .mapTo({ type: 'PONG' })
        )
        .flatten()

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

    expect(store.getState()).not.toMatchObject(expectedActions)
    jest.runAllTimers()
    expect(setInterval.mock.calls[0][1]).toBe(10000)
    expect(store.getState()).toMatchObject(expectedActions)
    done()
  })

  it('dispatches INCREMENT_ASYNC and INCREMENT_IF_ODD actions to check whether state updates correctly', (done) => {
    function main(sources) {
      const state$ = sources.STATE
      const isOdd$ = state$
        .map(state => state % 2 === 1)
        .take(1)

      const incrementIfOdd$ = sources.ACTION
        .filter(action => action.type === 'INCREMENT_IF_ODD')
        .map(() =>
          isOdd$
        )
        .flatten()
        .filter(isOdd => isOdd)
        .mapTo({ type: 'INCREMENT' })

      const increment$ = sources.ACTION
        .filter(action => action.type === 'INCREMENT_ASYNC')
        .mapTo({ type: 'INCREMENT' })

      const decrement$ = sources.ACTION
        .filter(action => action.type === 'DECREMENT_ASYNC')
        .mapTo({ type: 'DECREMENT' })

      const both$ = xs.merge(increment$, decrement$)

      return {
        ACTION: xs.merge(both$, incrementIfOdd$)
      }
    }

    const store = initStore(main, {}, (state = 0, action) => {
      switch (action.type) {
      case 'INCREMENT':
        return state + 1
      case 'DECREMENT':
        return state - 1
      default:
        return state
      }
    })

    store.dispatch({ type: 'INCREMENT_ASYNC' })
    expect(store.getState()).toBe(1)
    store.dispatch({ type: 'INCREMENT_ASYNC' })
    expect(store.getState()).toBe(2)
    store.dispatch({ type: 'INCREMENT_ASYNC' })
    expect(store.getState()).toBe(3)
    store.dispatch({ type: 'INCREMENT_IF_ODD' })
    expect(store.getState()).toBe(4)
    store.dispatch({ type: 'INCREMENT_IF_ODD' })
    expect(store.getState()).toBe(4)
    store.dispatch({ type: 'INCREMENT_ASYNC' })
    expect(store.getState()).toBe(5)

    done()

  })
})

describe('Redux cycle middleware RxJS', () => {
  beforeEach(() => setAdapt(stream => Observable.from(stream)))

  it('uses rxjs-run with Cycle Unified', (done) => {
    function main(sources) {
      const pong$ = sources.ACTION
        .filter(action => action.type === 'PING')
        .do(_ => _) // do() only exists in RxJS
        .mapTo({ type: 'PONG' })

      return {
        ACTION: pong$
      }
    }

    const store = initStore(combineCycles(main), {}, null, rxjsRun)

    store.dispatch({ type: 'PING' })

    const expectedActions = [
      { type: '@@redux/INIT' },
      { type: 'PING' },
      { type: 'PONG' }
    ]
    expect(store.getState()).toMatchObject(expectedActions)

    done()

  })
})
