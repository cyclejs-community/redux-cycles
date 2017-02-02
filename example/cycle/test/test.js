import assert from 'assert';
import xs from 'xstream';

import { assertSourcesSinks } from './helpers';
import * as ActionTypes from '../../ActionTypes';
import * as actions from '../../actions';

import { fetchReposByUser, searchUsers } from '../';

describe('Cycles', function() {
  describe('fetchReposByUser', function() {
    it('should emit HTTP requests given ACTIONs', function(done) {
      const user1 = 'lmatteis';
      const user2 = 'luca';

      const actionSource = {
        a: actions.requestReposByUser(user1),
        b: actions.requestReposByUser(user2)
      };

      const httpSource = {
        select: () => null
      }

      const httpSink = {
        x: {
          url: `https://api.github.com/users/${user1}/repos`,
          category: 'users'
        },
        y: {
          url: `https://api.github.com/users/${user2}/repos`,
          category: 'users'
        }
      };

      // Asserts that the sources, trigger the provided sinks,
      // when executing the fetchReposByUser function
      assertSourcesSinks({
        ACTION: { 'ab|': actionSource },
        HTTP:   { '--|': httpSource }
      }, {
        HTTP:   { 'xy|': httpSink }
      }, fetchReposByUser, done);

    });

    it('should emit ACTION given HTTP response', function(done) {
      const user1 = 'lmatteis';
      const user2 = 'luca';

      const response = { body: { foo: 'bar' } };

      const actionSource = {
        a: actions.requestReposByUser(user1)
      };

      const httpSource = {
        select: () => ({
          r: xs.of(response)
        })
      };

      const actionSink = {
        a: actions.receiveUserRepos(user1, response.body)
      };

      assertSourcesSinks({
        ACTION: { 'a|': actionSource },
        HTTP:   { 'r|': httpSource }
      }, {
        ACTION: { 'a|': actionSink }
      }, fetchReposByUser, done);

    });
  });

  describe('searchUsers', () => {
    it('should emit HTTP requests given many debounced ACTIONs, and should emit ACTION given HTTP response', (done) => {
      const actionSource = {
        a: actions.searchUsers('l'),
        b: actions.searchUsers('lu'),
        c: actions.searchUsers('luc')
      };
      const httpSource = {
        select: () => ({
          r: xs.of({ body: { items: ['foo'] } })
        })
      }
      const httpSink = {
        a: {
          url: `https://api.github.com/search/users?q=luc`,
          category: 'query'
        }
      }
      const actionSink = {
        r: actions.receiveUsers(['foo']),
      }

      assertSourcesSinks({
        ACTION: { '-a-b-c----|': actionSource },
        HTTP:   { '---r------|': httpSource },
      }, {
        HTTP:   { '---------a|': httpSink },
        ACTION: { '---r------|': actionSink },
      }, searchUsers, done, { interval: 200 });
    })
  })
});
