// --- Initialisation du canvas ---

const canvas = document.getElementById("goban");
const ctx = canvas.getContext("2d");

canvas.width = 450;
canvas.height = 450;

// --- Variables du jeu ---

// Taille du goban (9 par défaut)
let taille = 9;

// Marge autour de la grille et distance entre les lignes
const marge = 30;
let cellule = (canvas.width - 2 * marge) / (taille - 1);

// Positions des hochi pour un goban 9x9
let hochi = [[2, 2], [2, 6], [4, 4], [6, 2], [6, 6]];

// Le joueur qui doit jouer (noir commence toujours)
let joueurActuel = "noir";

// Plateau de jeu : null = vide, "noir" ou "blanc" = occupé
let plateau = [];

for (let i = 0; i < taille; i++) {
    plateau[i] = [];
    for (let j = 0; j < taille; j++) {
        plateau[i][j] = null;
    }
}

// Liste des coups joués pour l'affichage
let historiqueCoups = [];

// Nombre de passes consécutives (2 passes = fin de partie)
let passes = 0;

// Prisonniers de chaque joueur
// prisonniersNoir = pierres blanches capturées par Noir
// prisonniersBlanc = pierres noires capturées par Blanc
let prisonniersNoir = 0;
let prisonniersBlanc = 0;

// Historique des états du goban pour vérifier la règle du ko
let historiqueEtats = [];

// Mode du clic : "jeu" pour jouer, "pierreMorte" pour retirer les pierres mortes
let modeClick = "jeu";

// Mode de jeu : "2joueurs" ou "ordinateur"
let modeJeu = "2joueurs";

// --- Variables du chronomètre ---

// Chaque joueur a 10 minutes (600 secondes)
let tempsNoir = 600;
let tempsBlanc = 600;
let intervalleChronos = null;

// --- Variables du graphique ---

// On stocke le nombre de prisonniers à chaque coup pour le graphique
let historiquePrisonniersNoir = [0];
let historiquePrisonniersBlanc = [0];

// --- Fonctions du chronomètre ---

// Convertit un nombre de secondes en format mm:ss
function formatTemps(secondes) {
    let min = Math.floor(secondes / 60);
    let sec = secondes % 60;
    if (sec < 10) sec = "0" + sec;
    return min + ":" + sec;
}

// Démarre le chrono du joueur actuel
function demarrerChrono() {
    if (intervalleChronos) clearInterval(intervalleChronos);

    intervalleChronos = setInterval(function () {
        if (joueurActuel === "noir") {
            tempsNoir--;
            if (tempsNoir < 0) tempsNoir = 0;
            document.getElementById("tempsNoir").textContent = formatTemps(tempsNoir);

            if (tempsNoir <= 0) {
                clearInterval(intervalleChronos);
                alert("Noir a dépassé son temps ! Blanc gagne !");
                finDePartie();
            }
        } else {
            tempsBlanc--;
            if (tempsBlanc < 0) tempsBlanc = 0;
            document.getElementById("tempsBlanc").textContent = formatTemps(tempsBlanc);

            if (tempsBlanc <= 0) {
                clearInterval(intervalleChronos);
                alert("Blanc a dépassé son temps ! Noir gagne !");
                finDePartie();
            }
        }
    }, 1000);
}

// Arrête le chrono
function arreterChrono() {
    if (intervalleChronos) {
        clearInterval(intervalleChronos);
        intervalleChronos = null;
    }
}

// --- Fonctions du graphique ---

// Met à jour le graphique Plotly des prisonniers
function mettreAJourGraphique() {
    let coups = historiquePrisonniersNoir.map(function(_, i) { return i; });

    let traceNoir = {
        x: coups,
        y: historiquePrisonniersNoir,
        type: "scatter",
        mode: "lines+markers",
        name: "Prisonniers Noir",
        line: { width: 3, color: "black" },
        marker: { size: 6 }
    };

    let traceBlanc = {
        x: coups,
        y: historiquePrisonniersBlanc,
        type: "scatter",
        mode: "lines+markers",
        name: "Prisonniers Blanc",
        line: { width: 3, color: "#d4b06a" },
        marker: { size: 6 }
    };

    let layout = {
        title: "Évolution des captures",
        height: 350,
        xaxis: { title: "Numéro du coup" },
        yaxis: { title: "Nombre de prisonniers", rangemode: "tozero" },
        margin: { t: 40, b: 50, l: 50, r: 20 }
    };

    Plotly.react("graphique", [traceNoir, traceBlanc], layout);
}

