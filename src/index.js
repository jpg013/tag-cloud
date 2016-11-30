import './index.css'
import React from 'react'
import ReactDOM from 'react-dom'
import TagCloud from './components/tag-cloud.component.jsx'
import TagGraphState$ from './state/tag-graph.state'

import 'rxjs/add/observable/range'
import 'rxjs/add/observable/merge'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/bufferCount'
import 'rxjs/add/operator/mergeMap'
import 'rxjs/add/observable/forkJoin'
import 'rxjs/add/operator/scan'
import 'rxjs/add/operator/publishReplay'


ReactDOM.render(
  <TagCloud state$={TagGraphState$()} />,
  document.getElementById('root')
);
