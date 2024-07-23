

import { useState, useMemo } from 'react';
import Measure from 'react-measure';
import { geoMercator } from "d3-geo";
import { geoPath } from "d3-geo";
import { extent } from 'd3-array';
import { scaleLinear } from 'd3-scale';

const TweetsMap = ({
  data,
  width = 500,
  height = 500
}) => {

  const scaleBarWidth = 50;
  const [currentScale, setCurrentScale] = useState(15000);
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
  const stations = useMemo(() => data && data['stations.csv'], [data]);
  const rivieres = useMemo(() => data && data['reseau-hydrographique.geojson'], [data]);
  const lines = useMemo(() => {
    if (stations) {
      const stationsMap = stations.reduce((res, station) => {
        const { nom, lat, lng } = station;
        return {
          ...res,
          [nom]: {
            lat,
            lng,
            nom,
          }
        }
      }, {})
      return data['trajets-rerc.csv']
        .map(({ station1, station2 }) => {
          // if (!stationsMap[station1]) {
          //   console.log('station not found', station1)
          // }
          // if (!stationsMap[station2]) {
          //   console.log('station not found', station2)
          // }
          return {
            from: stationsMap[station1],
            to: stationsMap[station2]
          }
        })
        .filter(l => l.from && l.to)
    }
    return []
  }, [stations, data]);
  /** dots data */
  const tweetsExtentByStation = useMemo(() => {
    return stations && extent(data['stations.csv'].map(datum => +datum.nbTweets));
  }, [data, stations]);
  const tweetsDotsExtent = useMemo(() => {
    const max = width * height * 0.00005;
    return [0, max]
  }, [width, height]);
  const tweetsDotsScale = useMemo(() => stations && scaleLinear().domain([0, tweetsExtentByStation[1]]).range(tweetsDotsExtent), [stations, tweetsExtentByStation, tweetsDotsExtent])

  const project = geoPath().projection(projection);

  return !(departements) ? 'chargement' : (
    <svg width={width} height={height} className="TweetsMap">
      <g className="departements">
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
      <g className="rivieres">
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
      <g className="lignes">
        {
          lines.map(({ from, to }, index) => {
            const [x1, y1] = projection([+from.lng, +from.lat]);
            const [x2, y2] = projection([+to.lng, +to.lat]);
            return (
              <g className="ligne"
                key={index}
              >
                <line
                  {...{ x1, y1, x2, y2 }}
                />
              </g>
            )
          })
        }
      </g>
      <g className="stations">
        {
          stations
            .sort((a, b) => {
              if (+a.nbTweets > +b.nbTweets) {
                return -1;
              }
              return 1;
            })
            .map(station => {
              const [x, y] = projection([+station.lng, +station.lat]);
              const radius = tweetsDotsScale(+station.nbTweets)
              return (
                <g className="station"
                  key={station.nom}
                  transform={`translate(${x}, ${y})`}
                >
                  <circle
                    cx={0}
                    cy={0}
                    r={radius}
                  />
                  <text x={radius + 10}>
                    {station.nom}
                  </text>
                </g>
              )
            })
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
                    style={{stroke: 'rgba(0,0,0,0.1)', opacity: 1, strokeWidth:1}} />
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