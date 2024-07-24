import { scaleLinear } from "d3-scale";
import { useMemo, useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import Measure from 'react-measure';
import ReactPlayer from "react-player";
import { geoMercator, geoPath } from "d3-geo";
import { lineString, along, length } from "@turf/turf";

const Capsule = ({
  isActive,
  parentIsActive,
  type,
}) => {
  let color = 'red';
  switch (type) {
    case 'evenement':
      color = 'green';
      break;
    case 'son_oiseau':
      color = 'blue';
      break;
    case 'capsule':
    default:
      break;
  }
  return (
    <circle
      fill={color}
      stroke='white'
      cx={0}
      cy={0}
      r={5}
    />
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
  const videoWidth = useMemo(() => width / 2, [width]);
  const videoHeight = useMemo(() => videoWidth * .75, [videoWidth]);
  const linearCapsulesXScale = useMemo(() => activeBalade ? scaleLinear().domain([0, activeBalade.durationInSeconds]).range([width - videoWidth, width]) : undefined, [activeBalade, width, videoWidth]);

  const timecodeToPosition = useMemo(() => (seconds, datum) => {
    if (datum) {
      const coords = datum.geometry.features.reduce((res, f) => [...res, ...f.geometry.coordinates], []);
      const line = lineString(coords);
      const lineSizeInKm = length(line, { units: 'kilometers' });
      const relPosKm = seconds / datum.durationInSeconds * lineSizeInKm;
      const pointPosition = along(line, relPosKm, { units: 'kilometers' }).geometry.coordinates;
      return pointPosition;
    }
    return [0, 0]
  }, []);

  const data = useMemo(() => {
    if (!inputData) { return undefined; }
    const capsules = inputData['timecode_capsules_oiseaux.csv'].filter(c => c.caché === '');
    return inputData['lpo_walks.json'].map(datum => {
      const durationInSeconds = datum.duration.split(':').map((val, i) => i === 0 ? +val * 60 : +val).reduce((sum, val) => sum + val, 0);
      const relatedCapsules = capsules.filter(c => c.video === datum.id).map(capsule => {
        const timecodeInSeconds = capsule['timecode-depart'].split(':').map((val, i) => i === 0 ? +val * 60 : +val).reduce((sum, val) => sum + val, 0);
        const coordinates = timecodeToPosition(timecodeInSeconds, { ...datum, durationInSeconds })
        return {
          ...capsule,
          timecodeInSeconds,
          coordinates
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
    projection.translate([0, height / 8]);

    return projection;
  }, [height]);

  const project = geoPath().projection(projection) // useEffect(() => geoPath().projection(projection), [projection]);

  useEffect(() => {
    if (data && !activeBalade) {
      setActiveBalade(data[0])
    }
  }, [data, activeBalade]);


  const onVideoProgress = ({ playedSeconds, played }) => {
    setCurrentVideoTime(playedSeconds);
    if (activeBalade) {
      const pointPosition = timecodeToPosition(playedSeconds, activeBalade);
      setBaladeCoordinates(pointPosition);
    }
    if (!isPlaying) {
      setIsPlaying(true)
    }
  }
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
              <g className="paths-container">
                {
                  data.map(datum => {
                    const isActive = activeBalade && datum.id === activeBalade.id;
                    return (
                      <g className={`path-group ${isActive ? 'is-active' : ''}`} key={datum.id}>
                        {
                          datum.geometry.features.map((feature, featureIndex) => {
                            const d = project(feature);
                            return (
                              <path
                                key={featureIndex}
                                d={d}
                                className="background-path"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveBalade(datum)
                                }}
                              />
                            )
                          })
                        }
                      </g>
                    )
                  })
                }
              </g>
              <g className="spatialized-capsules-container">
                {
                  activeBalade.capsules.map((capsule, capsuleIndex) => {
                    const [x, y] = projection(capsule.coordinates);

                    return (
                      <g className={`capsule-container`} key={capsuleIndex}>
                        <g className="capsule-group spatialized-capsule-container" key={capsuleIndex} transform={`translate(${x}, ${y})`}>
                          <Capsule {...capsule} />
                        </g>
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
                fill="red"
                stroke="white"
              />
              <foreignObject
                className="video-wrapper"
                x={width - videoWidth}
                y={0}
                width={videoWidth}
                height={videoHeight}
              >
                <div xmlns="http://www.w3.org/1999/xhtml"
                  className={`video-container`}
                >
                  <ReactPlayer
                    width={videoWidth}
                    height={videoHeight}
                    url={activeBalade.youtube}
                    onProgress={onVideoProgress}
                    ref={playerRef}
                    playing={isPlaying}
                    onPlay={() => {
                      if (!isPlaying) {
                        setIsPlaying(true)
                      }
                    }}
                    onPause={() => {
                      // if (isPlaying) {
                      //   setIsPlaying(false)
                      // }
                    }}
                  />
                </div>
              </foreignObject>
              <g className="linear-capsules-container">
                {
                  activeBalade.capsules.map((capsule, capsuleIndex) => {
                    const x = linearCapsulesXScale(capsule.timecodeInSeconds);

                    return (
                      <g className="capsule-container linear-capsule-container" key={capsuleIndex} transform={`translate(${x}, ${videoHeight})`}>
                        <Capsule {...capsule} />
                      </g>
                    )
                  })
                }
              </g>
              <g className="timeline-container">
                <rect className="timeline-background"
                  x={width - videoWidth}
                  y={videoHeight + 10}
                  width={videoWidth}
                  height={videoHeight / 10}
                  onClick={e => {
                    e.stopPropagation();
                    const barWidth = videoWidth;
                    const relX = e.clientX - e.target.getBoundingClientRect().x;
                    const shareX = relX / barWidth;
                    const targetInSeconds = shareX * activeBalade.durationInSeconds;
                    console.log('seek to', relX, barWidth)
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
            </>
            : null
        }
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