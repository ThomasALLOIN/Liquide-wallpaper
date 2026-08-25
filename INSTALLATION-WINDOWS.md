# Installation Windows — Lively

Cette distribution cible Windows 10/11. Le fond d’écran fonctionne dans Lively Wallpaper ; Node.js n’est pas nécessaire une fois le fond importé. Les fichiers canoniques de la plateforme sont rangés dans `platforms/windows/` et les commandes pratiques restent à la racine.

## Installation recommandée dans Lively

1. Installer Lively Wallpaper depuis le Microsoft Store ou son site officiel.
2. Ouvrir Lively puis la configuration des écrans.
3. Choisir la disposition **Par écran**.
4. Ajouter `index.html` depuis ce dossier comme fond d’écran web.
5. Appliquer le même fond sur le moniteur paysage gauche et le moniteur vertical droit.
6. Dans **Personnaliser**, conserver **Disposition des écrans → Automatique par écran**.

Les deux moniteurs affichent des distributions minérales cohérentes, avec une composition dédiée au format vertical à droite. Ils suivent la même transition lumineuse.

## Personnalisation dans Lively

Dans Lively, faire un clic droit sur le fond puis choisir **Personnaliser**. Les réglages permettent de modifier :

- la courbure des strates, la vitesse commune au déplacement et à la déformation des veines, la densité, la largeur des nappes et l’amplitude de leur déformation ;
- le grain et le contraste de la pierre ;
- les quatre couleurs du marbre de jour et de nuit ;
- l’heure de retour du blanc, le début de l’assombrissement et l’heure du noir complet ;
- la résolution du shader et la fréquence d’images.

Le fond ne présente aucun menu intégré. Sa seed est choisie automatiquement et renouvelée toutes les deux heures ; elle reste stable pendant la tranche active, y compris après une veille.

## Créer un paquet importable

Double-cliquer sur `Construire-Lively-Windows.cmd`. Le fichier suivant sera créé :

```text
dist\windows\Liquide-Wallpaper-Lively.zip
```

Ce ZIP contient uniquement les fichiers nécessaires à l’exécution et peut être déposé dans la bibliothèque Lively.

## Aperçu et vérification

- `Apercu-Windows.cmd` lance le serveur local et ouvre l’aperçu dans le navigateur.
- `Verifier-Windows.cmd` exécute les tests et valide le paquet source.

Ces deux commandes de développement nécessitent Node.js 18 ou une version plus récente.

## Mode étendu

Si Lively est configuré pour étendre un seul fond sur les deux moniteurs, sélectionner **Double écran étendu** dans les propriétés du fond. Régler ensuite :

- la largeur du moniteur vertical avec `largeur verticale / largeur totale × 100` ;
- l’alignement vertical du moniteur paysage comme dans les paramètres d’affichage Windows.
