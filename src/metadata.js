
export const metadata = {
  title: 'Voix des abords',
  subtitle: 'Enquêter sur la vie dans les abords de voies du RER francilien',
}

export const images = {
  'renouees': `
courbe-hype-renouéeweb.jpg| Courbe des hauts et des bas où je crois puis je ne crois plus que travailler sur les Renouées soit pertinent
`,
//   'sncf': `
// SNCF-réseau-plateau-V4web.jpg| Le plateau de jeu
// démo-cartes-actionV3-web.jpg| Les cartes action, en cours de réalisation
// démo-cartes-contraintesV3-web.jpg| Les cartes contrainte, en cours de réalisation
// démo-cartes-incidentV3-web.jpg| Les cartes incident, en cours de réalisation
// SNCF-réseau-entités-lointainesweb.jpg| Comptabilisation des points du joueur contraintes
// `,
'sncf': `
1-jeu-du-RERweb.jpg|jeu du RER C
10-notice-2web.jpg|cartes incident, action et contrainte
2-jeu-du-RERweb.jpg|jeu du RER C
3-jeu-du-RERweb.jpg|le plateau de jeu
4-SNCF-reseau-plateau-V4web.jpg|les cartes incident
5-demo-cartes-incidentV3-web.jpg|les cartes contrainte
6-demo-cartes-contraintesV3-web.jpg|les cartes action
7-demo-cartes-actionV3-web.jpg|comptabilisation des points
8-SNCF-reseau-entites-lointainesweb.jpg|règle du jeu page 1
9-notice-1web.jpg|règle du jeu page 2
`,
  'lezards': `
dessin-point-de-vue-lézardweb.jpg| Mon interprétation d'un point de vue de lézard | Dessin au crayon de couleur
accueil-point-de-vue-de-lézardweb.jpg| Photo des abords de voies au niveau de Juvisy prise depuis un point de vue de lézard.
lézards-web.jpg| Répartition des reptiles sur les voies du réseau ferrée de Wallonie, Eric Graitson
`,
  'cailloux': `
tassements-web.jpg| Comparaison des tassements et image au 100 ie cycle | Simulation du comportement du ballast à partir d'un échantillon digitalisé de grains. L'objectif est de voir les évolutions d'interactions entre les grains, de mesurer des données micro-mécaniques difficilement mesurables, d'évaluer le déplacement de certains grains. La masse volumique est intégrée, ainsi qu'un coefficient de frottements intergranulaires. En rouge, la courbe de l'évolution des tassements évaluée dans l'expérience. Source : Saussine Gilles, Cholet Catherine, Dubois Frédéric, Bohatier Claude. 2003. "Modélisation du comportement du ballast par une méthode d'éléments discrets". Giens, pages 725 à 736.
contacts-web.jpg| Évolution du déplacement pour différentes charges et évolution du nombre de coordinations moyen | Simulation 3D réalisés à partir d'environ 28500 grains réels digitalisés. Dans le but d'étudier la réstistance latérale de la voie une simulation est menée, avec différentes charges appliquées. Le résultat montre que, lorsqu'une charge est appliquée progressivement, le ballast résiste au déplacement jusqu'à un certain seuil, avant de commencer à se déplacer, ce seuil augmente avec la charge. Le nombre de coordinations (le nombre de contacts par grains) moyen commence initialement à un peu plus de 6, avec l'application de la charge, il commence par augmenter très légèrement, cela correspond à l'étape de résistance du ballast, avant de descendre rapidement à 5,6 (dans le graphique), cette baisse est plus lente avec une charge plus lourde.  Source : Saussine Gilles, Cholet Catherine, Dubois Frédéric, Bohatier Claude. 2003. "Modélisation du comportement du ballast par une méthode d'éléments discrets". Giens, pages 725 à 736.
galet-poème-1web.jpg| Francis Ponge, Le galet (1927) 1/2
galet-poème-2web.jpg| Francis Ponge, Le galet (1927) 2/2
`,
}

export const menuData = [
  {
    title: 'Accueil',
    id: 'home'
  },
  {
    title: 'Les voyageur.ses quotidien.nes',
    image:"accueil-point-de-vue-de-voyageurweb.jpg",
    id: 'voyageurs'
  },
  {
    title: 'Philippe, ornithologue LPO',
    image:"accueil-point-de-vue-de-Philippeweb.jpg",
    id: 'philippe'
  },
  {
    title: 'La renouée du Japon',
    image:"accueil-point-de-vue-de-Renouéeweb.jpg",
    id: 'renouees'
  },
  {
    title: 'SNCF Réseau',
    image:"accueil-point-de-vue-sncf-réseauxweb.jpg",
    id: 'sncf'
  },
  {
    title: 'Les cailloux',
    image:"accueil-point-de-vue-de-caillouweb.jpg",
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