import { Link, } from "react-scroll";
import axios from 'axios';
import { csvParse } from 'd3-dsv';
import { useEffect, useState } from 'react';

import Voyageurs from './components/Voyageurs';
import './App.scss';

const metadata = {
  title: 'Voix des abords',
  subtitle: 'Enquêter sur les abords de voies du RER francilien',
}

const menuData = [
  {
    title: 'les voyageurs',
    id: 'voyageurs'
  },
  {
    title: 'philippe',
    id: 'philippe'
  },
  {
    title: 'La renouée du Japon',
    id: 'renouée'
  },
  {
    title: 'SNCF Réseaux',
    id: 'sncf'
  },
  {
    title: 'Les cailloux',
    id: 'cailloux'
  },
  {
    title: 'Les lézards',
    id: 'lezards'
  },
  {
    title: 'À propos',
    id: 'a-propos'
  },
];

const datasets = [
  'departements.geojson',
  'reseau-hydrographique.geojson',
  'stations.csv',
  'tweets.csv',
  'trajets-rerc.csv',
  'timecode-arrets-etampes-bfm.csv'
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [data, setData] = useState();
  const bottomMenuGroup = ['À propos'];
  useEffect(() => {
    datasets.reduce((cur, datasetName) => {
      return cur.then((res) => {
        return new Promise((resolve, reject) => {
          console.group('get ' + datasetName);
          axios.get(`/data/${datasetName}`, {
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
  return (
    <div className="App">
      <main>
        <section className="section header">
          <h1>{metadata.title}</h1>
          <h2>{metadata.subtitle}</h2>
          <h3>médialab Sciences Po</h3>
          <ul className="authors">
            <li>Investigatrice principale : Marie Boishus</li>
            <li>Accompagnement scientifique : Robin de Mourat</li>
            <li>Accompagnement méthodologique et technique : ...</li>
          </ul>
          <div className="abstract">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam id ipsum at sapien mollis pharetra. Vivamus eu ex at magna dapibus pretium. Cras ullamcorper ut turpis a lobortis. Duis a arcu a libero convallis cursus sed maximus nulla. Donec commodo, purus et aliquet bibendum, ipsum est auctor mi, non vulputate risus arcu at magna. Nulla sed orci sed neque dignissim sodales vitae eget sapien. Aliquam vestibulum massa ornare dignissim porttitor.
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
                    {...{ title, id, data }}
                  />
                )
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
