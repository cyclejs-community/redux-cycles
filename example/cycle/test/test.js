import assert from 'assert';
import xs from 'xstream';
import fromDiagram from 'xstream/extra/fromDiagram';
import {mockTimeSource} from '@cycle/time';
import * as ActionTypes from '../../ActionTypes';
import * as actions from '../../actions';

import { fetchReposByUser, searchUsers } from '../';

function assertSourcesSinks(sources, sinks, main, done) {
  const Time = mockTimeSource();
  const _sources = Object.keys(sources)
    .reduce((_sources, sourceKey) => {
      const sourceObj = sources[sourceKey];
      const diagram = Object.keys(sourceObj)[0];
      const sourceOpts = sourceObj[diagram];

      let obj = {};
      if (diagram === 'stream') {
        obj = {
          [sourceKey]: sourceOpts
        }
      } else {
        let firstKey = Object.keys(sourceOpts)[0];
        if (typeof sourceOpts[firstKey] === 'function') {
          obj = {
            [sourceKey]: {
              [firstKey]: () => Time.diagram(diagram, sourceOpts[firstKey]())
            }
          }
        } else {
          obj = {
            [sourceKey]: Time.diagram(diagram, sourceOpts)
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

      return Object.assign(_sinks, { [sinkKey]: Time.diagram(diagram, sinkOpts) });
    }, {});

  const _main = main(_sources);

  Object.keys(sinks)
    .map(sinkKey => Time.assertEqual(_main[sinkKey], _sinks[sinkKey]));

  Time.run(err => {
    expect(err).toBeFalsy();
    done();
  });
}

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

  // describe('searchUsers', () => {
  //   it('should emit HTTP requests given ACTIONs, in an async fashion', (done) => {
  //     const actionSource = {
  //       a: actions.searchUsers('l'),
  //       b: actions.searchUsers('lu'),
  //       c: actions.searchUsers('luc')
  //     };
  //     const httpSource = {
  //       select: () => null
  //     }
  //     const actionSink = {
  //       a: {
  //         url: `https://api.github.com/search/users?q=luc`,
  //         category: 'query'
  //       }
  //     }
  //
  //
  //     assertSourcesSinks({
  //       ACTION: { '-a-b-c------|': actionSource },
  //       HTTP:   { '-------|': httpSource },
  //       Time:   { stream: mockTimeSource() }
  //     }, {
  //       HTTP:   { '--a----|': actionSink }
  //     }, searchUsers, done);
  //   })
  // })
});
