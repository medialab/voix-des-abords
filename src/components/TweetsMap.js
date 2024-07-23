

import { useState, useMemo } from 'react';
import Measure from 'react-measure';
import { geoMercator } from "d3-geo";
import { geoPath } from "d3-geo";
import { extent } from 'd3-array';
import { scaleLinear } from 'd3-scale';

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
  const {networkData} = useMemo(() => {
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
  const [currentScale, setCurrentScale] = useState(15000);
  const [vizMode, setVizMode] = useState('map');
  const scaleBarScale = useMemo(() => scaleLinear().domain([5000, 40000]).range([0, scaleBarWidth]), [scaleBarWidth]);

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
    const max = width * height * currentScale * 0.0000000007;
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

  return !(departements) ? 'chargement' : (
    <svg width={width} height={height} className="TweetsMap">
      <g className={`departements map-layer ${vizMode !== 'map' ? 'is-hidden' : ''}`}>
        {
          departements.features.map((feature, id) => {
            return (
              <path
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
              <path
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
                <line
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
                <g className={`node ${node.attributes.type}`}
                  key={node.attributes.nom}
                  transform={`translate(${x}, ${y})`}
                >
                  <circle
                    cx={0}
                    cy={0}
                    r={radius}
                  />
                  <text x={radius + 10}>
                    {node.attributes.label}
                  </text>
                </g>
              )
            })
          : null
        }
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