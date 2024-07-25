
import { Link, } from "react-scroll";
import Md from 'react-markdown';
import Measure from "react-measure";
import { useState } from "react";

// const YTB_URL = 'https://www.youtube.com/watch?v=OiyM0WTa100';
const Home = ({
  metadata,
  texts,
  menuData,
  width,
  height,
}) => {
  return (
    <section className="Home" id="home">
      
      
      <div className="home-contents">
        <h1 className="home-title">{metadata.title}</h1>
        <h2 className="home-subtitle">{metadata.subtitle}</h2>
        <h3 className="home-main-credits">médialab Sciences Po</h3>
        <div className="short-credits">
          <Md>{texts && texts['short-credits.md']}</Md>
        </div>
        <div className="abstract">
          <Md>{texts && texts['abstract.md']}</Md>
        </div>
        <div className="menu-container">
          <ul className="menu">
            {
              menuData.slice(1).map(({ id, title }) => {
                return (
                  <li key={id}>
                    <Link
                      to={id}
                      activeClass="is-active"
                      spy={true}
                      smooth={true}
                      className="section-link"
                    >{title}</Link>
                  </li>
                )
              })
            }
          </ul>
        </div>
      </div>

    </section>
  )
}


const HomeContainer = (props) => {
  const [dimensions, setDimensions] = useState({})
  return (
    <Measure
      bounds
      onResize={contentRect => {
        setDimensions(contentRect.bounds)
      }}
    >
      {({ measureRef }) => (
        <div ref={measureRef} className={'Home-container'}>
          <Home {...{ ...props, ...dimensions }} />
        </div>
      )}
    </Measure>
  )
};

export default HomeContainer;