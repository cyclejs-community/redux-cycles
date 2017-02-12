# 0.3.0 - 2017-02-13

**BREAKING CHANGES**
- `createCycleMiddleware()` no longer takes any arguments. Instead you need to call `Cycle.run` yourself (which can be installed via `npm i -s @cycle/xstream-run`) passing it your `main` function and `drivers` explicitly:

```diff
+import {run} from '@cycle/xstream-run';

-const cycleMiddleware = createCycleMiddleware(main, drivers);
+const cycleMiddleware = createCycleMiddleware();
+const { makeActionDriver, makeStateDriver } = cycleMiddleware;

const store = createStore(
  rootReducer,
  applyMiddleware(cycleMiddleware)
);

+run(main, {
+  ACTION: makeActionDriver(),
+  STATE: makeStateDriver()
+})
```

`createCycleMiddleware()` apart from returning the middleware function, also has two function properties attached to it; namely the `makeActionDriver()` and the `makeStateDriver()` which you can use accordingly when you call `Cycle.run`.
