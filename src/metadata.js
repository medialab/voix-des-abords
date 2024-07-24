
export const metadata = {
  title: 'Voix des abords',
  subtitle: 'Enquêter sur les abords de voies du RER francilien',
}

export const images = {
  'renouees': `
placeholder.jpg| Mon titre 1 | Ma description
placeholder.jpg| Mon titre 2 | Ma description
`,
  'sncf': `
placeholder.jpg| Mon titre 1 | Ma description
placeholder.jpg| Mon titre 2 | Ma description
`,
  'lezards': `
placeholder.jpg| Mon titre 1 | Ma description
placeholder.jpg| Mon titre 2 | Ma description
`,
  'cailloux': `
placeholder.jpg| Mon titre 1 | Ma description
placeholder.jpg| Mon titre 2 | Ma description
placeholder.jpg| Mon titre 3 | Ma description
`,
}

export const menuData = [
  {
    title: 'Les voyageurs',
    id: 'voyageurs'
  },
  {
    title: 'Philippe, ornithologue LPO',
    id: 'philippe'
  },
  {
    title: 'La renouée du Japon',
    id: 'renouees'
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

export const datasets = [
  'departements.geojson',
  'reseau-hydrographique.geojson',
  'stations.csv',
  'tweets.csv',
  // 'trajets-rerc.csv',
  'timecode-arrets-etampes-bfm.csv',
  'tweets-analyses.csv',
  'twitter_and_stations_network.json'
];

export const textsList = [
  'a-propos.md',
  'abstract.md',
  'cailloux.md',
  'lezards.md',
  'philippe.md',
  'renouees.md',
  'short-credits.md',
  'sncf.md',
  'voyageurs.md',
]