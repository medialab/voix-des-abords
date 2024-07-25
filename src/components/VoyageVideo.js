import { scaleLinear } from 'd3-scale';
import { useState, useMemo, useRef } from 'react';
import ReactPlayer from 'react-player';
import Measure from 'react-measure';
import { TypeAnimation } from 'react-type-animation';
import Md from 'react-markdown';
import { shuffle } from 'd3-array';

const timecodeToSeconds = str => {
  const parts = str.split(':').map(n => +n);
  return parts[0] * 60 + parts[1]
}

const YTB_URL = 'https://www.youtube.com/watch?v=OiyM0WTa100';
const totalDuration = timecodeToSeconds('52:43');
const VoyageVideo = ({
  data,
  width = 500,
  height = 500,
  text
}) => {
  const margin = 10;
  const timelineHeight = 100;
  const uiHeight = 100;
  const barHeight = timelineHeight / 4;

  const tweetsPresenceRatioBarWidth = 50;

  const playerRef = useRef(null);
  const [textHeight, setTextHeight] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentSegment, setCurrentSegment] = useState();
  const [tooltipText, setTooltipText] = useState('');
  const [tooltipIsVisible, setTooltipIsVisible] = useState(false);

  const [tweetsPresenceRatio, setTweetsPresenceRatio] = useState(0.5);

  const videoHeight = height - timelineHeight - uiHeight - textHeight;

  const [tooltipX, setTooltipX] = useState(0);
  const timecodeScale = useMemo(() => scaleLinear().domain([0, totalDuration]).range([margin, width - margin * 2]), [width])
  const segments = useMemo(() => {
    if (data) {
      const stationsMap = data['stations.csv'].reduce((res, station) => ({...res, [station.nom]: station}), {});
      const tweetsMap = data['tweets.csv'].reduce((res, tweet) => ({...res, [tweet.id]: tweet}), {});
      const stops = data['timecode-arrets-etampes-bfm.csv'].map(datum => {
        const { station } = datum;
        const thatStation = stationsMap[station];
        const theseTweets = Array.from(new Set(thatStation.tweets.split('|'))).map(id => tweetsMap[id])
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
          tweets: shuffle(theseTweets),
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
            tweets: stop.tweets,
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
      return baseX + xDisplace - margin;
    }
    return timecodeScale(0) - margin;
  }, [currentTime, segments, timecodeScale]);

  const onVideoProgress = ({ playedSeconds }) => {
    setCurrentTime(playedSeconds);
    const newCurrentSegment = segments.find(s => playedSeconds >= s.fromSeconds && playedSeconds < s.toSeconds);
    if (newCurrentSegment && (currentSegment === undefined || currentSegment.label !== newCurrentSegment.label)) {
      const segmentDuration = newCurrentSegment.toSeconds - newCurrentSegment.fromSeconds;
      const displayTimePadding = segmentDuration / (newCurrentSegment.tweets.length + 1);
      const positionnedSegment = {
        ...newCurrentSegment,
        tweets: newCurrentSegment.tweets.map((tweet,index) => {
          const x = Math.random() * .8;
          const y = Math.random() * .8;
          const fromTime = newCurrentSegment.fromSeconds + index * displayTimePadding;
          return {...tweet, x, y, fromTime}
        })
      }
      setCurrentSegment(positionnedSegment);
    }
    // if (!isPlaying) {
    //   setIsPlaying(true)
    // }
  }
  return (
    <div className="VoyageVideo">
      <Measure
      bounds
      onResize={contentRect => {
        setTextHeight(contentRect.bounds.height)
      }}
    >
      {({ measureRef }) => (
        <div ref={measureRef} className="text-container">
          <Md>{text}</Md>
        </div>
      )}
    </Measure>
      
      <ReactPlayer
        width={width}
        height={videoHeight}
        url={YTB_URL}
        onProgress={onVideoProgress}
        ref={playerRef}
        playing={isPlaying}
        onPlay={() => {
          if (!isPlaying) {
            setIsPlaying(true)
          }
        }}
        onPause={() => {
          if (isPlaying) {
            setIsPlaying(false)
          }
        }}
      />
      <div 
        className="tweets-overlay-container"
        style={{
          top: textHeight,
          width,
          height: videoHeight,
          opacity: tweetsPresenceRatio
        }}
      >
        {
          currentSegment ? 
          currentSegment.tweets
          .filter(({fromTime}) => fromTime <= currentTime)
          .map((tweet, i) => {
            const relX = tweet.x * width;
            const relY = tweet.y * videoHeight;
            const elWidth = width * .2;
            // const elHeight = videoHeight * .2;
            return (
              <blockquote 
                style={{
                  left: relX,
                  top: relY,
                  // width: elWidth,
                  maxWidth: elWidth,
                  minWidth: elWidth,
                  // height: elHeight,
                  // maxHeight: elHeight,
                  fontSize: 10 + (+tweet.retweet_count)
                }}
                className="tweet-content" key={i}>
                  <p>@{tweet.user_screen_name}</p>
                  <p>{new Date(tweet.local_time).toLocaleDateString()} - {new Date(tweet.local_time).toLocaleTimeString()}</p>
                <p>
                <TypeAnimation
                  sequence={[
                    1000, // Waits 1s
                    tweet.text, // Deletes 'One' and types 'Two'
                    // 2000, // Waits 2s
                    // 'Two Three', // Types 'Three' without deleting 'Two'
                    // () => {
                    //   console.log('Sequence completed');
                    // },
                  ]}
                  wrapper="span"
                  cursor={true}
                  // repeat={Infinity}
                  // style={{ fontSize: '2em', display: 'inline-block' }}
                />
                </p>
              </blockquote>
            )
          })
          : null
        }
      </div>
      <div
        style={{
          left: tooltipX
        }}
        className={`tooltip-container ${tooltipIsVisible ? 'is-visible' : ''}`}
      >

        <div
          className="tooltip-wrapper"
        >
          <div className="tooltip-content">
            {tooltipText}
          </div>

        </div>
      </div>
      <svg className="timeline" width={width} height={timelineHeight}>
        {
          segments
            .sort((a, b) => {
              if (a.type === 'stop' && b.type !== 'stop') {
                return 1;
              }
              return -1;
            })
            .map(({ label, fromSeconds, toSeconds, fromX, toX, fromTimecode, toTimecode, type }, index) => {
              const barWidth = toX - fromX;

              let status = 'future';
              if (currentTime >= fromSeconds && currentTime < toSeconds) {
                status = 'present';
              } else if (currentTime > toSeconds) {
                status = 'past';
              }
              return (
                <g
                  className={`segment ${type} status-${status}`}
                  key={label}
                  transform={`translate(${fromX}, ${margin})`}
                >
                  <rect
                    className={`bg-rect`}
                    x={0}
                    y={tooltipIsVisible ? 0 : barHeight / 2 - barHeight / 8}
                    width={barWidth}
                    title={label}
                    height={tooltipIsVisible ? barHeight : barHeight / 4}
                    onClick={e => {
                      e.stopPropagation();
                      const relX = e.clientX - e.target.getBoundingClientRect().x;
                      const shareX = relX / barWidth;
                      const targetInSeconds = fromSeconds + (toSeconds - fromSeconds) * shareX;
                      setIsPlaying(false);
                      if (playerRef.current) {
                        playerRef.current.seekTo(targetInSeconds);
                      }
                    }}
                    onMouseMove={e => {
                      e.stopPropagation();
                      const relX = e.target.getBoundingClientRect().x - e.clientX;
                      const shareX = relX / (fromX - toX);
                      const targetInSeconds = fromSeconds + (toSeconds - fromSeconds) * shareX;
                      const date = new Date(0);
                      date.setSeconds(targetInSeconds); // specify value for SECONDS here
                      const timeString = date.toISOString().substring(11, 19);
                      setTooltipText(`${timeString} (${type === 'stop' ? `arrêt à ${label}` : label})`);
                      const svg = e.target.parentNode.parentNode;
                      const svgX = svg.getBoundingClientRect().x;
                      setTooltipX(e.clientX - svgX);
                      if (!tooltipIsVisible) {
                        setTooltipIsVisible(true);
                      }
                    }}
                    onMouseLeave={() => {
                      setTooltipIsVisible(false);
                    }}
                  />
                  {
                    type === 'stop' ?
                      <>
                        <g 
                          style={{transition: '.5s ease all'}} 
                          transform={`translate(${0}, ${barHeight + 10})rotate(40)`}
                        >
                        
                          <text>
                            {label}
                          </text>
                        </g>
                        <circle
                          cx={barWidth / 2}
                          cy={barHeight / 2}
                          r={tooltipIsVisible ? 0 : status === 'present' ? barHeight / 2 : status === 'past' ? barHeight / 8 : barHeight / 8 + 2}
                          fill={status === 'past' ? 'white' : '#ffcf01'}
                          stroke={status === 'past' ? 'lightgrey' : 'white'}
                          style={{ transition: '.5s ease all' }}
                        />
                      </>
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
          y={margin}
        />

      </svg>

      <div className="ui-wrapper" style={{ height: uiHeight }}>
        <div className="ui-container">
          <div className="ui-contents">
            <div className="ui-group">
              <div className="ui-label">
                Présence des tweets
              </div>
              <div className="sliding-bar-container"
                style={{ width: tweetsPresenceRatioBarWidth }}
                onMouseDown={e => {
                  const relX = e.clientX - e.target.getBoundingClientRect().x;
                  setTweetsPresenceRatio(relX / tweetsPresenceRatioBarWidth)
                }}
              >
                <div className="sliding-bar-actual" style={{ width: tweetsPresenceRatio * tweetsPresenceRatioBarWidth }} />
              </div>
            </div>
          </div>
        </div>
      </div>
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