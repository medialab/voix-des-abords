import TweetsMap from "./TweetsMap";
import VoyageVideoContainer from "./VoyageVideo";


const Voyageurs = ({
  data,
  title,
  id
}) => {
  return (
    <section id={id} className="section voyageurs">
      <h2>{title}</h2>
      <article className="responsive-contents">
        <div className="part">
          <VoyageVideoContainer
            data={data}
          />
        </div>
        <div className="part">
          <TweetsMap
            data={data}
          />
        </div>
      </article>
    </section>
  )
}

export default Voyageurs;