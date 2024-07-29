import { Link, } from "react-scroll";
import axios from 'axios';
import { csvParse } from 'd3-dsv';
import { useEffect, useState } from 'react';
import Md from 'react-markdown';
import rehypeRaw from "rehype-raw";

import ImageGallery from "./components/ImagesGallery";
import Home from "./components/Home";
import Voyageurs from './components/Voyageurs';
import './App.scss';
import {menuData, metadata, datasets, textsList, images} from './metadata'
import Philippe from "./components/Philippe";

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [data, setData] = useState();
  const [texts, setTexts] = useState();
  const bottomMenuGroup = ['À propos'];
  useEffect(() => {
    textsList.reduce((cur, textName) => {
      return cur.then((res) => {
        return new Promise((resolve, reject) => {
          console.group('get ' + textName);
          axios.get(`${process.env.PUBLIC_URL}/texts/${textName}`, {
            // onDownloadProgress: progressEvent => {
            // }
          })
            .then(({ data: str }) => {  
              console.info('success')
              console.groupEnd('get ' + textName);
              resolve({ ...res, [textName]: str });
            })
            .catch(err => {
              console.info('error', err);
              console.groupEnd('get ' + textName);

            })
        })
      })
    }, Promise.resolve({}))
      .then(result => {
        console.info('all texts are retrieved!')
        setTexts(result);
      
    return datasets.reduce((cur, datasetName) => {
      return cur.then((res) => {
        return new Promise((resolve, reject) => {
          console.group('get ' + datasetName);
          axios.get(`${process.env.PUBLIC_URL}/data/${datasetName}`, {
            // onDownloadProgress: progressEvent => {
            // }
          })
            .then(({ data: str }) => {
              let data = str;
              if (datasetName.includes('.csv')) {
                data = csvParse(str)
              } else if (typeof str === 'string') {
                data = JSON.parse(str);
              }
              console.info('success');
              resolve({ ...res, [datasetName]: data });
              return console.groupEnd('get ' + datasetName);
            })
            .catch(err => {
              console.info('error', err);
              return console.groupEnd('get ' + datasetName);
            })
        })
      })
    }, Promise.resolve({}))
      .then(result => {
        console.info('all data is retrieved!')
        setData(result);
      })
    })
  }, [])
  return (
    <div className="App">
      <main>
        <Home
          {
            ...{
              metadata,
              texts,
              menuData,
            }
          }
        />
        {
          menuData
          .slice(1)
          .map(({ title, id }) => {
            switch (id) {
              case 'philippe':
                return (
                  <Philippe
                    {...{ title, id, data, texts }}
                  />
                );
              case 'voyageurs':
                return (
                  <Voyageurs
                    {...{ title, id, data, texts }}
                  />
                );
              case 'renouees':
              case 'sncf':
              case 'lezards':
              case 'cailloux':
                const formatedImages  = images[id].split(/\n/g).map(s => s.trim()).filter(s => s).map(text => {
                  const [src, title = '', description = ''] = text.split('|')
                  return {
                    src: `${process.env.PUBLIC_URL}/images/${src}`,
                    title,
                    description,
                  }
                });
                return (
                  <section id={id} className="section">
                    <h2>{title}</h2>
                    <div className="layout-illustrated">
                      <div className="layout-element text-element">
                      <Md  rehypePlugins={[rehypeRaw]}>{texts && texts[`${id}.md`]}</Md>
                      </div>
                      <div className="layout-element media-element">
                       <ImageGallery images={formatedImages} />
                      </div>
                    </div>
                  </section>
                );
              case 'a-propos':
                return (
                  <section id={id} className="section">
                    <h2>{title}</h2>
                    <div className="layout-text-only">
                      <Md>{texts && texts[`${id}.md`]}</Md>
                    </div>
                  </section>
                );

              default:
                return (
                  <section id={id} className="section">
                    <h2>{title}</h2>
                  </section>
                )
            }

          })
        }
      </main>

      {/* MENU */}
      <div className={`drawer-menu-container ${menuOpen ? 'is-open' : ''}`}>
        <div className="drawer-menu-background" onClick={() => setMenuOpen(!menuOpen)} />

        <aside className={`drawer-menu ${menuOpen ? 'is-open' : ''}`}>
          <div className="menu-header">
            <h2>{metadata.title}</h2>
            <h3>{metadata.subtitle}</h3>
          </div>
          <div className="menu-body">
            <ul className="menu-group">
              {
                menuData
                  .filter(({ title }) => !bottomMenuGroup.includes(title))
                  .map(({ id, title }) => {
                    return (
                      <li key={id}>
                        <Link
                          to={id}
                          activeClass="is-active"
                          spy={true}
                          smooth={true}
                          className="section-link"
                          onClick={() => {
                            setMenuOpen(false)
                          }}
                        >{title}</Link>
                      </li>
                    )
                  })
              }
            </ul>
          </div>
          <div className="menu-footer">
            <ul className="menu-group">
              {
                menuData
                  .filter(({ title }) => bottomMenuGroup.includes(title))
                  .map(({ id, title }) => {
                    return (
                      <li key={id}>
                        <Link
                          to={id}
                          activeClass="is-active"
                          spy={true}
                          smooth={true}
                          className="section-link"
                          onClick={() => {
                            setMenuOpen(false)
                          }}
                        >{title}</Link>
                      </li>
                    )
                  })
              }
            </ul>
          </div>

        </aside>
        <button onClick={() => setMenuOpen(!menuOpen)} className={`btn drawer-button ${menuOpen ? 'is-open' : ''}`}>
          <span>{menuOpen ? '❌' : '☰'}</span>
        </button>
      </div>
    </div>
  );
}

export default App;
