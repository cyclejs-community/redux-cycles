import assert from 'assert';
import xs from 'xstream';
import fromDiagram from 'xstream/extra/fromDiagram';
import * as ActionTypes from '../../ActionTypes';
import * as actions from '../../actions';

import { fetchReposByUser } from '../';

function assertEqualStream(actual, expected, done) {
  let calledComplete = 0;
  let completeStore = {};

  function complete (label, entries) {
    calledComplete++;

    completeStore[label] = entries;

    if (calledComplete === 2) {
      assert.deepEqual(completeStore['actual'], completeStore['expected']);
      done()
    }
  }
  const completeListener = (label) => {
    const entries = [];

    return {
      next (ev) {
        entries.push({type: 'next', value: ev});
      },

      complete () {
        entries.push({type: 'complete'});

        complete(label, entries)
      },

      error (error) {
        entries.push({type: 'error', error});

        complete(label, entries);
      }
    }
  }
  actual.addListener(completeListener('actual'))
  expected.addListener(completeListener('expected'))
}

function assertSourcesSinks(sources, sinks, main, done) {
  const _sources = Object.keys(sources)
    .reduce((_sources, sourceKey) => {
      const sourceObj = sources[sourceKey];
      const diagram = Object.keys(sourceObj)[0];
      const sourceOpts = sourceObj[diagram];

      let obj = {};
      if (sourceOpts.values) {
        obj = {
          [sourceKey]: fromDiagram(diagram, sourceOpts)
        }
      } else {
        // it's a function
        let firstKey = Object.keys(sourceOpts)[0];
        obj = {
          [sourceKey]: {
            [firstKey]: () => fromDiagram(diagram, sourceOpts[firstKey]())
          }
        }
      }
      return Object.assign(_sources, obj);
    }, {})

  const _sinks = Object.keys(sinks)
    .reduce((_sinks, sinkKey) => {
      const sinkObj = sinks[sinkKey];
      const diagram = Object.keys(sinkObj)[0];
      const sinkOpts = sinkObj[diagram];

      return Object.assign(_sinks, { [sinkKey]: fromDiagram(diagram, sinkOpts) });
    }, {});

  const _main = main(_sources);

  Object.keys(sinks)
    .map(sinkKey => assertEqualStream(_main[sinkKey], _sinks[sinkKey], done));
}

describe('Cycles', function() {
  describe('fetchReposByUser', function() {
    it('should emit HTTP requests given ACTIONs', function(done) {
      const user1 = 'lmatteis';
      const user2 = 'luca';

      const actionSourcesOpts = {
        values: {
          a: actions.requestReposByUser(user1),
          b: actions.requestReposByUser(user2)
        }
      };

      const httpSourcesOpts = {
        select: () => null
      };

      const httpSinksOpts = {
        values: {
          x: {
            url: `https://api.github.com/users/${user1}/repos`,
            category: 'users'
          },
          y: {
            url: `https://api.github.com/users/${user2}/repos`,
            category: 'users'
          }
        }
      };

      // Asserts that the sources, trigger the provided sinks,
      // when executing the fetchReposByUser function
      assertSourcesSinks({
        ACTION: { 'ab|': actionSourcesOpts },
        HTTP:   { '--|': httpSourcesOpts }
      }, {
        HTTP:   { 'xy|': httpSinksOpts }
      }, fetchReposByUser, done);

    });

    it('should emit ACTION given HTTP response', function(done) {
      const user1 = 'lmatteis';
      const user2 = 'luca';

      const response = { body: { foo: 'bar' } };

      const actionSourcesOpts = {
        values: {
          a: actions.requestReposByUser(user1)
        }
      };

      const httpSourcesOpts = {
        select: () => ({
          values: {
            r: xs.of(response)
          }
        })
      };

      const actionSinksOpts = {
        values: {
          a: actions.receiveUserRepos(user1, response.body)
        }
      };

      assertSourcesSinks({
        ACTION: { 'a|': actionSourcesOpts },
        HTTP:   { 'r|': httpSourcesOpts }
      }, {
        ACTION: { 'a|': actionSinksOpts }
      }, fetchReposByUser, done);

    });
  });
});
