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
// sources.ACTION is the same action stream used in "epics"
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

This allows to build redux apps entirely without side effects, as they are handled by Cycle.js drivers.

To see an example, checkout the `cycle` folder for a more complex autocomplete app. And to use it run:

```
npm install
npm run serve
```
