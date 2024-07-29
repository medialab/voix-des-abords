import TweetsMap from "./TweetsMap";
import VoyageVideoContainer from "./VoyageVideo";
import Md from 'react-markdown';

const Voyageurs = ({
  data,
  texts,
  title,
  id
}) => {
  return (
    <section id={id} className="section voyageurs">
      <h2>{title}</h2>
      <article>
        <div className="part">
          <VoyageVideoContainer
            data={data}
            text={texts && texts['voyageurs.md']}
          />
        </div>
        <div className="part">
          <TweetsMap
            data={data}
          />
        </div>
        <div className="text-container">
          {
            texts ?
            <Md>
            {texts['voyageurs-notes.md']}
          </Md>
            : null
          }
          
        </div>

      </article>
    </section>
  )
}

export default Voyageurs;