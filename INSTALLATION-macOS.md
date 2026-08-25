# Installation macOS

La version macOS est une application native nommée `Liquide-Wallpaper.app`. Elle cible macOS 13 ou plus récent, fonctionne sur Apple Silicon et Intel, et affiche exclusivement la composition paysage **1470 × 956**.

## Installation

1. Ouvrir `Liquide-Wallpaper-macOS.dmg`.
2. Glisser `Liquide-Wallpaper.app` dans le dossier **Applications**.
3. Double-cliquer sur l’application.
4. Utiliser le petit bouton en haut à gauche du fond pour ouvrir les réglages. L’icône demi-cercle de la barre de menus permet aussi de les ouvrir ou de quitter.

Le `.app` fourni est signé localement, mais pas notarisé par Apple. Lors de la première ouverture sur un autre Mac, faire un clic droit sur l’application puis **Ouvrir**. Si macOS la bloque encore, aller dans **Réglages Système → Confidentialité et sécurité** et choisir **Ouvrir quand même**.

## Réglages

Cliquer sur le petit bouton en haut à gauche. L’application passe temporairement au premier plan et déploie le menu du fond, également à gauche : vitesse des veines, intensité, déformation, contraste, grain, quatre couleurs et seed. La vitesse pilote ensemble déplacement, torsion et déformation ; la valeur `0` fige complètement le motif. Le réglage **Déformation** contrôle l’amplitude. **Réglages du marbre…** dans l’icône de barre de menus reste un accès de secours.

Après modification, utiliser **Replacer en fond d’écran** dans la barre de menus. L’application repasse derrière les fenêtres et les icônes du Bureau.

## Lancer automatiquement à la connexion

Pour que le fond démarre chaque jour :

1. placer l’application dans le dossier **Applications** ;
2. ouvrir **Réglages Système → Général → Ouverture et extensions** ;
3. dans **Ouvrir avec la session**, cliquer sur **+** et choisir `Liquide-Wallpaper.app`.

macOS relancera ensuite l’application à chaque ouverture de session. L’animation reste synchronisée avec l’heure locale après une veille.

## Construction depuis les sources

Double-cliquer sur `Construire-macOS.command`, ou lancer :

```bash
npm run package:macos
```

Les fichiers sont produits dans :

```text
dist/macos/Liquide-Wallpaper.app
dist/macos/Liquide-Wallpaper-macOS.zip
dist/macos/Liquide-Wallpaper-macOS.dmg
```

Xcode Command Line Tools est requis uniquement pour reconstruire l’application, pas pour l’utiliser.
