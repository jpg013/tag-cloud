import { scaleQuantile } from 'd3'

const TAG_COLORS = ['#69A3E3','#6CDBFF','#73FFDC','#99FF99','#D7F072','#FFE81A','#FFBD00','#FFA000','#FC7F00'];

function getTagColorScale(lowerBound, upperBound) {
    let domain = Array.apply(null, {length: upperBound - lowerBound})
      .map((val, index) => { return index + lowerBound });

    return scaleQuantile()
      .domain(domain)
      .range(TAG_COLORS);
}

export { getTagColorScale }
