import { Link, } from "react-scroll";
import axios from 'axios';
import { csvParse } from 'd3-dsv';
import { useEffect, useState } from 'react';
import Md from 'react-markdown';

import ImageGallery from "./components/ImagesGallery";
import Voyageurs from './components/Voyageurs';
import './App.scss';
import {menuData, metadata, datasets, textsList} from './metadata'

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [data, setData] = useState();
  const [texts, setTexts] = useState();
  const bottomMenuGroup = ['À propos'];
  useEffect(() => {
    datasets.reduce((cur, datasetName) => {
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
              console.groupEnd('get ' + datasetName);
              resolve({ ...res, [datasetName]: data });
            })
            .catch(err => {
              console.info('error', err);
              console.groupEnd('get', datasetName);

            })
        })
      })
    }, Promise.resolve({}))
      .then(result => {
        setData(result);
      })
  }, [])
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
              resolve({ ...res, [textName]: str });
            })
            .catch(err => {
              console.info('error', err);
              console.groupEnd('get', textName);

            })
        })
      })
    }, Promise.resolve({}))
      .then(result => {
        setTexts(result);
      })
  }, []);
  return (
    <div className="App">
      <main>
        <section className="section header">
          <h1>{metadata.title}</h1>
          <h2>{metadata.subtitle}</h2>
          <h3>médialab Sciences Po</h3>
          <div className="short-credits">
          <Md>{texts && texts['short-credits.md']}</Md>
          </div>
          <div className="abstract">
          <Md>{texts && texts['abstract.md']}</Md>
          </div>
          <div className="menu-container">
            <ul className="menu">
              {
                menuData.map(({ id, title }) => {
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
        </section>
        {
          menuData.map(({ title, id }) => {
            switch (id) {
              case 'voyageurs':
                return (
                  <Voyageurs
                    {...{ title, id, data, texts }}
                  />
                );
              case 'philippe':
              case 'renouees':
              case 'sncf':
              case 'lezards':
                return (
                  <section id={id} className="section">
                    <h2>{title}</h2>
                    <div className="layout-illustrated">
                      <div className="layout-element text-element">
                      <Md>{texts && texts[`${id}.md`]}</Md>
                      </div>
                      <div className="layout-element media-element">
                       <ImageGallery images={['placeholder.jpg', 'placeholder.jpg']} />
                      </div>
                    </div>
                  </section>
                );
              case 'cailloux':
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
        <button onClick={() => setMenuOpen(!menuOpen)} className={`drawer-button ${menuOpen ? 'is-open' : ''}`}>
          <span>{menuOpen ? '❌' : '☰'}</span>
        </button>
      </div>
    </div>
  );
}

export default App;
