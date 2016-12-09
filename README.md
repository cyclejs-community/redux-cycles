Handle redux async actions using Cycle.js.

# Install

`npm install redux-cycle-middleware`

Then use `createCycleMiddleware()` which takes as first argument your `main` Cycle.js function, and second argument the Cycle.js drivers you want to use:

```js
import { createCycleMiddleware } from 'redux-cycle-middleware';

function main(sources) {  
  const pong$ = sources.ACTION
    .filter(action => action.type === 'PING')
    .mapTo({ type: 'PONG' });

  return {
    ACTION: pong$
  }
}

const cycleMiddleware = createCycleMiddleware(main, { HTTP: makeHTTPDriver() });

const store = createStore(
  rootReducer,
  applyMiddleware(cycleMiddleware)
);
```

# Example

See a real world example: [cycle autocomplete](https://github.com/lmatteis/redux-cycle-middleware/blob/master/example/cycle/index.js).

# What is this?

Here's how Async is done using [redux-observable](https://github.com/redux-observable/redux-observable). The problem is that we still have side-effects in our epics (`ajax.getJSON`). This means that we're still writing imperative code:

```js
const fetchUserEpic = action$ =>
  action$.ofType(FETCH_USER)
    .mergeMap(action =>
      ajax.getJSON(`https://api.github.com/users/${action.payload}`)
        .map(fetchUserFulfilled)
    );
```

With Cycle.js we can push them even further outside our app using drivers, allowing us to write entirely declarative code:

```js
function main(sources) {  
  const request$ = sources.ACTION.ofType(FETCH_USER)
    .map(action => {
      url: `https://api.github.com/users/${action.payload}`,
      category: 'users',
    });

  const action$ = sources.HTTP
    .select('users')
    .flatten()
    .map(fetchUserFulfilled);

  return {
    ACTION: action$,
    HTTP: request$
  };
}
```

This middleware intercepts Redux actions and allows us to handle them using Cycle.js in a pure data-flow manner, without side effects. It was heavily inspired by [redux-observable](https://github.com/redux-observable/redux-observable), but instead of `epics` there's an `ACTION` driver observable with the same actions-in, actions-out concept. The main difference is that you can handle them inside the Cycle.js loop and therefore take advantage of the power of Cycle.js functional reactive programming paradigms.

## Why not just use Cycle.js?

Mainly because Cycle.js does not say anything about how to handle state, so Redux, which has specific rules for state management, is something that can be used along with Cycle.js. This middleware allows you to continue using your Redux/React stack, while allowing you to get your hands wet with FRP and Cycle.js.

## What's the difference between "adding Redux to Cycle.js" and "adding Cycle.js to Redux"?

This middleware doesn't mix Cycle.js with Redux/React at all (like other cycle-redux middlewares do). It behaves completely separate and it's meant to (i) intercept actions, (ii) react upon them functionally and purely, and (iii) dispatch new actions. So you can build your whole app without this middleware, then once you're ready to do async stuff, you can plug it in to handle your async stuff with Cycle.

Also you should think of this middleware as a different option to handle side-effects in React/Redux apps. Currently there's redux-saga (which uses generators) and redux-observable (as I mentioned in the README of the project). However, they're both imperative (non-pure) ways of doing async. This middleware is a way of handling your side effects in a pure way using Cycle.js.
