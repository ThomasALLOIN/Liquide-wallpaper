# Installation macOS

La version macOS est une application native nommée `Liquide-Wallpaper.app`. Elle cible macOS 13 ou plus récent, fonctionne sur Apple Silicon et Intel, et affiche exclusivement la composition paysage **1470 × 956**.

## Installation

1. Ouvrir `Liquide-Wallpaper-macOS.dmg`.
2. Glisser `Liquide-Wallpaper.app` dans le dossier **Applications**.
3. Double-cliquer sur l’application.
4. Le fond s’affiche sans bouton. L’icône Liquide-Wallpaper dans la barre des menus ouvre une palette circulaire réservée aux quatre couleurs du marbre.

Le `.app` fourni est signé localement, mais pas notarisé par Apple. Lors de la première ouverture sur un autre Mac, faire un clic droit sur l’application puis **Ouvrir**. Si macOS la bloque encore, aller dans **Réglages Système → Confidentialité et sécurité** et choisir **Ouvrir quand même**.

## Variation automatique

La composition reçoit une seed aléatoire au début de chaque tranche de deux heures. Elle garde le même motif pendant cette tranche, y compris après une veille, puis se renouvelle automatiquement. Aucun réglage manuel n’est affiché.

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
