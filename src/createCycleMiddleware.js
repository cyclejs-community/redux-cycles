import xs from 'xstream'

export default function createCycleMiddleware () {
  let store = null
  let actionListener = null
  let stateListener = null

  const cycleMiddleware = _store => {
    store = _store
    return next => {
      return action => {
        let result = next(action)
        if (actionListener) {
          actionListener.next(action)
        }
        if (stateListener) {
          stateListener.next(store.getState())
        }
        return result
      }
    }
  }

  cycleMiddleware.makeActionDriver = () => {
    return function actionDriver(outgoing$) {
      outgoing$.addListener({
        next: outgoing => {
          if (store) {
            store.dispatch(outgoing)
          }
        },
        error: () => {},
        complete: () => {},
      })

      return xs.create({
        start: listener => {
          actionListener = listener
        },
        stop: () => {},
      })
    }
  }

  cycleMiddleware.makeStateDriver = () => {
    const isSame = {}
    return function stateDriver() {
      const getCurrent = store.getState
      return xs.create({
        start: listener => {
          stateListener = listener
        },
        stop: () => {},
      })
      .fold((prevState, currState) => {
        if (prevState === getCurrent) {
          prevState = getCurrent()
        }
        if (prevState === currState) {
          return isSame
        }
        return currState
      }, getCurrent)
      .map(state => state === getCurrent ? getCurrent() : state)
      .filter(state => state !== isSame)
    }
  }

  return cycleMiddleware
}