// --- Fonctions de dessin ---

// Redessine tout le goban (fond + grille + hochi + pierres)
function dessinerPlateau() {
    // Fond bois
    ctx.fillStyle = "#c8a05a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Lignes de la grille
    ctx.strokeStyle = "#5a3a10";
    ctx.lineWidth = 1;

    for (let i = 0; i < taille; i++) {
        ctx.beginPath();
        ctx.moveTo(marge, marge + i * cellule);
        ctx.lineTo(canvas.width - marge, marge + i * cellule);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(marge + i * cellule, marge);
        ctx.lineTo(marge + i * cellule, canvas.height - marge);
        ctx.stroke();
    }

    // Points hochi
    hochi.forEach(function (point) {
        ctx.beginPath();
        ctx.arc(marge + point[1] * cellule, marge + point[0] * cellule, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#5a3a10";
        ctx.fill();
    });

    // Pierres sur le plateau
    for (let i = 0; i < taille; i++) {
        for (let j = 0; j < taille; j++) {
            if (plateau[i][j] !== null) {
                dessinerPierre(j, i, plateau[i][j]);
            }
        }
    }
}

// Dessine une seule pierre à la position donnée
function dessinerPierre(col, ligne, couleur) {
    ctx.beginPath();
    ctx.arc(marge + col * cellule, marge + ligne * cellule, cellule / 2 - 2, 0, Math.PI * 2);

    if (couleur === "noir") {
        ctx.fillStyle = "#111";
    } else {
        ctx.fillStyle = "#fff";
    }

    ctx.fill();
    ctx.stroke();
}

// --- Fonctions de logique du jeu ---

// Retourne la liste des voisins d'une intersection
function getVoisins(ligne, col) {
    let voisins = [];

    if (ligne > 0) voisins.push([ligne - 1, col]);
    if (ligne < taille - 1) voisins.push([ligne + 1, col]);
    if (col > 0) voisins.push([ligne, col - 1]);
    if (col < taille - 1) voisins.push([ligne, col + 1]);

    return voisins;
}

// Copie le plateau pour simuler un coup sans modifier le vrai
function copierPlateau(tab) {
    let copie = [];
    for (let i = 0; i < taille; i++) {
        copie[i] = [];
        for (let j = 0; j < taille; j++) {
            copie[i][j] = tab[i][j];
        }
    }
    return copie;
}

// Trouve toutes les pierres d'un groupe et ses libertés sur un plateau donné
function getGroupeEtLibertesSurPlateau(tab, ligne, col) {
    let couleur = tab[ligne][col];
    let groupe = [];
    let libertes = [];
    let visite = [];

    for (let i = 0; i < taille; i++) {
        visite[i] = [];
        for (let j = 0; j < taille; j++) {
            visite[i][j] = false;
        }
    }

    let pile = [[ligne, col]];
    visite[ligne][col] = true;

    while (pile.length > 0) {
        let actuel = pile.pop();
        groupe.push(actuel);

        let voisins = getVoisins(actuel[0], actuel[1]);

        voisins.forEach(function (v) {
            if (!visite[v[0]][v[1]]) {
                visite[v[0]][v[1]] = true;

                if (tab[v[0]][v[1]] === null) {
                    libertes.push(v);
                } else if (tab[v[0]][v[1]] === couleur) {
                    pile.push(v);
                }
            }
        });
    }

    return { groupe, libertes };
}

// Convertit un plateau en chaine de caractères pour comparer les états
function plateauEnStringDepuis(tab) {
    let str = "";
    for (let i = 0; i < taille; i++) {
        for (let j = 0; j < taille; j++) {
            str += tab[i][j] + ",";
        }
    }
    return str;
}

// Simule un coup et vérifie s'il est valide (suicide, ko, case occupée)
function simulerCoup(ligne, col, couleur) {
    if (plateau[ligne][col] !== null) {
        return { valide: false };
    }

    let tab = copierPlateau(plateau);
    tab[ligne][col] = couleur;

    let couleurAdverse = couleur === "noir" ? "blanc" : "noir";
    let capturesSet = new Set();

    // On simule les captures adverses
    getVoisins(ligne, col).forEach(function (v) {
        if (tab[v[0]][v[1]] === couleurAdverse) {
            let result = getGroupeEtLibertesSurPlateau(tab, v[0], v[1]);
            if (result.libertes.length === 0) {
                result.groupe.forEach(function (pierre) {
                    capturesSet.add(pierre[0] + "-" + pierre[1]);
                });
            }
        }
    });

    // On retire les pierres capturées de la copie
    capturesSet.forEach(function (coord) {
        let parties = coord.split("-");
        tab[parseInt(parties[0])][parseInt(parties[1])] = null;
    });

    // On vérifie le suicide
    let resultJoueur = getGroupeEtLibertesSurPlateau(tab, ligne, col);
    if (resultJoueur.libertes.length === 0) {
        return { valide: false };
    }

    // On vérifie le ko
    let nouvelEtat = plateauEnStringDepuis(tab);
    if (historiqueEtats.includes(nouvelEtat)) {
        return { valide: false };
    }

    return {
        valide: true,
        plateauSimule: tab,
        pierresCapturees: capturesSet.size
    };
}

// Vérifie si un coup est valide (retourne true ou false)
function coupEstValide(ligne, col) {
    return simulerCoup(ligne, col, joueurActuel).valide;
}

// Convertit le plateau actuel en string
function plateauEnString() {
    return plateauEnStringDepuis(plateau);
}

// Raccourci pour trouver le groupe et les libertés sur le plateau actuel
function getGroupeEtLibertes(ligne, col) {
    return getGroupeEtLibertesSurPlateau(plateau, ligne, col);
}

// Retire les pierres d'un groupe et met à jour les prisonniers
function capturerGroupe(groupe, couleurCapturant) {
    groupe.forEach(function (pierre) {
        plateau[pierre[0]][pierre[1]] = null;
    });

    if (couleurCapturant === "noir") {
        prisonniersNoir += groupe.length;
        document.getElementById("prisonniersNoir").textContent = prisonniersNoir;
    } else {
        prisonniersBlanc += groupe.length;
        document.getElementById("prisonniersBlanc").textContent = prisonniersBlanc;
    }
}

// Met à jour la liste des coups affichée à droite
function mettreAJourHistorique() {
    let ul = document.getElementById("historique");
    ul.innerHTML = "";

    if (historiqueCoups.length === 0) {
        ul.innerHTML = "<li>Aucun coup pour le moment</li>";
        return;
    }

    historiqueCoups.forEach(function (coup) {
        let li = document.createElement("li");
        li.textContent = coup;
        ul.appendChild(li);
    });
}

// Place les pierres de handicap sur les bons hochi selon la taille
function placerPierresHandicap(nbHandicap) {
    let positionsHandicap = [];

    if (taille === 9) {
        positionsHandicap = [[2, 6], [6, 2], [2, 2], [6, 6]];
    } else if (taille === 13) {
        positionsHandicap = [[3, 9], [9, 3], [3, 3], [9, 9], [6, 6]];
    } else {
        positionsHandicap = [
            [3, 15], [15, 3], [3, 3], [15, 15],
            [9, 3], [3, 9], [15, 9], [9, 15], [9, 9]
        ];
    }

    for (let i = 0; i < nbHandicap && i < positionsHandicap.length; i++) {
        plateau[positionsHandicap[i][0]][positionsHandicap[i][1]] = "noir";
    }
}

// --- Fonctions de jeu ---

// Déclenche l'IA si c'est le tour de l'ordinateur
function declencherIA() {
    if (modeJeu === "ordinateur" && joueurActuel === "blanc") {
        setTimeout(function () {
            let niveau = document.getElementById("niveauIA").value;
            if (niveau === "intelligent") {
                iaIntelligente();
            } else {
                iaAleatoire();
            }
        }, 500);
    }
}

// Joue un coup à la position donnée (humain ou IA)
function jouerCoup(ligne, col, estHumain) {
    let simulation = simulerCoup(ligne, col, joueurActuel);

    if (!simulation.valide) {
        if (estHumain) alert("Coup interdit !");
        return;
    }

    let couleurQuiJoue = joueurActuel;
    let couleurAdverse = couleurQuiJoue === "noir" ? "blanc" : "noir";

    // On applique le plateau simulé
    plateau = simulation.plateauSimule;

    // On met à jour les prisonniers
    if (couleurQuiJoue === "noir") {
        prisonniersNoir += simulation.pierresCapturees;
        document.getElementById("prisonniersNoir").textContent = prisonniersNoir;
    } else {
        prisonniersBlanc += simulation.pierresCapturees;
        document.getElementById("prisonniersBlanc").textContent = prisonniersBlanc;
    }

    // On met à jour le graphique
    historiquePrisonniersNoir.push(prisonniersNoir);
    historiquePrisonniersBlanc.push(prisonniersBlanc);
    mettreAJourGraphique();

    // On sauvegarde l'état pour le ko
    historiqueEtats.push(plateauEnString());
    passes = 0;

    // On ajoute le coup dans l'historique
    let colLettre = String.fromCharCode(65 + col);
    historiqueCoups.push(couleurQuiJoue + " : " + colLettre + (ligne + 1));
    mettreAJourHistorique();

    // On redessine le goban
    dessinerPlateau();

    // On change de joueur
    joueurActuel = couleurAdverse;
    document.getElementById("joueurActuel").textContent =
        joueurActuel.charAt(0).toUpperCase() + joueurActuel.slice(1);

    demarrerChrono();
    declencherIA();
}

// Gère la fin de partie et le comptage des points
function finDePartie() {
    arreterChrono();
    modeClick = "pierreMorte";

    alert("Phase de comptage : cliquez sur les pierres mortes pour les retirer du goban, puis cliquez sur Compter les points.");

    let btnCompter = document.getElementById("btnCompter");

    if (!btnCompter) {
        btnCompter = document.createElement("button");
        btnCompter.id = "btnCompter";
        btnCompter.textContent = "Compter les points";
        btnCompter.className = "btn btn-success mt-2";
        btnCompter.addEventListener("click", compterPoints);
        document.querySelector(".mt-3").appendChild(btnCompter);
    }
}

// Calcule les territoires de chaque joueur
function compterTerritoires() {
    let territoireNoir = 0;
    let territoireBlanc = 0;

    let visite = [];
    for (let i = 0; i < taille; i++) {
        visite[i] = [];
        for (let j = 0; j < taille; j++) {
            visite[i][j] = false;
        }
    }

    for (let i = 0; i < taille; i++) {
        for (let j = 0; j < taille; j++) {
            if (plateau[i][j] === null && !visite[i][j]) {
                let pile = [[i, j]];
                let region = [];
                let couleursBordure = new Set();

                visite[i][j] = true;

                while (pile.length > 0) {
                    let actuel = pile.pop();
                    let ligne = actuel[0];
                    let col = actuel[1];

                    region.push([ligne, col]);

                    getVoisins(ligne, col).forEach(function (v) {
                        let l = v[0];
                        let c = v[1];

                        if (plateau[l][c] === null) {
                            if (!visite[l][c]) {
                                visite[l][c] = true;
                                pile.push([l, c]);
                            }
                        } else {
                            couleursBordure.add(plateau[l][c]);
                        }
                    });
                }

                // Si la zone est entourée par une seule couleur c'est un territoire
                if (couleursBordure.size === 1) {
                    if (couleursBordure.has("noir")) {
                        territoireNoir += region.length;
                    } else if (couleursBordure.has("blanc")) {
                        territoireBlanc += region.length;
                    }
                }
            }
        }
    }

    return { territoireNoir, territoireBlanc };
}

// Calcule et affiche le score final
function compterPoints() {
    let komi = parseFloat(document.getElementById("komi").value);
    let territoires = compterTerritoires();

    let territoireNoir = territoires.territoireNoir;
    let territoireBlanc = territoires.territoireBlanc;

    // score = territoire - prisonniers capturés par l'adversaire
    let scoreNoir = territoireNoir - prisonniersBlanc;
    let scoreBlanc = territoireBlanc - prisonniersNoir + komi;

    let resultat = "=== Résultat final ===\n\n";
    resultat += "Territoire Noir : " + territoireNoir + "\n";
    resultat += "Territoire Blanc : " + territoireBlanc + "\n";
    resultat += "Pierres capturées par Noir : " + prisonniersNoir + "\n";
    resultat += "Pierres capturées par Blanc : " + prisonniersBlanc + "\n";
    resultat += "Komi : " + komi + "\n\n";
    resultat += "Score Noir : " + scoreNoir + "\n";
    resultat += "Score Blanc : " + scoreBlanc + "\n\n";

    if (scoreNoir > scoreBlanc) {
        resultat += "NOIR GAGNE de " + (scoreNoir - scoreBlanc) + " point(s) !";
    } else if (scoreBlanc > scoreNoir) {
        resultat += "BLANC GAGNE de " + (scoreBlanc - scoreNoir) + " point(s) !";
    } else {
        resultat += "ÉGALITÉ !";
    }

    alert(resultat);
}

// --- Fonctions de l'IA ---

// IA niveau 1 : choisit un coup valide au hasard
function iaAleatoire() {
    let coupsPossibles = [];

    for (let i = 0; i < taille; i++) {
        for (let j = 0; j < taille; j++) {
            if (coupEstValide(i, j)) {
                coupsPossibles.push([i, j]);
            }
        }
    }

    // Si aucun coup possible l'IA passe
    if (coupsPossibles.length === 0) {
        document.getElementById("btnPasser").click();
        return;
    }

    let index = Math.floor(Math.random() * coupsPossibles.length);
    jouerCoup(coupsPossibles[index][0], coupsPossibles[index][1], false);
}

// IA niveau 2 : essaie de capturer des pierres, sinon joue au hasard
function iaIntelligente() {
    for (let i = 0; i < taille; i++) {
        for (let j = 0; j < taille; j++) {
            let simulation = simulerCoup(i, j, joueurActuel);

            if (simulation.valide && simulation.pierresCapturees > 0) {
                jouerCoup(i, j, false);
                return;
            }
        }
    }

    iaAleatoire();
}

// --- Evénements ---

// Clic sur le goban pour jouer ou retirer une pierre morte
canvas.addEventListener("click", function (event) {
    // Si c'est le tour de l'IA on bloque le clic humain
    if (modeJeu === "ordinateur" && joueurActuel === "blanc") return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const col = Math.round((x - marge) / cellule);
    const ligne = Math.round((y - marge) / cellule);

    if (col < 0 || col >= taille || ligne < 0 || ligne >= taille) return;

    // Mode pierre morte : on clique pour retirer une pierre
    if (modeClick === "pierreMorte") {
        if (plateau[ligne][col] === null) return;

        let couleurMorte = plateau[ligne][col];
        let couleurAdverse = couleurMorte === "noir" ? "blanc" : "noir";
        let result = getGroupeEtLibertes(ligne, col);

        capturerGroupe(result.groupe, couleurAdverse);
        dessinerPlateau();
        return;
    }

    // Mode jeu normal
    jouerCoup(ligne, col, true);
});

// Bouton Nouvelle partie
document.getElementById("btnNouvelle").addEventListener("click", function () {
    taille = parseInt(document.getElementById("tailleGoban").value);
    cellule = (canvas.width - 2 * marge) / (taille - 1);

    modeClick = "jeu";
    modeJeu = document.querySelector("input[name='mode']:checked").value;

    // On enlève le bouton compter si il existe
    let btnCompter = document.getElementById("btnCompter");
    if (btnCompter) btnCompter.remove();

    // On met à jour les hochi selon la taille choisie
    if (taille === 9) {
        hochi = [[2, 2], [2, 6], [4, 4], [6, 2], [6, 6]];
    } else if (taille === 13) {
        hochi = [[3, 3], [3, 9], [6, 6], [9, 3], [9, 9]];
    } else {
        hochi = [[3, 3], [3, 9], [3, 15], [9, 3], [9, 9], [9, 15], [15, 3], [15, 9], [15, 15]];
    }

    // On remet le plateau à vide
    plateau = [];
    for (let i = 0; i < taille; i++) {
        plateau[i] = [];
        for (let j = 0; j < taille; j++) {
            plateau[i][j] = null;
        }
    }

    // On gère le handicap
    let handicap = parseInt(document.getElementById("handicap").value);
    if (handicap >= 2) {
        placerPierresHandicap(handicap);
        joueurActuel = "blanc";
        document.getElementById("joueurActuel").textContent = "Blanc";
    } else {
        joueurActuel = "noir";
        document.getElementById("joueurActuel").textContent = "Noir";
    }

    // On remet toutes les variables à zéro
    passes = 0;
    prisonniersNoir = 0;
    prisonniersBlanc = 0;
    historiqueCoups = [];
    historiqueEtats = [plateauEnString()];

    historiquePrisonniersNoir = [0];
    historiquePrisonniersBlanc = [0];
    mettreAJourGraphique();

    arreterChrono();
    tempsNoir = 600;
    tempsBlanc = 600;
    document.getElementById("tempsNoir").textContent = "10:00";
    document.getElementById("tempsBlanc").textContent = "10:00";

    document.getElementById("prisonniersNoir").textContent = "0";
    document.getElementById("prisonniersBlanc").textContent = "0";
    mettreAJourHistorique();

    dessinerPlateau();
    demarrerChrono();
    declencherIA();
});

// Bouton Passer
document.getElementById("btnPasser").addEventListener("click", function () {
    historiqueCoups.push(joueurActuel + " : passe");
    mettreAJourHistorique();

    passes++;

    if (joueurActuel === "noir") {
        joueurActuel = "blanc";
    } else {
        joueurActuel = "noir";
    }

    document.getElementById("joueurActuel").textContent =
        joueurActuel.charAt(0).toUpperCase() + joueurActuel.slice(1);

    // Si les deux joueurs passent la partie est terminée
    if (passes >= 2) {
        arreterChrono();
        alert("Les deux joueurs ont passé. La partie est terminée !");
        finDePartie();
    } else {
        demarrerChrono();
        declencherIA();
    }
});

// Bouton Fin de partie
document.getElementById("btnFin").addEventListener("click", function () {
    finDePartie();
});

// Quand on change la taille du goban, on met à jour les options de handicap
document.getElementById("tailleGoban").addEventListener("change", function () {
    let tailleSelectionnee = parseInt(this.value);
    let selectHandicap = document.getElementById("handicap");
    selectHandicap.innerHTML = "";

    let maxHandicap = 0;
    if (tailleSelectionnee === 9) maxHandicap = 4;
    else if (tailleSelectionnee === 13) maxHandicap = 5;
    else maxHandicap = 9;

    let option0 = document.createElement("option");
    option0.value = "0";
    option0.textContent = "0";
    selectHandicap.appendChild(option0);

    for (let i = 2; i <= maxHandicap; i++) {
        let option = document.createElement("option");
        option.value = i;
        option.textContent = i;
        selectHandicap.appendChild(option);
    }

    document.getElementById("komi").value = "7.5";
    document.getElementById("komi").disabled = false;
});

// Quand on change le handicap, le komi est fixé à 0.5
document.getElementById("handicap").addEventListener("change", function () {
    let handicap = parseInt(this.value);
    let inputKomi = document.getElementById("komi");

    if (handicap >= 2) {
        inputKomi.value = "0.5";
        inputKomi.disabled = true;
    } else {
        inputKomi.value = "7.5";
        inputKomi.disabled = false;
    }
});

// Affiche le choix de l'IA quand on sélectionne "Contre ordinateur"
document.querySelectorAll("input[name='mode']").forEach(function (radio) {
    radio.addEventListener("change", function () {
        if (this.value === "ordinateur") {
            document.getElementById("choixIA").style.display = "block";
        } else {
            document.getElementById("choixIA").style.display = "none";
        }
    });
});

// --- Démarrage ---

// On dessine le goban et le graphique au chargement de la page
dessinerPlateau();
mettreAJourGraphique();