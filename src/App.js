import { Link, } from "react-scroll";
import axios from 'axios';
import { csvParse } from 'd3-dsv';
import { useEffect, useMemo, useState } from 'react';
import Md from 'react-markdown';
import rehypeRaw from "rehype-raw";

import ImageGallery from "./components/ImagesGallery";
import Home from "./components/Home";
import Voyageurs from './components/Voyageurs';
import './App.scss';
import { menuData as inputMenuData, metadata, datasets, textsList, images } from './metadata'
import Philippe from "./components/Philippe";

function shuffle(arr) {
  const array = [...arr];
  let currentIndex = array.length;
  while (currentIndex !== 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

function formatLineBreaks(text) {
  const lines = text.split('\n');

  return lines.map((line, index) => {
      // Check if the line is part of a list
      const isListItem = /^\s*[*\-+]\s+|^\s*\d+\.\s+/.test(line);
      const isNextLineListItem = index < lines.length - 1 && /^\s*[*\-+]\s+|^\s*\d+\.\s+/.test(lines[index + 1]);
      const isEmpty = line.trim().length === 0;

      if (isListItem || isNextLineListItem || isEmpty) 
          return line;
      
      if(line.trim() === '\\')
          return line.replace('\\', '&nbsp;\n');

      return line + '&nbsp;\n';
  }).join('\n');
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [data, setData] = useState();
  const [texts, setTexts] = useState();
  const bottomMenuGroup = ['À propos'];
  const menuData = useMemo(() => {
    return [
    inputMenuData[0],
    ...shuffle(inputMenuData.slice(1, inputMenuData.length - 1)),
    inputMenuData[inputMenuData.length - 1],
  ]
  }, []);
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
              resolve({ ...res, [textName]: formatLineBreaks(str) });
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
        <img className="welcome-image" 
          src={`${process.env.PUBLIC_URL}/images/accueil-dessin-des-abords-V2-web.jpg`}
          alt="accueil"
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
                  const formatedImages = images[id].split(/\n/g).map(s => s.trim()).filter(s => s).map(text => {
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
                          <Md rehypePlugins={[rehypeRaw]}>{texts && texts[`${id}.md`]}</Md>
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
        <footer className="section footer">
          <div className="layout-text-only">
            <Md>{texts && texts[`footer.md`]}</Md>
          </div>
        </footer>
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
