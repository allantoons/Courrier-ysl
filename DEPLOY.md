# Déploiement PWA Courrier YSL — GitHub Pages

## Fichiers à uploader dans ton repo github.com/allantoons/Courrier-ysl

```
index.html
sw.js
manifest.json
icons/
  icon-192.png
  icon-512.png
```

## Étapes

### 1. Aller sur github.com/allantoons/Courrier-ysl
### 2. Uploader les fichiers
   - Cliquer "Add file" > "Upload files"
   - Glisser tous les fichiers (index.html, sw.js, manifest.json)
   - Créer le dossier icons/ et uploader les 2 images
   - Commit : "PWA Courrier YSL"

### 3. Activer GitHub Pages (si pas déjà fait)
   - Settings > Pages > Source : Deploy from branch > main > / (root)
   - Sauvegarder

### 4. URL de l'app
   https://allantoons.github.io/Courrier-ysl/

### 5. Installer sur iPhone
   - Ouvrir l'URL dans Safari
   - Bouton partage (carré avec flèche) → "Sur l'écran d'accueil"
   - Nom : "Courrier YSL" → Ajouter

## Notes
- Les données (colis) sont sauvegardées localement sur l'iPhone via localStorage
- L'app fonctionne hors-ligne après la première visite
- Pour mettre à jour les employés : modifier le tableau EMPLOYEES dans index.html et re-uploader
