import * as actions from '../actions';
import * as ActionTypes from '../ActionTypes';

import xs from 'xstream';

function fetchReposByUser(sources) {
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

function searchUsers(sources) {
  const searchQuery$ = sources.ACTION
    .filter(action => action.type === ActionTypes.SEARCHED_USERS)
    .map(action => action.payload.query)
    .filter(q => !!q)
    .map(q =>
      xs.periodic(800)
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

export default function main(sources) {
  const _fetchReposByUser = fetchReposByUser(sources);
  const _searchUsers = searchUsers(sources);

  const clear$ = sources.ACTION
    .filter(action => action.type === ActionTypes.SEARCHED_USERS)
    .filter(action => !!!action.payload.query)
    .map(actions.clearSearchResults);

  return {
    HTTP: xs.merge(_fetchReposByUser.HTTP, _searchUsers.HTTP),
    ACTION: xs.merge(_fetchReposByUser.ACTION, _searchUsers.ACTION, clear$),
  };
}
