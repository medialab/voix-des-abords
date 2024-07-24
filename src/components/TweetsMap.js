

import { useState, useMemo } from 'react';
import Measure from 'react-measure';
import { geoMercator } from "d3-geo";
import { geoPath } from "d3-geo";
import { extent } from 'd3-array';
import { scaleLinear } from 'd3-scale';
import { Group, Line, Path } from './AnimatedComponents';
import Markdown from 'react-markdown';

const visualizationLabels = {
  map: 'la géographie',
  networkSimple: 'les communautés twitter',
  networkSpatialized: 'les deux',
}

const TweetsMap = ({
  data,
  width = 500,
  height = 500
}) => {
  const { networkData } = useMemo(() => {
    if (!data) {
      return {}
    }
    const netData = data['twitter_and_stations_network.json'];
    const nodesMap = new Map();
    netData.nodes.forEach(node => {
      nodesMap.set(node.key, node)
    })
    netData.edges = netData.edges.map(edge => {
      const from = nodesMap.get(edge.source);
      const to = nodesMap.get(edge.target);
      return {
        ...edge,
        from,
        to
      }
    })
    return {
      networkData: netData,
      // stationsNodes,
      // linesEdges: netData.edges.filter(e => e.attributes.type === 'segment')
    }
  }, [data]);
  const scaleBarWidth = 50;
  const mapScaleExtent = useMemo(() => [5000, 40000], []);
  const [currentScale, setCurrentScale] = useState(15000);
  const [analysisVisible, setAnalysisVisible] = useState(false);
  const [hoveredNode, setHoveredNode] = useState();
  const [vizMode, setVizMode] = useState('map');
  const analysesData = useMemo(() => data ? data['tweets-analyses.csv'] : [], [data])
  const scaleBarScale = useMemo(() => scaleLinear().domain(mapScaleExtent).range([0, scaleBarWidth]), [mapScaleExtent, scaleBarWidth]);
  const networkZoomScale = useMemo(() => {
    const networkZoomScaleRange = [1, 3];
    return scaleLinear().domain(mapScaleExtent).range(networkZoomScaleRange)
  }, [mapScaleExtent]);
  const uiHeight = 100;
  const projection = useMemo(() => { // def les bonnes valeurs pour la config de la projection // enregistrer dans le state // les appliquer dans la projection

    let projection = geoMercator();
    projection.scale(currentScale)
    projection.center([
      2.333333,
      48.866667,
    ])
    projection.translate([width / 2, height / 3]);

    return projection;
  }, [width, height, currentScale]);

  const departements = useMemo(() => data && data['departements.geojson'], [data]);
  const rivieres = useMemo(() => data && data['reseau-hydrographique.geojson'], [data]);
  /** dots data */
  // const tweetsExtentByStation = useMemo(() => {
  //   return stations && extent(data['stations.csv'].map(datum => +datum.nbTweets));
  // }, [data, stations]);

  const {
    tweetsDotsScale,
    xClassicScale,
    yClassicScale,

    xMixScale,
    yMixScale

  } = useMemo(() => {
    if (!networkData) {
      return {}
    }
    const tweetsExtentByStation = extent(networkData.nodes.filter(n => n.attributes.type === 'station').map(datum => +datum.attributes.nbTweets))
    const max = width * height * currentScale * 0.0000000004;
    const tweetsDotsExtent = [max * .1, max];
    // const margin = 10;
    const xRangeExtent = [0, width]
    const yRangeExtent = [height, 0];
    return {
      xClassicScale: scaleLinear().range(xRangeExtent).domain(extent(networkData.nodes.map(n => +n.attributes.xAlt))),
      xMixScale: scaleLinear().range(xRangeExtent).domain(extent(networkData.nodes.map(n => +n.attributes.x))),
      yClassicScale: scaleLinear().range(yRangeExtent).domain(extent(networkData.nodes.map(n => +n.attributes.yAlt))),
      yMixScale: scaleLinear().range(yRangeExtent).domain(extent(networkData.nodes.map(n => +n.attributes.y))),
      tweetsDotsScale: scaleLinear().domain([0, tweetsExtentByStation[1]]).range(tweetsDotsExtent)
    }
  }, [networkData, currentScale, width, height])

  const project = geoPath().projection(projection);

  const hoveredNodeTooltipData = useMemo(() => {
    if (hoveredNode) {
      const node = hoveredNode;
      let [x, y] = projection([+node.attributes.lng, +node.attributes.lat]);
      if (vizMode === 'networkSimple') {
        x = xClassicScale(+node.attributes.xAlt);
        y = yClassicScale(+node.attributes.yAlt);
      } else if (vizMode === 'networkSpatialized') {
        x = xMixScale(+node.attributes.x);
        y = yMixScale(+node.attributes.y);
      }
      const radius = tweetsDotsScale(+node.attributes.nbTweets);
      return {
        node,
        x,
        y,
        radius,
        content: `${node.attributes.label} (${node.attributes.type === 'station' ? 'station' : 'utilisateur twitter'} - ${node.attributes.nbTweets} tweets)`
      }
    }
  }, [hoveredNode, projection, tweetsDotsScale, vizMode, xClassicScale, xMixScale, yClassicScale, yMixScale])
  return !(departements) ? 'chargement' : (
    <svg width={width} height={height} className="TweetsMap">
      <g
        transform={`translate(${vizMode === 'map' ? 0 : width / 2 - width / 2 * networkZoomScale(currentScale)}, ${vizMode === 'map' ? 0 : height / 2 - height / 2 * networkZoomScale(currentScale)}) scale(${vizMode === 'map' ? 1 : networkZoomScale(currentScale)})`}
        transformOrigin={'center'}
      >
        <g className={`departements map-layer ${vizMode !== 'map' ? 'is-hidden' : ''}`}>
          {
            departements.features.map((feature, id) => {
              return (
                <Path
                  key={id}
                  title={feature.properties.nom}
                  d={project(feature)}
                  fill={`url(#diagonalHatch)`}
                />
              )
            })
          }
        </g>
        <g className={`rivieres map-layer ${vizMode !== 'map' ? 'is-hidden' : ''}`}>
          {
            rivieres.features.map((feature, id) => {
              return (
                <Path
                  key={id}
                  // title={feature.properties.objectid}
                  d={project(feature)}
                />
              )
            })
          }
        </g>
        <g className="edges">
          {
            networkData ?
              networkData
                .edges
                .filter(edge => {
                  if (vizMode === 'map') {
                    return edge.attributes.type === 'segment';
                  }
                  return true;
                })
                .map(({ from, to, attributes, key }, index) => {
                  let [x1, y1] = projection([+from.attributes.lng, +from.attributes.lat]);
                  let [x2, y2] = projection([+to.attributes.lng, +to.attributes.lat]);
                  if (vizMode === 'networkSimple') {
                    x1 = xClassicScale(+from.attributes.xAlt);
                    y1 = yClassicScale(+from.attributes.yAlt);
                    x2 = xClassicScale(+to.attributes.xAlt);
                    y2 = yClassicScale(+to.attributes.yAlt);
                  } else if (vizMode === 'networkSpatialized') {
                    x1 = xMixScale(+from.attributes.x);
                    y1 = yMixScale(+from.attributes.y);
                    x2 = xMixScale(+to.attributes.x);
                    y2 = yMixScale(+to.attributes.y);
                  }
                  return (
                    <g className={`edge ${attributes.type}`}
                      key={key}
                    >
                      <Line
                        {...{ x1, y1, x2, y2 }}
                      />
                    </g>
                  )
                })
              : null
          }
        </g>
        <g className="nodes">
          {
            networkData ?
              networkData
                .nodes
                .filter(node => {
                  if (vizMode === 'map') {
                    return node.attributes.type === 'station';
                  }
                  return true;
                })
                .sort((a, b) => {
                  if (+a.attributes.nbTweets > +b.attributes.nbTweets) {
                    return -1;
                  }
                  return 1;
                })
                .map(node => {
                  let [x, y] = projection([+node.attributes.lng, +node.attributes.lat]);
                  if (vizMode === 'networkSimple') {
                    x = xClassicScale(+node.attributes.xAlt);
                    y = yClassicScale(+node.attributes.yAlt);
                  } else if (vizMode === 'networkSpatialized') {
                    x = xMixScale(+node.attributes.x);
                    y = yMixScale(+node.attributes.y);
                  }
                  const radius = tweetsDotsScale(+node.attributes.nbTweets)
                  return (
                    <Group className={`node ${node.attributes.type}`}
                      key={node.attributes.nom}
                      transform={`translate(${x}, ${y})`}
                    >
                      <circle
                        cx={0}
                        cy={0}
                        r={radius}
                        onMouseOver={e => {
                          setHoveredNode(node)
                        }}
                        onMouseLeave={e => {
                          setHoveredNode()
                        }}
                      />
                      {/* <text x={radius + 10}>
                        {node.attributes.label}
                      </text> */}
                    </Group>
                  )
                })
              : null
          }
        </g>
        <foreignObject
          className="tooltip-element-wrapper"
          x={0}
          y={0}
          width={width}
          height={height}
        >
          <div xmlns="http://www.w3.org/1999/xhtml"
            className={`tooltip-element-container ${hoveredNodeTooltipData ? 'has-contents' : ''}`}
          >
            {
              hoveredNodeTooltipData ?
              <div 
                className="tooltip"
                style={{
                  left: hoveredNodeTooltipData.x + hoveredNodeTooltipData.radius + 5,
                  top: hoveredNodeTooltipData.y - 10,
                }}
              >
                {hoveredNodeTooltipData.content}
              </div>
              : null
            }
          </div>
        </foreignObject>
      </g>
      <foreignObject
        className="ui-wrapper"
        x={0}
        y={height - uiHeight}
        width={width}
        height={uiHeight}
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          className="ui-container"
        >
          <div className="ui-contents" style={{ height: uiHeight }}>
            <div className="ui-group">
              <div className="ui-label">
                Visualiser selon :
              </div>
              {
                Object.entries(visualizationLabels)
                  .map(([id, label]) => {
                    return (
                      <span key={id}>
                        <button
                          className={`btn light-btn ${id === vizMode ? 'is-active' : ''}`}
                          onClick={() => {
                            setVizMode(id);
                          }}
                        >
                          {label}
                        </button>
                      </span>

                    )
                  })
              }
            </div>
            <div className="ui-group">
              <div className="ui-label">
                Zoom
              </div>
              <div className="sliding-bar-container"
                style={{ width: scaleBarWidth }}
                onMouseDown={e => {
                  const relX = e.clientX - e.target.getBoundingClientRect().x;
                  setCurrentScale(scaleBarScale.invert(relX))
                }}
              >
                <div className="sliding-bar-actual" style={{ width: scaleBarScale(currentScale) }} />
              </div>
            </div>
          </div>
        </div>
      </foreignObject>

      <foreignObject
        className="analysis-panel-wrapper"
        x={0}
        y={0}
        width={width}
        height={height}
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          className={`analysis-panel-container ${analysisVisible ? 'is-open' : ''}`}
        >
          <div className="analysis-panel-header">
            <div className="analysis-title">
              Analyses
            </div>
            <button className="btn btn-toggle" onClick={() => setAnalysisVisible(!analysisVisible)}>
                {analysisVisible ? 'cacher' : 'montrer'}
            </button>
          </div>
          <div className="analysis-panel-body">
            <ul className="analysis-items-list">
              {
                analysesData.map(analysis => {
                  return (
                    <li key={analysis.titre} className="analysis-item">
                      <div className="analysis-header">
                        <h4>{analysis.titre}</h4>
                      </div>
                      <div className="analysis-body">
                        <Markdown>
                          {analysis.contenu}
                        </Markdown>
                      </div>
                    </li>
                  )
                })
              }
            </ul>
          </div>
        </div>
      </foreignObject>

      <pattern id={`diagonalHatch`} patternUnits="userSpaceOnUse" width="4" height="4">
        <path d="M-1,1 l2,-2
                      M0,4 l4,-4
                      M3,5 l2,-2"
          style={{ stroke: 'rgba(0,0,0,0.1)', opacity: 1, strokeWidth: 1 }} />
      </pattern>

    </svg>
  )
}

const TweetsMapContainer = (props) => {
  const [dimensions, setDimensions] = useState({})
  return (
    <Measure
      bounds
      onResize={contentRect => {
        setDimensions(contentRect.bounds)
      }}
    >
      {({ measureRef }) => (
        <div ref={measureRef} className={'TweetsMap-container'}>
          <TweetsMap {...{ ...props, ...dimensions }} />
        </div>
      )}
    </Measure>
  )
};

export default TweetsMapContainer;