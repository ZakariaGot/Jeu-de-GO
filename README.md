# Jeu de Go

Projet réalisé en **Licence 3 MIAGE** pendant l'année universitaire 2025-2026, en binôme avec **Mehdi Kobi**.

L'objectif était de créer un jeu de Go jouable directement dans le navigateur en utilisant principalement **HTML, CSS et JavaScript**.

---

## Présentation

Le projet contient plusieurs pages permettant de découvrir le jeu de Go et d'y jouer :

- une page d'accueil ;
- une page d'informations ;
- une page sur l'histoire du Go ;
- une page qui explique les règles ;
- une page de jeu interactive.

La partie principale du projet est le jeu lui-même, développé en JavaScript avec un plateau dessiné grâce à **Canvas HTML5**.

---

## Technologies utilisées

- HTML5
- CSS3
- JavaScript
- Bootstrap 5
- Canvas HTML5
- Plotly.js

---

## Fonctionnalités du jeu

Le jeu permet notamment de :

- choisir la taille du goban : **9x9, 13x13 ou 19x19** ;
- jouer à **deux joueurs** sur le même ordinateur ;
- jouer **contre une IA** ;
- choisir entre deux niveaux d'IA ;
- gérer les captures de pierres ;
- vérifier les coups interdits ;
- gérer la règle du **ko** ;
- gérer les pierres de handicap ;
- choisir le **komi** ;
- suivre les prisonniers capturés ;
- afficher l'historique des coups ;
- utiliser un chronomètre pour chaque joueur ;
- calculer les territoires et le score en fin de partie.

Un graphique réalisé avec **Plotly.js** permet également de suivre l'évolution du nombre de prisonniers pendant la partie.

---

## Intelligence artificielle

Deux niveaux d'IA ont été développés :

- une IA simple qui choisit un coup valide au hasard ;
- une IA qui essaie d'abord de trouver un coup permettant de capturer des pierres adverses, puis joue au hasard si aucune capture n'est disponible.

L'objectif n'était pas de créer une IA avancée de Go, mais de mettre en pratique la logique du jeu et la manipulation du plateau en JavaScript.

---

## Logique du jeu

Le fichier `game.js` contient la majorité de la logique du projet.

J'ai notamment travaillé sur :

- le dessin du goban avec Canvas ;
- la gestion des groupes de pierres et de leurs libertés ;
- la détection et la capture des groupes sans liberté ;
- la validation des coups ;
- la gestion du suicide ;
- la règle du ko ;
- le placement des pierres de handicap ;
- le comptage des territoires ;
- le calcul du score ;
- les chronomètres ;
- l'historique des coups ;
- le fonctionnement des deux IA.

La règle du ko et la gestion des captures ont fait partie des points les plus difficiles du projet, car il fallait simuler l'état du plateau avant de pouvoir déterminer si un coup était valide.

---

## Structure du projet

```text
Jeu-de-GO/
├── images/
│   └── regles/
├── game.html
├── game.js
├── histoire.html
├── index.html
├── Informations.html
├── regles.html
├── style.css
└── README.md
```

---

## Ce que ce projet m'a permis de travailler

Ce projet m'a permis de mettre en pratique plusieurs notions vues pendant ma L3 MIAGE :

- développement web en HTML, CSS et JavaScript ;
- manipulation du DOM ;
- utilisation de Canvas ;
- algorithmique ;
- gestion des états d'une application ;
- mise en place de règles métier assez complexes ;
- utilisation de bibliothèques externes comme Bootstrap et Plotly ;
- travail en binôme sur un projet complet.

C'était surtout un projet intéressant pour travailler la logique en JavaScript, car les règles du Go demandent de gérer beaucoup de cas différents.

---

## Réalisé par

- **Zakaria Got**
- **Mehdi Kobi**

Projet de **Licence 3 MIAGE — 2025-2026**.
