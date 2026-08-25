# Version macOS

La version macOS est un bundle d’application nommé `Liquide-Wallpaper.app` — affiché « Liquide-Wallpaper » par macOS. Elle affiche uniquement la composition paysage dans une surface de **1470 × 956 points** et réutilise le moteur WebGL commun du projet.

## Ouvrir l’application

Le livrable prêt à utiliser se trouve dans `dist/macos/` après construction :

```text
Liquide-Wallpaper.app
Liquide-Wallpaper-macOS.zip
Liquide-Wallpaper-macOS.dmg
```

Double-cliquer sur le fichier `.app`. Un petit bouton apparaît en haut à gauche du fond et ouvre directement les réglages. Une icône demi-cercle reste disponible dans la barre de menus macOS pour ouvrir les réglages, replacer l’animation derrière le Bureau et quitter l’application.

L’application est signée localement de façon ad hoc. Sur un autre Mac, macOS peut demander une première ouverture par clic droit → **Ouvrir**, ou via **Réglages Système → Confidentialité et sécurité → Ouvrir quand même**. Une diffusion publique sans avertissement nécessiterait une signature Developer ID et une notarisation Apple.

Pour la garder active tous les jours, ajouter l’application à **Réglages Système → Général → Ouverture et extensions → Ouvrir avec la session**.

## Reconstruire sur macOS

Depuis la racine du projet :

```bash
npm run package:macos
```

Ou double-cliquer sur `Construire-macOS.command`. Le petit hôte Objective-C/AppKit est compilé avec les outils Apple inclus avec Xcode Command Line Tools et produit un exécutable universel Apple Silicon + Intel.

## Comportement

- paysage uniquement ; aucun mode portrait ni double écran dans cette distribution ;
- taille logique fixe de 1470 × 956, le facteur Retina étant géré par le canvas ;
- fenêtre sans bordure placée juste sous les icônes du Bureau ;
- présence dans tous les Espaces ;
- menu Web discret ancré à gauche, accessible depuis un petit lanceur natif ou depuis l’icône de barre de menus ;
- aucune connexion réseau.

Cette méthode est un hôte de fond d’écran applicatif. macOS ne fournit pas de format public équivalent à Lively pour exécuter directement un shader interactif comme fond système.
