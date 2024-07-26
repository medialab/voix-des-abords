

import { extent } from 'd3-array';
import { geoMercator, geoPath } from "d3-geo";
import { scaleLinear } from 'd3-scale';
import { useMemo, useState } from 'react';
import Markdown from 'react-markdown';
import Measure from 'react-measure';
import { Group, Line, Path } from './AnimatedComponents';
import HoveredTweets from './HoveredTweets';

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
  const { networkData, tweetsMap } = useMemo(() => {
    if (!data) {
      return {}
    }
    const netData = data['twitter_and_stations_network.json'];
    const tweetsData = data['tweets.csv'];
    const tweetsMap = new Map();
    tweetsData.forEach(tweet => {
      tweetsMap.set(tweet.id, tweet);
    })
    const nodesMap = new Map();
    netData.nodes.forEach(node => {
      nodesMap.set(node.key, node);
      node.relatedNodes = new Set();
    })
    netData.edges = netData.edges.map(edge => {
      const from = nodesMap.get(edge.source);
      const to = nodesMap.get(edge.target);
      from.relatedNodes.add(to);
      to.relatedNodes.add(from);
      return {
        ...edge,
        from,
        to
      }
    })
    return {
      networkData: netData,
      tweetsMap,
      // stationsNodes,
      // linesEdges: netData.edges.filter(e => e.attributes.type === 'segment')
    }
  }, [data]);
  const scaleBarWidth = 50;
  // const mapScaleExtent = useMemo(() => [5000, 40000], []);
  const mapScaleExtent = useMemo(() => [10000, 80000], []);
  // const [currentScale, setCurrentScale] = useState(15000);
  const [currentScale, setCurrentScale] = useState(22000);
  const [analysisVisible, setAnalysisVisible] = useState(false);
  const [hoveredNode, setHoveredNode] = useState();
  const [vizMode, setVizMode] = useState('map');
  const analysesData = useMemo(() => {
    if (!data) {
      return []
    }
    return data['tweets-analyses.csv'].filter(d => d.titre).map(datum => {
      const inferedStations = datum.segments.split('|').map(s => s.split(' à ').map(e => e.trim())).reduce((res, tuple) => [...res, ...tuple], []).filter(d => d);
      const transformed = ['user_screen_names', 'stations', 'segments'].reduce((res, key) => ({
        ...res,
        [key]: new Set(res[key].split('|').map(d => d.trim()).filter(d => d))
      }), datum);
      transformed.secondaryStations = new Set(inferedStations)
      return transformed;
    })
  }, [data]);

  const [activeAnalysis, setActiveAnalysis] = useState();
  const scaleBarScale = useMemo(() => scaleLinear().domain(mapScaleExtent).range([0, scaleBarWidth]), [mapScaleExtent, scaleBarWidth]);

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
  const reseauFerre = useMemo(() => data && data['reseau-ferre.geojson'], [data]);
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
    const xRangeExtent = [width / 4, width - width/4]
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

  const scaleNetworkXPosition = useMemo(() => (x) => {
    const scaleRatio = (currentScale / 24000);
    const scaledCenter = (width / 2) * scaleRatio;
    return x * scaleRatio - (scaledCenter - width / 2) - width / 12;

  }, [currentScale, width]);
  const scaleNetworkYPosition = useMemo(() => (y) => {
    const scaleRatio = (currentScale / 24000);
    const scaledCenter = (height / 2) * scaleRatio;
    return y * scaleRatio - (scaledCenter - height / 2) - width / 20;
  }, [currentScale, height, width]);

  const hoveredNodeTooltipData = useMemo(() => {
    if (hoveredNode) {
      const node = hoveredNode;
      let [x, y] = projection([+node.attributes.lng, +node.attributes.lat]);
      if (vizMode === 'networkSimple') {
        x = scaleNetworkXPosition(xClassicScale(+node.attributes.xAlt));
        y = scaleNetworkYPosition(yClassicScale(+node.attributes.yAlt));
      } else if (vizMode === 'networkSpatialized') {
        x = scaleNetworkXPosition(xMixScale(+node.attributes.x));
        y = scaleNetworkYPosition(yMixScale(+node.attributes.y));
      }
      const radius = tweetsDotsScale(+node.attributes.nbTweets);
      const relatedUsers = Array.from(node.relatedNodes).filter(n => n.attributes.type === 'twitter_user' && n.attributes.label !== node.attributes.label);
      const relatedStations = Array.from(node.relatedNodes).filter(n => n.attributes.type === 'station' && n.attributes.label !== node.attributes.label);
      const content = (
        <div className="tooltip-content">
          <h5>{node.attributes.label} ({node.attributes.type === 'station' ? 'station' : 'utilisateur twitter'} - {node.attributes.nbTweets} tweet{node.attributes.nbTweets.length > 1 ? 's' : ''})</h5>
          {relatedUsers.length ? <div>{node.attributes.type === 'station' ? 'Sujet des tweets de : ' : 'Interagit avec les utilisateurs : '}{relatedUsers
          .sort((a, b) => {
            if (+a.attributes.nbTweets > b.attributes.nbTweets) {
              return -1;
            }
            return 1;
          })
          .map(n => `${n.attributes.label} (${n.attributes.nbTweets} t)`).join(', ')}</div> : null}
          {relatedStations.length && node.attributes.type === 'twitter_user' ? <div>Tweete à propos des stations : {relatedStations.map(d => d.attributes.label).join(', ')}</div> : null}
        </div>
      )
      return {
        node,
        x,
        y,
        radius,
        content,
        relatedNodesKeys: new Set(Array.from(node.relatedNodes).map(n => n.key)),
        tweets: (node.attributes.tweets || []).map(id => tweetsMap.get(id))
      }
    }
  }, [hoveredNode, tweetsMap, projection, tweetsDotsScale, vizMode, xClassicScale, xMixScale, yClassicScale, yMixScale, scaleNetworkXPosition, scaleNetworkYPosition]);

  return !(departements) ? 'chargement' : (
    <svg width={width} height={height} className="TweetsMap">
      <g
      // transform={`translate(${vizMode === 'map' ? 0 : width / 2 - width / 2 * networkZoomScale(currentScale)}, ${vizMode === 'map' ? 0 : height / 2 - height / 2 * networkZoomScale(currentScale)}) scale(${vizMode === 'map' ? 1 : networkZoomScale(currentScale)})`}
      // transformOrigin={'center'}
      >
        {
          vizMode === 'map' ?
            <>
              <g className={`departements map-layer ${vizMode !== 'map' ? 'is-hidden' : ''}`}>
                {
                  departements.features.map((feature, id) => {
                    return (
                      <Path
                        key={id}
                        title={feature.properties.nom}
                        d={project(feature)}
                        fill={feature.properties.nom === 'Paris' ? `url(#diagonalHatchDense)` : `url(#diagonalHatch)`}
                      />
                    )
                  })
                }
              </g>
              <g className={`reseau-ferre map-layer ${vizMode !== 'map' ? 'is-hidden' : ''}`}>
                {
                  reseauFerre.features.map((feature, id) => {
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
            </>
            : null
        }

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
                  let isActive = false;
                  if (activeAnalysis) {
                    if (attributes.type === 'segment') {
                      const imprint = from.attributes.label + ' à ' + to.attributes.label;
                      isActive = activeAnalysis.segments.has(imprint);
                      // isActive = activeAnalysis.stations.has(edge.attributes.label)
                    }
                  }
                  let [x1, y1] = projection([+from.attributes.lng, +from.attributes.lat]);
                  let [x2, y2] = projection([+to.attributes.lng, +to.attributes.lat]);
                  if (vizMode === 'networkSimple') {
                    x1 = scaleNetworkXPosition(xClassicScale(+from.attributes.xAlt));
                    y1 = scaleNetworkYPosition(yClassicScale(+from.attributes.yAlt));
                    x2 = scaleNetworkXPosition(xClassicScale(+to.attributes.xAlt));
                    y2 = scaleNetworkYPosition(yClassicScale(+to.attributes.yAlt));
                  } else if (vizMode === 'networkSpatialized') {
                    x1 = scaleNetworkXPosition(xMixScale(+from.attributes.x));
                    y1 = scaleNetworkYPosition(yMixScale(+from.attributes.y));
                    x2 = scaleNetworkXPosition(xMixScale(+to.attributes.x));
                    y2 = scaleNetworkYPosition(yMixScale(+to.attributes.y));
                  }
                  const isRelated = !activeAnalysis && hoveredNode && (hoveredNodeTooltipData.relatedNodesKeys.has(from.key) || hoveredNodeTooltipData.relatedNodesKeys.has(to.key));
                  const isHidden = !activeAnalysis && hoveredNode && !isRelated;
                  return (
                    <g className={`edge ${isRelated ? 'is-related' : ''} ${isHidden ? 'is-hidden': ''} ${attributes.type} ${isActive ? 'is-active' : ''}`}
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
                  let isActive = false;
                  let isActiveSecondary = false;

                  if (activeAnalysis) {
                    if (node.attributes.type === 'station') {
                      isActive = activeAnalysis.stations.has(node.attributes.label);
                      isActiveSecondary = !isActive && activeAnalysis.secondaryStations.has(node.attributes.label);
                    } else if (node.attributes.type === 'twitter_user') {
                      isActive = activeAnalysis.user_screen_names.has(node.attributes.label)
                    }
                  }
                  const isHovered = !isActive && !isActiveSecondary && hoveredNode && hoveredNode.key === node.key;
                  const isRelated = !isActive && !isActiveSecondary && hoveredNode && hoveredNodeTooltipData.relatedNodesKeys.has(node.key);
                  const isHidden = hoveredNode && (!isActive && !isActiveSecondary && !isHovered && !isRelated);
                  let [x, y] = projection([+node.attributes.lng, +node.attributes.lat]);
                  if (vizMode === 'networkSimple') {
                    x = scaleNetworkXPosition(xClassicScale(+node.attributes.xAlt));
                    y = scaleNetworkYPosition(yClassicScale(+node.attributes.yAlt));
                  } else if (vizMode === 'networkSpatialized') {
                    x = scaleNetworkXPosition(xMixScale(+node.attributes.x));
                    y = scaleNetworkYPosition(yMixScale(+node.attributes.y));
                  }
                  const radius = tweetsDotsScale(+node.attributes.nbTweets)
                  return (
                    <Group className={`node ${node.attributes.type} ${isHovered ? 'is-hovered' : ''} ${isRelated ? 'is-related' : ''} ${isHidden ? 'is-hidden': ''} ${isActive ? 'is-active' : ''} ${isActiveSecondary ? 'is-active-secondary' : ''}`}
                      key={node.attributes.nom}
                      transform={`translate(${x}, ${y})`}
                    >
                      <circle
                        cx={0}
                        cy={0}
                        r={isActive && node.attributes.type === 'station' ? radius * 3 : radius}
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
        className="hovered-tweets-wrapper"
        x={0}
        y={0}
        width={width}
        height={height}
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          className={`hovered-tweets-container ${hoveredNodeTooltipData ? 'is-active' : ''}`}
        >
          <HoveredTweets {...(hoveredNodeTooltipData || {})} />
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
            <h3 onClick={() => {
              if (activeAnalysis) {
                setActiveAnalysis();
              } else if (!analysisVisible) {
                setAnalysisVisible(true);
              }
            }} className={`analysis-title ${activeAnalysis ? 'is-active' : ''}`}>
              {activeAnalysis ? activeAnalysis.titre : 'Analyses'}
            </h3>
            <button className="btn btn-toggle" onClick={() => {
              setAnalysisVisible(!analysisVisible);
              // if (activeAnalysis) {
              //   setActiveAnalysis();
              // }
            }}>
              {analysisVisible ? 'cacher' : 'montrer'}
            </button>
          </div>
          <div className="analysis-panel-body">
            <ul className="analysis-items-list">
              {
                analysesData.map(analysis => {
                  const isActive = activeAnalysis && activeAnalysis.titre === analysis.titre;
                  return (
                    <li onClick={() => {
                      if (isActive) {
                        setActiveAnalysis();
                      } else {
                        setActiveAnalysis(analysis)
                      }
                    }}
                      key={analysis.titre}
                      className={`analysis-item ${isActive ? 'is-active' : ''}`}
                    >
                      <div className="analysis-item-header">
                        <h4>{analysis.titre}</h4>
                      </div>
                      <div className="analysis-item-body">
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
                    left: hoveredNodeTooltipData.x + hoveredNodeTooltipData.radius + 10,
                    top: hoveredNodeTooltipData.y - 10,
                  }}
                >
                  {hoveredNodeTooltipData.content}
                </div>
                : null
            }
          </div>
        </foreignObject>

      <pattern id={`diagonalHatch`} patternUnits="userSpaceOnUse" width="4" height="4">
        <path d="M-1,1 l2,-2
                      M0,4 l4,-4
                      M3,5 l2,-2"
          style={{ stroke: 'rgba(0,0,0,0.1)', opacity: 1, strokeWidth: 1 }} />
      </pattern>
      <pattern id={`diagonalHatchDense`} patternUnits="userSpaceOnUse" width="4" height="4">
        <path d="M-1,1 l2,-2
                      M0,4 l4,-4
                      M3,5 l2,-2"
          style={{ stroke: 'rgba(0,0,0,0.3)', opacity: 1, strokeWidth: 1 }} />
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