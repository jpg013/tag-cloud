import './index.css'
import React from 'react'
import ReactDOM from 'react-dom'
import TagCloud from './tag-cloud.component.jsx'
import TagGraphState$ from './state/tag-graph.state'

ReactDOM.render(
  <TagCloud state$={TagGraphState$()} />,
  document.getElementById('root')
);
