# ⚡ PokéManager Arena

Un jeu de **manager de créatures** jouable dans le navigateur : capture, entraîne et fais évoluer une équipe de créatures originales, affronte **NEXUS l'IA rivale adaptative**, complète le Pokédex et profite d'événements dynamiques — avec un visualiseur **3D** procédural (Three.js).

> ⚠️ Toutes les créatures sont **100 % originales** (aucun contenu Nintendo / Game Freak / The Pokémon Company). Le jeu est donc librement publiable.

## 🚀 Jouer

Le jeu est 100 % statique — aucun serveur, aucune installation :

```bash
# depuis la racine du projet :
npx serve .
# ou
python3 -m http.server 8080
```

Puis ouvre `http://localhost:8080`. 

💡 Pour le rendre jouable par **tout le monde**, active simplement **GitHub Pages** sur ce dépôt (Settings → Pages → branche `main`, dossier `/`). Le jeu sera en ligne à `https://<ton-user>.github.io/poke/`.

## 🎮 Les mécaniques

| Système | Description |
|---|---|
| 👥 **Manager** | Équipe de 6 créatures + réserve, stats individuelles (IVs cachés), entraînement |
| ✨ **Évolutions** | 8 lignées × 3 stades (niv. 16 et 32) — la 3D change à chaque évolution |
| ⚡ **Énergie idle** | Se régénère avec le temps, **même hors-ligne** → on revient toujours |
| 🌍 **Exploration** | 4 zones avec des types différents, rencontres pondérées par rareté, capture à la capsule |
| ⚔️ **Combats 3D** | Interactifs : tu choisis tes attaques (apprises aux niv. 1/12/24), dégâts flottants, animations d'impact, mode AUTO, tournois |
| 🤖 **NEXUS (IA)** | Rivale adaptative : équipe construite selon la tienne, difficulté qui suit ton ratio de victoires, contre-picks volontaires pour t'apprendre la table des types |
| 🎲 **Événements** | Toutes les 1-3 min : XP ×2, promo boutique, migration rare, pluie d'or… |
| ✦ **Missions & succès** | 3 missions journalières (rotation), 10 succès permanents, profil statistiques |
| 🌟 **Shiny** | Variantes chromatiques ultra-rares (1/64) avec aura dorée |
| 🔊 **Sons** | Effets synthétisés en WebAudio — aucun fichier audio |
| 📖 **Pokédex** | 24 espèces : non découvert / vu / capturé |
| 🧊 **3D** | 9 plans corporels organiques (quadrupède, félin, oiseau, golem…), matériaux PBR, éclairage studio, animations d'idle, portraits rendus dans toute l'UI |
| 💾 **Sauvegarde** | Automatique (localStorage), reprise instantanée |

## 🧠 Intégrer l'IA générative (roadmap)

Le fichier `js/ai.js` isole tout le "cerveau" de NEXUS. Aujourd'hui : templates + heuristiques (fonctionne hors-ligne, zéro coût). Demain, on peut brancher l'API Claude pour :

1. **Répliques uniques de NEXUS** — remplacer `generateTaunt()` par un appel à `claude-sonnet-5` avec l'historique du joueur en contexte.
2. **Événements narratifs générés** — des mini-histoires d'exploration uniques à chaque partie.
3. **Coach IA** — un assistant qui analyse ton équipe et conseille quoi entraîner/capturer.

Il faudra un petit backend (Cloudflare Worker / Vercel function) pour ne pas exposer la clé API côté client.

## 🗺️ Roadmap d'idées

- [ ] Mode multijoueur asynchrone (défier l'équipe sauvegardée d'un autre joueur)
- [ ] Quêtes journalières + récompenses de connexion (rétention)
- [ ] Objets tenus & talents par créature
- [ ] Créatures chromatiques (shiny) ultra-rares
- [ ] Classement mondial (leaderboard)
- [ ] Sons & musique
- [ ] PWA installable sur mobile

## 🏗️ Structure

```
index.html          — structure HUD (onglets, arène, dex, missions…)
css/style.css       — design "jeu moderne" : Rajdhani, panneaux verre, angles coupés
js/data.js          — 24 espèces (palettes, plans corporels), types, attaques, zones
js/state.js         — état du jeu, stats, XP/évolution, shiny, sauvegarde, énergie idle
js/creature3d.js    — moteur 3D : 9 plans corporels organiques, PBR, animations,
                      scène de combat, portraits rendus pour les cartes
js/battle.js        — combat interactif tour par tour (choix des attaques)
js/ai.js            — NEXUS : équipe adaptative, choix d'attaques, dialogue
js/events.js        — événements dynamiques
js/quests.js        — missions journalières + succès
js/sfx.js           — effets sonores synthétisés (WebAudio, zéro asset)
js/ui.js            — rendu de l'interface
js/main.js          — orchestration, boucle de jeu
js/vendor/three.module.js — Three.js r160 (vendored : le jeu marche hors-ligne)
assets/fonts/       — Rajdhani 600/700 (woff2, subset latin)
```
