import { scaleLinear } from "d3-scale";
import { useMemo, useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import Measure from 'react-measure';
import ReactPlayer from "react-player";
import { geoMercator, geoPath } from "d3-geo";
import { lineString, along, length } from "@turf/turf";


const TOOLTIP_VISIBILITY_IN_SECONDS = 20;
const Capsule = ({
  isActive,
  parentIsActive,
  currentVideoTime,
  timecodeInSeconds,
  coordinates,
  titre,
  contenu,
  type,
  screenWidth,
}) => {
  let color = 'red';
  let radius = 2;
  switch (type) {
    case 'evenement':
      color = 'green';
      break;
    case 'son_oiseau':
      color = 'blue';
      break;
    case 'capsule':
      radius = 5;
      color= 'rgba(100,100,100,1)';
      break;
    default:
      break;
  }
  if (isActive) {
    radius = radius * 1.5;
  }
  const tooltipContainerWidth = screenWidth / 10;
  const tooltipContainerHeight = 150;
  // const isActive = useMemo(() => {
  //   if (currentVideoTime > timecodeInSeconds && timecodeInSeconds <= timecodeInSeconds + TOOLTIP_VISIBILITY_IN_SECONDS) {
  //     return true;
  //   }
  // }, [currentVideoTime, timecodeInSeconds])
  return (
    <g className={`Capsule ${type} ${isActive ? 'is-active' : ''}`}>
      <foreignObject
        className="capsule-tooltip-wrapper"
        x={-tooltipContainerWidth/2}
        width={tooltipContainerWidth}
        y={-tooltipContainerHeight - 10}
        height={tooltipContainerHeight}
      >
        <div xmlns="http://www.w3.org/1999/xhtml"
          className={`capsule-tooltip-container`}
        >
          <div>{titre}</div>
        </div>
      </foreignObject>
      <circle
        className="background-circle"
        stroke='white'
        cx={0}
        cy={0}
        r={radius}
        fill={color}
      />
      {
        type === 'capsule' ?
        <text 
          textAnchor="middle"
          x={0}
          y={radius / 3}
          fill={isActive ? 'white' : 'none'}
          stroke={isActive ? 'none' : 'white'}
          fontSize={isActive ? 7 : 4}
        >▶</text>
        : null
      }
    </g>

  )
}

const Philippe = ({
  data: inputData,
  texts,
  title,
  width,
  height,
  id
}) => {
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [baladeCoordinates, setBaladeCoordinates] = useState([0, 0]);
  const [textHeight, setTextHeight] = useState(0);
  const [activeBalade, setActiveBalade] = useState(0);
  const vizHeight = useMemo(() => height - textHeight, [height, textHeight]);
  const videoWidth = useMemo(() => width * .66, [width]);
  const videoHeight = useMemo(() => videoWidth * .56, [videoWidth]);
  const linearCapsulesXScale = useMemo(() => activeBalade ? scaleLinear().domain([0, activeBalade.durationInSeconds]).range([width - videoWidth, width]) : undefined, [activeBalade, width, videoWidth]);

  const timecodeToPosition = useMemo(() => (seconds, balade) => {
    if (balade) {
      const segments = balade.geometry.features.map(feature => {
        const { geometry: { coordinates } } = feature;
        const line = lineString(coordinates);
        const sizeInKm = length(line, { units: 'kilometers' });
        return {
          line,
          sizeInKm
        }
      });
      const sumInKm = segments.reduce((sum, s) => sum + s.sizeInKm, 0);
      const relPosKm = seconds / balade.durationInSeconds * sumInKm;
      let kmCount = 0;
      let segmentIndex = 0;
      let pointPosition = [0, 0];
      while (kmCount < relPosKm && segmentIndex < segments.length) {
        const thatSegment = segments[segmentIndex];
        const thatSize = thatSegment.sizeInKm;
        if (kmCount + thatSize > relPosKm) {
          const relKm = relPosKm - kmCount;
          pointPosition = along(thatSegment.line, relKm, { units: 'kilometers' }).geometry.coordinates;
          break;
        } else {
          kmCount += thatSize;
          segmentIndex += 1;
        }
      }
      // continuous version
      // const coords = balade.geometry.features.reduce((res, f) => [...res, ...f.geometry.coordinates], []);
      // const line = lineString(coords);
      // const lineSizeInKm = length(line, { units: 'kilometers' });
      // const relPosKm = seconds / balade.durationInSeconds * lineSizeInKm;
      // const pointPosition = along(line, relPosKm, { units: 'kilometers' }).geometry.coordinates;
      return pointPosition;
    }
    return [0, 0]
  }, []);

  const rivieres = useMemo(() => inputData && inputData['reseau-hydrographique.geojson'], [inputData]);
  const reseau = useMemo(() => inputData && inputData['reseau-ferre.geojson'], [inputData]);
  const data = useMemo(() => {
    if (!inputData) { return undefined; }
    const capsules = inputData['timecode_capsules_oiseaux.csv'].filter(c => c.caché === '');
    return inputData['lpo_walks.json'].map(datum => {
      const durationInSeconds = datum.duration.split(':').map((val, i) => i === 0 ? +val * 60 : +val).reduce((sum, val) => sum + val, 0);
      const relatedCapsules = capsules.filter(c => c.video === datum.id).map(capsule => {
        const timecodeInSeconds = capsule['timecode-depart'].split(':').map((val, i) => i === 0 ? +val * 60 : +val).reduce((sum, val) => sum + val, 0);
        const coordinates = timecodeToPosition(timecodeInSeconds, { ...datum, durationInSeconds });
        const durationInSecondsCapsule = capsule.duration !== '' ? capsule.duration.split(':').map((val, i) => i === 0 ? +val * 60 : +val).reduce((sum, val) => sum + val, 0) : undefined;
        return {
          ...capsule,
          timecodeInSeconds,
          coordinates,
          durationInSeconds: durationInSecondsCapsule
        }
      });
      return {
        ...datum,
        durationInSeconds,
        capsules: relatedCapsules
      }
    })
  }, [inputData, timecodeToPosition]);

  const projection = useMemo(() => { // def les bonnes valeurs pour la config de la projection // enregistrer dans le state // les appliquer dans la projection

    let projection = geoMercator();
    projection.scale(700000)
    projection.center([
      2.3553278,
      48.6994407,
    ])
    projection.translate([-width / 7, height / 8]);

    return projection;
  }, [width, height]);

  const project = geoPath().projection(projection) // useEffect(() => geoPath().projection(projection), [projection]);

  useEffect(() => {
    if (data && !activeBalade) {
      setActiveBalade(data[0])
    }
  }, [data, activeBalade]);

  const currentAudioCapsule = useMemo(() => {
    if (activeBalade) {
      return activeBalade.capsules.find(c => {
        if (c.durationInSeconds){
          return currentVideoTime >= c.timecodeInSeconds && currentVideoTime <= c.timecodeInSeconds + c.durationInSeconds;
        } 
    });
    }
  }, [currentVideoTime, activeBalade])

  const onVideoProgress = ({ playedSeconds, played }) => {
    setCurrentVideoTime(playedSeconds);
    if (activeBalade) {
      const pointPosition = timecodeToPosition(playedSeconds, activeBalade);
      setBaladeCoordinates(pointPosition);
    }
    // if (!isPlaying) {
    //   setIsPlaying(true)
    // }
  }
  const timelineHeight = videoHeight / 10;
  return (
    <section id={id} className="section philippe">
      <h2>{title}</h2>
      <Measure
        bounds
        onResize={contentRect => {
          setTextHeight(contentRect.bounds.height)
        }}
      >
        {({ measureRef }) => (
          <div ref={measureRef} className="text-container">
            <Markdown>{texts && texts['philippe.md']}</Markdown>
          </div>
        )}
      </Measure>

      <svg className="philippe-svg" width={width} height={vizHeight}>
        {
          data && activeBalade ?
            <>
              <g className={`rivieres map-layer`}>
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
              <g className={`reseau-ferre map-layer`}>
                {
                  reseau.features.map((feature, id) => {
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

              <g className="paths-container">
                {
                  data.map(datum => {
                    const isActive = activeBalade && datum.id === activeBalade.id;
                    return (
                      <g className={`path-group ${isActive ? 'is-active' : ''}`} key={datum.id} 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveBalade(datum)
                      }}>
                        {
                          datum.geometry.features.map((feature, featureIndex) => {
                            const d = project(feature);
                            return (
                              <g>
                              <path
                                key={featureIndex}
                                d={d}
                                className="background-path"
                                
                              />
                              </g>
                            )
                          })
                        }
                        <circle
                          cx={projection(datum.geometry.features[0].geometry.coordinates[0])[0]}
                          cy={projection(datum.geometry.features[0].geometry.coordinates[0])[1]}
                          r={10}
                          stroke={isActive ? 'red' : "none"}
                          fill={isActive ? 'none' : "red"}
                        />
                        <text 
                          textAnchor="middle"
                          x={projection(datum.geometry.features[0].geometry.coordinates[0])[0]}
                          y={projection(datum.geometry.features[0].geometry.coordinates[0])[1] + 4}
                          fill={isActive ? 'red' : 'white'}
                          fontSize={10}
                        >▶</text>
                      </g>
                    )
                  })
                }
              </g>
              <circle
                className="video-position"
                cx={projection(baladeCoordinates)[0]}
                cy={projection(baladeCoordinates)[1]}
                r={10}
                fill="black"
                stroke="white"
              />
              <g className="spatialized-capsules-container">
                {
                  activeBalade.capsules.map((capsule, capsuleIndex) => {
                    const [x, y] = projection(capsule.coordinates);
                    const isActive = capsule.durationInSeconds ? currentVideoTime > capsule.timecodeInSeconds && currentVideoTime <= capsule.timecodeInSeconds + capsule.durationInSeconds : currentVideoTime > capsule.timecodeInSeconds && currentVideoTime <= capsule.timecodeInSeconds + TOOLTIP_VISIBILITY_IN_SECONDS;
                    const handleClick = () => {
                      if (playerRef && playerRef.current) {
                        playerRef.current.seekTo(capsule.timecodeInSeconds)
                      }
                    }
                    return (
                      <g className={`capsule-container`} key={capsuleIndex}>
                        <g onClick={handleClick} className="capsule-group spatialized-capsule-container" key={capsuleIndex} transform={`translate(${x}, ${y})`}>
                          <Capsule {...capsule} isActive={isActive} currentVideoTime={currentVideoTime} screenWidth={width} />
                        </g>
                      </g>
                    )
                  })
                }
              </g>

              
              <foreignObject
                className="video-wrapper"
                x={width - videoWidth}
                y={0}
                width={videoWidth}
                height={videoHeight}
              >
                <div xmlns="http://www.w3.org/1999/xhtml"
                  className={`video-container`}
                  onClick={() => {
                    setIsPlaying(!isPlaying)
                  }}
                >
                  <ReactPlayer
                    width={videoWidth}
                    height={videoHeight}
                    url={activeBalade.youtube}
                    onProgress={onVideoProgress}
                    ref={playerRef}
                    playing={isPlaying}
                    onPlay={() => {
                      // if (!isPlaying) {
                      //   setIsPlaying(true)
                      // }
                    }}
                    onPause={() => {
                      // if (isPlaying) {
                      //   setIsPlaying(false)
                      // }
                    }}
                  />
                </div>
              </foreignObject>
              {
                currentAudioCapsule ?
                <foreignObject
                className="audio-wrapper"
                x={width - videoWidth}
                y={videoHeight + timelineHeight + 20}
                width={videoWidth}
                height={videoHeight / 5}
              >
                <div xmlns="http://www.w3.org/1999/xhtml"
                  className={`audio-container`}
                  onClick={() => {
                    // setIsPlaying(!isPlaying)
                  }}
                >
                  <ReactPlayer
                    width={videoWidth}
                    height={videoHeight / 5}
                    url={currentAudioCapsule.url}
                    url={'https://soundcloud.com/yungeenace/game-over?utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing'}
                    // onProgress={onVideoProgress}
                    // ref={playerRef}
                    // playing={isPlaying}
                    // onPlay={() => {
                    //   // if (!isPlaying) {
                    //   //   setIsPlaying(true)
                    //   // }
                    // }}
                    // onPause={() => {
                    //   // if (isPlaying) {
                    //   //   setIsPlaying(false)
                    //   // }
                    // }}
                  />
                </div>
              </foreignObject>
                : null
              }
              


              <g className="timeline-container">
                <rect className="timeline-background"
                  x={width - videoWidth}
                  y={videoHeight + 10}
                  width={videoWidth}
                  height={timelineHeight}
                  onClick={e => {
                    e.stopPropagation();
                    const barWidth = videoWidth;
                    const relX = e.clientX - e.target.getBoundingClientRect().x;
                    const shareX = relX / barWidth;
                    const targetInSeconds = shareX * activeBalade.durationInSeconds;
                    // console.log('seek to', relX, barWidth)
                    setIsPlaying(false);
                    if (playerRef.current) {
                      playerRef.current.seekTo(targetInSeconds);
                    }
                  }}
                />
                <rect
                  className="timeline-marker"
                  x={width - videoWidth}
                  y={videoHeight + 10}
                  width={(currentVideoTime / (activeBalade && activeBalade.durationInSeconds)) * videoWidth}
                  height={videoHeight / 10}
                />

              </g>
              <g className="linear-capsules-container">
                {
                  activeBalade.capsules.map((capsule, capsuleIndex) => {
                    const x = linearCapsulesXScale(capsule.timecodeInSeconds);
                    const x2 = capsule.durationInSeconds ? linearCapsulesXScale(capsule.timecodeInSeconds + capsule.durationInSeconds) : undefined;
                    const isActive = capsule.durationInSeconds ? currentVideoTime > capsule.timecodeInSeconds && currentVideoTime <= capsule.timecodeInSeconds + capsule.durationInSeconds : currentVideoTime > capsule.timecodeInSeconds && currentVideoTime <= capsule.timecodeInSeconds + TOOLTIP_VISIBILITY_IN_SECONDS;
                    const handleClick = () => {
                      if (playerRef && playerRef.current) {
                        playerRef.current.seekTo(capsule.timecodeInSeconds)
                      }
                    }
                    return (
                      <g className="capsule-container linear-capsule-container" onClick={handleClick} key={capsuleIndex} transform={`translate(${x}, ${videoHeight + 10})`}>
                        {
                          x2 ?
                          <rect
                            stroke="white"
                            fill="url(#diagonalHatchWhite)"
                            style={{pointerEvents: 'none'}}
                            x={0}
                            width={x2 - x}
                            y={0}
                            height={timelineHeight}
                          />
                          : null
                        }
                        <line
                          stroke="white"
                          x1={0}
                          x2={0}
                          y1={0}
                          y2={timelineHeight}
                        />
                        
                        <Capsule {...capsule} isActive={isActive} currentVideoTime={currentVideoTime} screenWidth={width} />
                      </g>
                    )
                  })
                }
              </g>
            </>
            : null
        }
        <pattern id={`diagonalHatchWhite`} patternUnits="userSpaceOnUse" width="4" height="4">
        <path d="M-1,1 l2,-2
                      M0,4 l4,-4
                      M3,5 l2,-2"
          style={{ stroke: 'white', opacity: 1, strokeWidth: 1 }} />
      </pattern>
      </svg>
    </section>
  )
}

const PhilippeContainer = (props) => {
  const [dimensions, setDimensions] = useState({})
  return (
    <Measure
      bounds
      onResize={contentRect => {
        setDimensions(contentRect.bounds)
      }}
    >
      {({ measureRef }) => (
        <div ref={measureRef} className={'Philippe-container'}>
          <Philippe {...{ ...props, ...dimensions }} />
        </div>
      )}
    </Measure>
  )
};

export default PhilippeContainer;