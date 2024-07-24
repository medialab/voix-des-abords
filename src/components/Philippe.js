import { useMemo, useState } from "react";
import Markdown from "react-markdown";
import Measure from 'react-measure';


const Philippe = ({
  data: inputData,
  texts,
  title,
  width,
  height,
  id
}) => {
  const [textHeight, setTextHeight] = useState(0);
  const vizHeight = useMemo(() => height - textHeight, [height, textHeight]);
  const data = useMemo(() => {
    if (!inputData) {return []}
    const capsules = inputData['timecode_capsules_oiseaux.csv'];
    return inputData['lpo_walks.json'].map(datum => {
      const relatedCapsules = capsules.filter(c => c.video === datum.id);
      return {
        ...datum,
        durationInSeconds: datum.duration.split(':').map((val, i) => i === 0 ? +val * 60 : +val).reduce((sum, val) => sum + val, 0),
        capsules: relatedCapsules
      }
    })
  }, [inputData]);
  console.log('data', data)
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

      <svg className="philippe-svg" width={width} height={vizHeight} fill="red"></svg>
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