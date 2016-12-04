Handle redux async actions using Cycle.js.

```js
// Here's how Async is done using redux-observable.
// The problem is that we still have side-effects in our epics (ajax.getJSON)
const fetchUserEpic = action$ =>
  action$.ofType(FETCH_USER)
    .mergeMap(action =>
      ajax.getJSON(`https://api.github.com/users/${action.payload}`)
        .map(fetchUserFulfilled)
    );

// With Cycle.js we can push them even further outside our app using drivers.
function main(sources) {  
  let request$ = sources.ACTION.ofType(FETCH_USER)
    .map(action => {
      url: `https://api.github.com/users/${action.payload}`,
      category: 'users',
    });

  let action$ = sources.HTTP
    .select('users')
    .flatten()
    .map(fetchUserFulfilled);

  return {
    ACTION: action$,
    HTTP: request$
  };
}
```

See a real world example [cycle autocomplete](https://github.com/lmatteis/redux-cycle-middleware/blob/master/cycle/index.js).

This middleware intercepts Redux actions and allows us to handle them using Cycle.js in a pure dataflow manner, without side effects.

```
npm install
npm run serve
```
