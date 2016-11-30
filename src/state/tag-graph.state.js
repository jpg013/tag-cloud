import { Observable } from 'rxjs/Observable'
import { Map, List } from 'immutable'

const getDataPage = function(pageNumber) {
    return new Promise(function(resolve, reject) {
        var request = new XMLHttpRequest();

        request.open('GET', `http://swapi.co/api/starships/?page=${pageNumber}`);
        request.responseType = 'json';

        request.onload = function() {
            if (request.status === 200) {
                resolve(request.response);
            } else {
                reject(Error('Data didn\'t load successfully; error code:' + request.statusText));
            }
        };

        request.onerror = function() {
            reject(Error('There was a network error.'));
        };

        request.send();
    });
}

function TagGraphState$() {
    let fetchData$ = Observable.range(1, 4)
      .map(x => getDataPage(x))
      .bufferCount(4);

    let tags$ = fetchData$
      .mergeMap(x => Observable.forkJoin(x))
      .map(x => { return x.reduce((acc, cur) => { return acc.concat(cur.results) }, []) })
      .map(payload => state => state.set('tags', List(payload)))

    let state$ = Observable.merge(tags$)
      .scan((state, reducer) => { return reducer(state) }, Map())
      .publishReplay(1)
      .refCount();

    return state$;
}

export default TagGraphState$
