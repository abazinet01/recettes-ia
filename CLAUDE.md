# Recettes IA

Assistant de cuisine personnel qui génère des recettes végétariennes basées sur les ingrédients frais disponibles.

## Architecture

App statique pure (HTML/CSS/JS) dans `docs/`. Pas de backend — persistance via `localStorage`. Déployée sur GitHub Pages depuis `docs/` sur `main`.

### Fichiers

- **`docs/index.html`** : Page principale, mobile-first (PWA)
- **`docs/app.js`** : Logique (données par défaut, localStorage, génération de prompt)
- **`docs/style.css`** : Styles touch-friendly pour iPhone
- **`docs/manifest.json`** : Manifest PWA
- **`docs/sw.js`** : Service worker (cache-first, offline)
- **`server.py`** : Serveur statique minimal (`python3 server.py` ou `python3 -m http.server -d docs 8000`)

### Catégories d'ingrédients (5)

Légumes, Fruits, Herbes fraîches, Produits laitiers frais, Protéines fraîches.

Les ingrédients par défaut sont embarqués dans `docs/app.js`. L'utilisateur peut en ajouter/supprimer via l'interface.

## Comment répondre aux demandes de recettes

1. L'utilisateur utilise l'app web pour cocher ses ingrédients frais en stock.
2. Il clique "Générer le prompt recette" et copie le prompt généré.
3. Il colle le prompt ici dans Claude Code.
4. Proposer 5 recettes végétariennes réalisables avec ces ingrédients frais + les bases du garde-manger (pâtes, riz, huile, épices courantes, etc.).
5. Adapter les suggestions selon les préférences exprimées.

## Langue

Toujours répondre en français.
