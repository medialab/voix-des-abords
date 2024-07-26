import { useEffect, useState } from "react";


const HoveredTweets = ({
  tweets = []
}) => {
  const [activeTweetIndex, setActiveTweetIndex] = useState();
  const [isDisplaying, setIsDisplaying] = useState(false);

  const VISIBILITY_DURATION = 2000;

  useEffect(() => {
    if (tweets.length) {
      setActiveTweetIndex(0);
      setIsDisplaying(true);
    } else {
      setActiveTweetIndex(null);
      setIsDisplaying(false)
    }
  }, [tweets]);

  useEffect(() => {
    if (isDisplaying && tweets.length) {
      setTimeout(() => {
        if (isDisplaying && tweets.length) {
          const nextIndex = activeTweetIndex + 1 < tweets.length ? activeTweetIndex + 1 : 0;
          setActiveTweetIndex(nextIndex)
        }
      }, VISIBILITY_DURATION)
    }
  }, [activeTweetIndex, tweets, isDisplaying]);
  const activeTweet = activeTweetIndex !== null && activeTweetIndex < tweets.length && tweets[activeTweetIndex];
  return (
    <div className={`HoveredTweets ${isDisplaying ? 'is-displaying' : ''}`}>
      {
        activeTweet ?
          <>
            <p>@{activeTweet.user_screen_name}</p>
            <p>{new Date(activeTweet.local_time).toLocaleDateString()} - {new Date(activeTweet.local_time).toLocaleTimeString()}</p>
            <div>{activeTweet.text}</div>
          </>
          : null
      }
    </div>
  )
}

export default HoveredTweets;