Handle redux async actions using Cycle.js.

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

See a real world example: [cycle autocomplete](https://github.com/lmatteis/redux-cycle-middleware/blob/master/cycle/index.js).

This middleware intercepts Redux actions and allows us to handle them using Cycle.js in a pure data-flow manner, without side effects. It was heavily inspired by [redux-observable](https://github.com/redux-observable/redux-observable), but instead of `epics` there's an `ACTION` driver observable with the same actions-in, actions-out concept. The main difference is that you can handle them inside the Cycle.js loop and therefore take advantage of the power of Cycle.js functional reactive programming paradigms.

```
npm install
npm run serve
```
