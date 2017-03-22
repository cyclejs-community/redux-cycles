# Redux-cycles

<div align="center">
  <img src="logo.png" alt="Redux + Cycle.js = Love" />
</div>

Handle redux async actions using [Cycle.js](https://cycle.js.org/).

[![Build Status](https://travis-ci.org/cyclejs-community/redux-cycles.svg?branch=master)](https://travis-ci.org/cyclejs-community/redux-cycles)

### Table of Contents

* [Install](#install)
* [Example](#example)
* [Why?](#why)
  * [I already know Redux-thunk](#i-already-know-redux-thunk)
  * [I already know Redux-saga](#i-already-know-redux-saga)
  * [I already know Redux-observable](#i-already-know-redux-observable)
  * [Do I have to buy all-in?](#do-i-have-to-buy-all-in)
* [What's this Cycle thing anyway?](#whats-this-cycle-thing-anyway)
* [What does this look like?](#what-does-this-look-like)
* [Drivers](#drivers)
* [Utils](#utils)
  * [`combineCycles`](#combinecycles)
* [Testing](#testing)
* [Why not just use Cycle.js?](#why-not-just-use-cyclejs)
  * What's the difference between "adding Redux to Cycle.js" and "adding Cycle.js to Redux"?

## Install

`npm install --save redux-cycles`

Then use `createCycleMiddleware()` which returns the redux middleware function with two driver factories attached: `makeActionDriver()` and `makeStateDriver()`. Use them when you call the Cycle `run` function (can be installed via `npm install --save @cycle/run`).

```js
import { run } from '@cycle/run';
import { createCycleMiddleware } from 'redux-cycles';

function main(sources) {
  const pong$ = sources.ACTION
    .filter(action => action.type === 'PING')
    .mapTo({ type: 'PONG' });

  return {
    ACTION: pong$
  }
}

const cycleMiddleware = createCycleMiddleware();
const { makeActionDriver } = cycleMiddleware;

const store = createStore(
  rootReducer,
  applyMiddleware(cycleMiddleware)
);

run(main, {
  ACTION: makeActionDriver()
})
```

By default `@cycle/run` uses `xstream`. If you want to use another streaming library simply import it and use its `run` method instead.

For RxJS:

```js
import { run } from '@cycle/rxjs-run';
```

For Most.js:

```js
import { run } from '@cycle/most-run';
```


## Example

Try out this [JS Bin](https://jsbin.com/bomugapuxi/2/edit?js,output).

See a real world example: [cycle autocomplete](https://github.com/cyclejs-community/redux-cycles/blob/master/example/cycle/index.js).

## Why?

There already are several side-effects solutions in the Redux ecosystem:

* [redux-thunk](https://github.com/gaearon/redux-thunk)
* [redux-saga](https://github.com/redux-saga/redux-saga)
* [redux-ship](https://clarus.github.io/redux-ship/)
* [redux-observable](http://redux-observable.js.org)

Why create yet another one?

The intention with redux-cycles was not to worsen the "JavaScript fatigue".
Rather it provides a solution that solves several problems attributable to the currently available libraries.

* **Respond to actions as they happen, from the side.**

  Redux-thunk forces you to put your logic directly into the action creator.
  This means that all the logic caused by a particular action is located in one place... which doesn't do the readability a favor.
  It also means cross-cutting concerns like analytics get spread out across many files and functions.

  Redux-cycles, instead, joins redux-saga and redux-observable in allowing you to respond to any action without embedding all your logic inside an action creator.

* **Declarative side-effects.**

  For several reasons: code clarity and testability.

  With redux-thunk and redux-observable you just smash everything together.

  Redux-saga does make testing easier to an extent, but side-effects are still ad-hoc.

  Redux-cycles, powered by Cycle.js, introduces an abstraction for reaching into the real world in an explicit manner.

* **Statically typable.**

  Because static typing helps you catch several types of mistakes early on.
  It also allows you to model data and relationships in your program upfront.

  Redux-saga falls short in the typing department... but it's not its fault entirely.
  The JS generator syntax is tricky to type, and even when you try to, you'll find that typing anything inside the `catch`/`finally` blocks will lead to unexpected behavior.

  Observables, on the other hand, are easier to type.

### I already know Redux-thunk

If you already know Redux-thunk, but find it limiting or clunky, Redux-cycles can help you to:

* Move business logic out of action creators, leaving them pure and simple.

You don't necessarily need Redux-cycles if your goal is only that.
You might find Redux-saga to be easier to switch to.

### I already know Redux-saga

Redux-cycles can help you to:

* Handle your side-effects declaratively.

  Side-effect handling in Redux-saga makes testing easier compared to thunks, but you're still ultimately doing glorified function calls.
  The Cycle.js architecture pushes side-effect handling further to the edges of your application, leaving your "cycles" operate on pure streams.

* Type your business logic.

  Most of your business logic lives in sagas... and they are hard/impossible to statically type.
  Have you had silly bugs in your sagas that Flow could have caught?
  I sure had.

### I already know Redux-observable

Redux-cycles appears to be similar to Redux-observable... which it is, due to embracing observables.
So why might you want to try Redux-cycles?

In a word: easier side-effect handling.
With Redux-observable your side-effectful code is scattered through all your epics, *directly*.

It's hard to test.
The code is less legible.

### Do I have to buy all-in?

Should you go ahead and rewrite the entirety of your application in Redux-cycles to take advantage of it?

**Not at all.**

It's not the best strategy really.
What you might want to do instead is to identify a small distinct "category" of side-effectful logic in your current side-effect model, and try transitioning only this part to use Redux-cycles, and see how you feel.

A great example of a small category like that could be:

* local storage calls
* payments API

The domain API layer often is not the easiest one to switch, so if you're thinking that... think of something smaller :)

**Redux-saga** can still be valuable, even if using Redux-cycles.
Certain sagas read crystal clear; sagas that orchestrate user flow.

Like onboarding maybe: after the user signs up, and adds two todos, show a "keep going!" popup.

This kind of logic fits the imperative sagas model *perfectly*, and it will likely look more cryptic if you try to redo it reactively.

Life's not all-or-nothing, you can definitely use Redux-cycles and Redux-saga side-by-side.

## What's this Cycle thing anyway?

[Cycle.js](https://cycle.js.org) is an interesting and unusual way of representing real-world programs.

The program is represented as a pure function, which takes in some *sources* about events in the real world (think a stream of Redux actions), does something with it, and returns *sinks*, aka streams with commands to be performed.

<dl>
  <dt><strong>stream</strong></dt>
  <dd>is like an asynchronous, always-changing array of values</dd>
  <dt><strong>source</strong></dt>
  <dd>is a stream of real-world events as they happen</dd>
  <dt><strong>sink</strong></dt>
  <dd>is a stream of commands to be performed</dd>
  <dt><strong>a cycle</strong> (not to be confused with Cycle.js the library)</dt>
  <dd>is a building block of Cycle.js, a function which takes sources (at least ACTION and STATE), and returns sinks</dd>
</dl>

Redux-cycles provides an `ACTION` source, which is a stream of Redux actions, and listens to the `ACTION` sink.

```javascript
function main(sources) {
  const pong$ = sources.ACTION
    .filter(action => action.type === 'PING')
    .mapTo({ type: 'PONG' });

  return {
    ACTION: pong$
  }
}
```

Custom side-effects are handled similarly — by providing a different source and listening to a different sink.
An example with HTTP requests will be shown later in this readme.

Aside: while the Cycle.js website aims to sell you on Cycle.js for everything—including the view layer—you do *not* have to use Cycle like that.
With Redux-cycles, you are effectively using Cycle only for side-effect management, leaving the view to React, and the state to Redux.

## What does this look like?

Here's how Async is done using [redux-observable](https://github.com/redux-observable/redux-observable).
The problem is that we still have side-effects in our epics (`ajax.getJSON`).
This means that we're still writing imperative code:

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
  const request$ = sources.ACTION
    .filter(action => action.type === FETCH_USER)
    .map(action => ({
      url: `https://api.github.com/users/${action.payload}`,
      category: 'users',
    }));

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

## Drivers

Redux-cycles ships with two drivers:

* `makeActionDriver()`, which is a read-write driver, allowing to react to actions that have just happened, as well as to dispatch new actions.
* `makeStateDriver()`, which is a read-only driver that streams the current redux state. It's a reactive counterpart of the `yield select(state => state)` effect in Redux-saga.

```javascript
import sampleCombine from 'xstream/extra/sampleCombine'

function main(sources) {
  const state$ = sources.STATE;
  const isOdd$ = state$.map(state => state.counter % 2 === 0);
  const increment$ = sources.ACTION
    .filter(action => action.type === INCREMENT_IF_ODD)
    .compose(sampleCombine(isOdd$))
    .map(([ action, isOdd ]) => isOdd ? increment() : null)
    .filter(action => action);

  return {
    ACTION: increment$
  };
}
```

Here's an example on [how the STATE driver works](https://jsbin.com/rohomaxuma/2/edit?js,output).

## Utils

### `combineCycles`

Redux-cycles ships with a `combineCycles` util. As the name suggests, it allows you to take multiple cycle apps (main functions) and combine them into a single one.

**Example**:

```javascript
import { combineCycles } from 'redux-cycles';

// import all your cycle apps (main functions) you intend to use with the middleware:
import fetchReposByUser from './fetchReposByUser';
import searchUsers from './searchUsers';
import clearSearchResults from './clearSearchResults';

export default combineCycles(
  fetchReposByUser,
  searchUsers,
  clearSearchResults
);

```

You can see it used in the provided [example](https://github.com/cyclejs-community/redux-cycles/blob/master/example/cycle/index.js).

## Testing

Since your main Cycle functions are pure dataflow, you can test them quite easily by giving streams as input and expecting specific streams as outputs. Checkout [these example tests](https://github.com/cyclejs-community/redux-cycles/blob/master/example/cycle/test/test.js). Also checkout the [cyclejs/time](https://github.com/cyclejs/time) project, which should work perfectly with redux-cycles.

## Why not just use Cycle.js?

Mainly because Cycle.js does not say anything about how to handle state, so Redux, which has specific rules for state management, is something that can be used along with Cycle.js. This middleware allows you to continue using your Redux/React stack, while allowing you to get your hands wet with FRP and Cycle.js.

### What's the difference between "adding Redux to Cycle.js" and "adding Cycle.js to Redux"?

This middleware doesn't mix Cycle.js with Redux/React at all (like other cycle-redux middlewares do). It behaves completely separately and it's meant to (i) intercept actions, (ii) react upon them functionally and purely, and (iii) dispatch new actions. So you can build your whole app without this middleware, then once you're ready to do async stuff, you can plug it in to handle your async stuff with Cycle.

You should think of this middleware as a different option to handle side-effects in React/Redux apps. Currently there's redux-observable and redux-saga (which uses generators). However, they're both imperative and non-reactive ways of doing async. This middleware is a way of handling your side effects in a pure and reactive way using Cycle.js.
