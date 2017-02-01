import * as actions from '../actions';
import * as ActionTypes from '../ActionTypes';

import { combineCycles } from 'redux-cycles';
import xs from 'xstream';

export function fetchReposByUser(sources) {
  const user$ = sources.ACTION
    .filter(action => action.type === ActionTypes.REQUESTED_USER_REPOS)
    .map(action => action.payload.user);

  const request$ = user$
    .map(user => ({
      url: `https://api.github.com/users/${user}/repos`,
      category: 'users'
    }));

  const response$ = sources.HTTP
    .select('users')
    .flatten();

  const action$ = xs.combine(response$, user$)
    .map(arr => actions.receiveUserRepos(arr[1], arr[0].body));

  return {
    ACTION: action$,
    HTTP: request$
  }
}

export function searchUsers(sources) {
  const searchQuery$ = sources.ACTION
    .filter(action => action.type === ActionTypes.SEARCHED_USERS)
    .map(action => action.payload.query)
    .filter(q => !!q)
    .map(q =>
      sources.Time.periodic(800)
        .take(1)
        .mapTo(q)
        .endWhen(
          sources.ACTION.filter(action =>
            action.type === ActionTypes.CLEARED_SEARCH_RESULTS)
        )
    )
    .flatten()

  const searchQueryRequest$ = searchQuery$
    .map(q => ({
      url: `https://api.github.com/search/users?q=${q}`,
      category: 'query'
    }))

  const searchQueryResponse$ = sources.HTTP
    .select('query')
    .flatten()
    .map(res => res.body.items)
    .map(actions.receiveUsers)

  return {
    ACTION: searchQueryResponse$,
    HTTP: searchQueryRequest$
  }
}

function clearSearchResults(sources) {
  const clear$ = sources.ACTION
    .filter(action => action.type === ActionTypes.SEARCHED_USERS)
    .filter(action => !!!action.payload.query)
    .map(actions.clearSearchResults);

  return {
    ACTION: clear$
  }
}

export default combineCycles(fetchReposByUser, searchUsers, clearSearchResults);
