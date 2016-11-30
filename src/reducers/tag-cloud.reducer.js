import TagCloudActions from '../actions/tag-cloud.actions'
import Rx from 'rxjs'
import { Map } from 'immutable'

/*
 * Merge Actions together to create reducer, this deviates from how redux traditionally works
 */

const initialState = Map({cloudLoading: false})
const TagGraphReducer$ = Rx.Observable.of(initialState);

export default TagGraphReducer$;
