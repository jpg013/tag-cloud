import React, {Component, PropTypes} from 'react'
import TagCloudActions from './actions/tag-cloud.actions'
import './tag-cloud.component.css'
import { List, is } from 'immutable'
import LoadingDots from './components/loading-dots.component'
import { getTagColorScale } from './services/tag-cloud-color.service'
import { scaleLog, scaleLinear, scalePow, select as d3select } from 'd3';
import TagCloudDrawingService from './services/tag-cloud-drawing.service'

class TagCloud extends Component {
  constructor(props) {
      super(props)
      this.subscribes = List();
      this.maxScreenPixels = 1211.71,
      this.drawAttempt = 1;
      this.boardDimensions = {
        height: 0,
        width: 0
      }
      this.screenRatio = 1;
      this.maxDrawAttempts = 10;
      this.cloud = TagCloudDrawingService();
  }

  static propTypes = {
    state$: PropTypes.object.isRequired
  }

  componentWillMount() {
      this.state = {
        loading: true
      }
  }

  componentDidMount() {
      this.setCloudDimensions();
      let subscribe = this.props.state$.subscribe(this.onState.bind(this));
      this.subscribes = this.subscribes.push(subscribe);
  }

  setCloudDimensions() {
      if (!this.refs.$tagCloudContainer) { return; }

      const cloudRect = this.refs.$tagCloudContainer.getBoundingClientRect();

      this.boardDimensions = {
        height: cloudRect.height,
        width: cloudRect.width
      };

      let userScreenPixels = Math.sqrt(this.boardDimensions.width * this.boardDimensions.height);

      this.screenRatio = userScreenPixels / this.maxScreenPixels;
      this.screenRatio = (this.screenRatio < 0.75) ? 0.75 : this.screenRatio;
  }

  onState(x) {
      if (is(this.tags, x.get('tags'))) { return; }

      this.tags = this.sortTags(x.get('tags'));
      this.resetDrawAttempt();
      this.buildTagCloud();

  }

  sortTags(tags) {
      return tags
        .filter(x => x.length !== 'unknown')
        .sort((a, b) => {
          let aLength = parseFloat(a.length.replace(',', ''));
          let bLength = parseFloat(b.length.replace(',', ''));

          // Sort
          return (aLength < bLength) ? -1 : (aLength > bLength) ? 1 : 0;
      })
  }

  resetDrawAttempt() {
      this.drawAttempt = 1
  }

  buildTagCloud() {
      this.clearCurrentTagCloudDrawing();
      this.scaleAndColorTags();
      this.drawCloud();
  }

  drawCloud() {
      this.cloud.setSize(this.boardDimensions.width, this.boardDimensions.height);
      this.cloud.on('end', this.onDrawEnd.bind(this));

      // Start Drawing, baby.
      this.cloud.draw(this.tagCloudModels);
  }

  canWePaint(tags) {
      // Check and see if every word was able to find a placement
      return (tags.length === this.tagCloudModels.length || this.drawAttempt >= this.maxDrawAttempts);
  }

  onDrawEnd(drawnTags) {
      if (!this.canWePaint(drawnTags)) {
          // Didn't work, lets try again.
          this.drawAttempt += 1;
          return this.buildTagCloud();
      }
      this.setState({
        loading: false
      });
      this.paintCloud(drawnTags)
  }

  paintCloud(drawnTags) {
      let cloudSvg = d3select(this.refs.$tagCloudSvg)
        .attr('width', this.cloud.getSize()[0])
        .attr('height', this.cloud.getSize()[1]);

      cloudSvg
        .append('g')
        .attr('transform', 'translate(' + this.cloud.getSize()[0] / 2 + ',' + this.cloud.getSize()[1] / 2 + ')')
        .append('rect')
        .attr('id', 'tag-rect-highlight')
        .attr('class', 'topic-cloud-rect-highlight')
        .attr('filter', 'url("#highlightShadow")');

      cloudSvg
        .append('g')
        .attr('transform', 'translate(' + this.cloud.getSize()[0] / 2 + ',' + this.cloud.getSize()[1] / 2 + ')')
        .selectAll('text')
        .data(drawnTags)
        .enter()
        .append('text')
        .style('font-family', 'Arial')
        .style('fill', function(t) { return t.color; })
        .attr('text-anchor', 'middle')
        .attr('class', 'handCursor')
        .attr('filter', 'url(#textShadow)')
        .attr('id', function(d) { return 'topic-cloud-tag-' + d.model.id; })
        .text(function(d) { return d.text; })
        //.on('mouseover', onMouseOver)
        //.on('mousemove', onMouseOver)
        //.on('mouseleave', onMouseLeave)
        //.on('click', onTagClick)
        .transition()
        .duration(function(d) { return d.transitionDuration; })
        .delay(function(d) { return d.transitionDelay; })
        .style('font-size', function(d) { return d.size + 'px'; })
        .attr('transform', function(d) { return 'translate(' + [d.x, d.y] + ') rotate(' + d.rotate + ')'; });
  }

  componentWillUnmount() {
      this.subscribes.forEach(x => x.unsubscribe())
  }

  renderLoading() {
      return this.state.loading ? (<LoadingDots></LoadingDots>) : '';
  }

  clearCurrentTagCloudDrawing() {
      if (!this.refs.$tagCloudSvg) { return; }
      var $tags = this.refs.$tagCloudSvg.querySelectorAll('g');
      for (var i = 0; i < $tags.length; i++) {
          this.refs.$tagCloudSvg.removeChild($tags[i]);
      }
  }

  scaleAndColorTags() {
      let maxLength = this.tags.first().length, minLength = this.tags.last().length;
      let colorScale = getTagColorScale(0, this.tags.size - 1);

      var fontSizeScale = scaleLog()
        .domain([maxLength, minLength])
        .range([25, 140]);

      var transitionScale = scaleLinear()
        .domain([minLength, maxLength])
        .range([300, 750]);

      var delayScale = scalePow()
        .clamp(true)
        .domain([minLength, maxLength])
        .range([0, 500]);

      this.tagCloudModels = this.tags.map((cur, i) => {
          // Reduce by 10% every draw attempt
          let reductionPercent = ((this.drawAttempt - 1) * 10) / 100;
          let formattedLength = this.getFormatedDataLength(cur.length);
          let size = fontSizeScale(formattedLength) * this.screenRatio * (1 - reductionPercent);

          return {
            model: cur,
            text: cur.name,
            size: size,
            color: colorScale(this.tags.size - 1 - i), // reverse
            transitionDuration: transitionScale(formattedLength),
            transitionDelay: delayScale(formattedLength)
          };
      })
      .toArray();
  }

  getFormatedDataLength(lengthStr) {
      return parseFloat(lengthStr.replace(',', ''));
  }

  render() {
    return (
      <div className="tag-cloud-container" ref="$tagCloudContainer">
        { this.renderLoading() }
        { this.renderTopicCloudSVG()}
      </div>
    );
  }

  renderTopicCloudSVG() {
      return (
        <svg ref="$tagCloudSvg">
          <defs>
            <filter id="highlightShadow" height="130%" width="130%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur"/>
              <feOffset dx="1" dy="1"/>
              <feMerge>
                <feMergeNode in="offsetBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="textShadow" height="130%" width="130%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="0.3" result="blur"/>
              <feOffset dx="1" dy="1"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.2"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode in="offsetBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      )
  }
}

export default TagCloud
