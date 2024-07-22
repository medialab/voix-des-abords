import { scaleLinear } from 'd3-scale';
import { useState, useMemo, useRef } from 'react';
import ReactPlayer from 'react-player';
import Measure from 'react-measure';

const timecodeToSeconds = str => {
  const parts = str.split(':').map(n => +n);
  return parts[0] * 60 + parts[1]
}

const YTB_URL = 'https://www.youtube.com/watch?v=OiyM0WTa100';
const totalDuration = timecodeToSeconds('52:43');
const VoyageVideo = ({
  data,
  width = 500,
  height = 500
}) => {
  const playerRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);

  const onVideoProgress = ({playedSeconds}) => {
    setCurrentTime(playedSeconds)
  }
  const margin = 10;
  const timecodeScale = useMemo(() => scaleLinear().domain([0, totalDuration]).range([margin, width - margin * 4]), [width])
  const segments = useMemo(() => {
    if (data) {
      const stops = data['timecode-arrets-etampes-bfm.csv'].map(datum => {
        const { station } = datum;
        const fromSeconds = timecodeToSeconds(datum['timecode-arret']);
        const toSeconds = timecodeToSeconds(datum['timecode-depart']);
        return { 
          label: station, 
          fromSeconds, 
          toSeconds,
          fromX: timecodeScale(fromSeconds),
          toX: timecodeScale(toSeconds),
          fromTimecode: datum['timecode-arret'],
          toTimecode: datum['timecode-depart'],
          type: 'stop',
        }
      });
      return stops.reduce((res, stop, index) => {
        res.push(stop);
        if (index < stops.length - 1) {
          const nextStop = stops[index + 1];
          const travel = {
            label: `de ${stop.label} à ${nextStop.label}`, 
            fromSeconds: stop.toSeconds, 
            toSeconds: nextStop.fromSeconds,
            fromX: timecodeScale(stop.toSeconds),
            toX: timecodeScale(nextStop.fromSeconds),
            fromTimecode: stop.toTimecode,
            toTimecode: nextStop.fromTimecode,
            type: 'travel',
          }
          res.push(travel)
        }
        return res;
      }, [])
    }
    return []
  }, [data, timecodeScale]);

  const barX2 = useMemo(() => {
    const currentSegment = segments.find(s => currentTime >= s.fromSeconds && currentTime < s.toSeconds);
    if (currentSegment) {
      const baseX = currentSegment.fromX;
      const segmentWidth = currentSegment.toX - currentSegment.fromX;
      const segmentDuration = currentSegment.toSeconds - currentSegment.fromSeconds;
      const timeDisplace = currentTime - currentSegment.fromSeconds;
      const xDisplace = (timeDisplace * segmentWidth) / segmentDuration;
      return baseX - margin + xDisplace;
    }
    return timecodeScale(0) - margin;
  }, [currentTime, segments, timecodeScale])
  const timelineHeight = 100;
  const barHeight = timelineHeight / 4;
  return (
    <div className="VoyageVideo">
      <ReactPlayer 
        width={width} 
        height={height - timelineHeight} 
        url={YTB_URL} 
        onProgress={onVideoProgress}
        ref={playerRef}
      />
      <svg className="timeline" width={width} height={timelineHeight}>
        {
          segments.map(({label, fromSeconds, toSeconds, fromX, toX, fromTimecode, toTimecode, type}) => {
            return (
              <g 
                className={`segment ${type}`} 
                key={label}
                transform={`translate(${fromX}, 0)`}
              >
                <rect
                  className={`bg-rect`}
                  x={0}
                  y={0}
                  width={toX - fromX}
                  title={label}
                  height={barHeight}
                  onClick={e => {
                    console.log(label)
                    const relX = e.target.getBoundingClientRect().x - e.clientX;
                    const shareX = relX / (fromX - toX);
                    const targetInSeconds = fromSeconds + (toSeconds - fromSeconds) * shareX;
                    if (playerRef.current) {
                      playerRef.current.seekTo(targetInSeconds);
                    }
                    e.stopPropagation();

                  }}
                />
                {
                  type === 'stop' ?
                  <g transform={`translate(0, ${barHeight + 10})rotate(45)`}>
                    <text>
                      {label}
                    </text>
                  </g>
                  : null
                }
              </g>
            )
          })
        }
        <rect 
          className="progress-bar"
          x={margin}
          height={barHeight}
          width={barX2}
          y={0}
        />
      </svg>
    </div>
  )
}


const VoyageVideoContainer = (props) => {
  const [dimensions, setDimensions] = useState({})
  return (
    <Measure
      bounds
      onResize={contentRect => {
        setDimensions(contentRect.bounds)
      }}
    >
      {({ measureRef }) => (
        <div ref={measureRef} className={'VoyageVideo-container'}>
          <VoyageVideo {...{ ...props, ...dimensions }} />
        </div>
      )}
    </Measure>
  )
};

export default VoyageVideoContainer;