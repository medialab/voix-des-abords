
export const metadata = {
  title: 'Voix des abords',
  subtitle: 'Enquêter sur la vie dans les abords de voies du RER francilien',
}

export const images = {
  'renouees': `
courbe-hype-renouéeweb.jpg| Courbe des hauts et des bas où je crois puis je ne crois plus que travailler sur les Renouées soit pertinent
placeholder.jpg| Mon titre 2 | Ma description
`,
  'sncf': `
placeholder.jpg| Mon titre 1 | Ma description
placeholder.jpg| Mon titre 2 | Ma description
`,
  'lezards': `
placeholder.jpg| Mon titre 1 | Ma description
accueil-point-de-vue-de-lézardweb.jpg| Photo des abords de voies au niveau de Juvisy prise depuis un point de vue de lézard. | Ma description
`,
  'cailloux': `
tassements-web.jpg| Comparaison des tassements et image au 100 ie cycle | Source : Saussine Gilles, Cholet Catherine, Dubois Frédéric, Bohatier Claude. 2003. "Modélisation du comportement du ballast par une méthode d'éléments discrets". Giens, pages 725 à 736.
contacts-web.jpg| Évolution du déplacement pour différentes charges et évolution du nombre de coordinations moyen | Source : Saussine Gilles, Cholet Catherine, Dubois Frédéric, Bohatier Claude. 2003. "Modélisation du comportement du ballast par une méthode d'éléments discrets". Giens, pages 725 à 736.
placeholder.jpg| Francis Ponge, Le galet (1927)
`,
}

export const menuData = [
  {
    title: 'Accueil',
    id: 'home'
  },
  {
    title: 'Les voyageurs',
    image:"accueil-point-de-vue-de-voyageurweb.jpg",
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
    image:"accueil-point-de-vue-sncf-réseauxweb.jpg",
    id: 'sncf'
  },
  {
    title: 'Les cailloux',
    id: 'cailloux'
  },
  {
    title: 'Les lézards',
    image:"accueil-point-de-vue-de-lézardweb.jpg",
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
  'twitter_and_stations_network.json',
  'timecode_capsules_oiseaux.csv',
  'lpo_walks.json',
  'reseau-ferre.geojson',
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
  'voyageurs-notes.md',
  'footer.md',
]