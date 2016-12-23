
import assert from 'assert';
import xs from 'xstream';
import fromDiagram from 'xstream/extra/fromDiagram';
import * as ActionTypes from '../../ActionTypes';
import * as actions from '../../actions';

import { fetchReposByUser } from '../';

describe('Cycles', function() {
  describe('fetchReposByUser', function() {
    it('should emit HTTP request given ACTION, and should emit ACTION given HTTP response', function(done) {
      const user1 = 'lmatteis';
      const response = { body: { foo: 'bar' } };

      const ACTION = fromDiagram('a-|', {
        values: {
          a: actions.requestReposByUser(user1)
        }
      });

      const HTTP = {
        select: () => fromDiagram('-a|', {
          values: {
            a: xs.of(response)
          }
        })
      }

      const sinks = fetchReposByUser({
        ACTION,
        HTTP
      });

      const ACTIONexpected = [
        actions.receiveUserRepos(user1, response.body)
      ];

      const HTTPexcepted = [
        {
          url: `https://api.github.com/users/${user1}/repos`,
          category: 'users'
        },
      ];

      var stack = 2;
      sinks.HTTP.addListener({
        next (value) {
          assert.deepEqual(value, HTTPexcepted.shift())
        },

        complete () {
          stack--;
          if (stack == 0) done()
        }
      });

      sinks.ACTION.addListener({
        next (value) {
          assert.deepEqual(value, ACTIONexpected.shift())
        },

        complete () {
          stack--;
          if (stack == 0) done()
        }
      });
    });
  });
});
