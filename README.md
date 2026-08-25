# Liquide-Wallpaper — Windows et macOS

Fond d’écran procédural de marbre monochrome qui suit silencieusement l’heure locale, sans afficher d’horloge ni menu : pierre claire stratifiée le jour, transition progressive en soirée, puis graphite noir et nappes grises la nuit. Les grandes veines, stries et voiles minéraux se déplacent et se déforment lentement. Une seed aléatoire renouvelle la composition toutes les deux heures. Le rendu WebGL est calculé en temps réel, sans vidéo de 24 heures, réseau ni bibliothèque externe.

La matière prend comme référence prioritaire le fond `boo fond terminal.jpg` fourni par l’utilisateur : larges nappes diagonales fumées, haut très sombre, halos poudreux et fines rayures irrégulières. Les filons principaux possèdent un halo, un corps et une âme plus marqués, ouverts et irréguliers, avec une présence renforcée dans la composition verticale. Une seconde couche d’inclusions minérales contrastées ajoute des fragments courts, plus larges et poudreux, sans griffures blanches ni boucles topographiques. L’image et le personnage Boo ne sont pas intégrés au paquet ; le shader recrée uniquement la matière.

La distribution macOS reprend l’icône carrée fournie dans `icon/`. La distribution Windows/Lively utilise la charte graphique fournie comme vignette dans la bibliothèque de fonds d’écran.

## Deux distributions séparées

| Plateforme | Format livré | Composition | Utilisation |
|---|---|---|---|
| Windows 10/11 | ZIP pour Lively Wallpaper | paysage gauche 2K/4K + vertical droit prioritaire | `dist/windows/Liquide-Wallpaper-Lively.zip` |
| macOS 13+ | application `.app` universelle et image disque `.dmg` | paysage uniquement, 1470 × 956 | `dist/macos/Liquide-Wallpaper-macOS.dmg` |

Le moteur visuel commun reste à la racine dans `index.html`, `src/` et `assets/`. Les hôtes et métadonnées propres à chaque système sont séparés dans `platforms/windows/` et `platforms/macos/`.

## macOS : quel fichier ouvrir ?

Ouvrir **`Liquide-Wallpaper.app`**. Finder le présente comme un seul fichier, mais il s’agit techniquement d’un bundle d’application contenant l’exécutable natif et les ressources WebGL. Dans macOS, son nom affiché est « Liquide-Wallpaper ».

Pour installer l’application, ouvrir `Liquide-Wallpaper-macOS.dmg`, puis glisser `Liquide-Wallpaper.app` dans le dossier **Applications**. L’archive `Liquide-Wallpaper-macOS.zip` reste disponible pour le transport. Le fond ne présente aucun bouton ni menu. Voir `INSTALLATION-macOS.md`.

## Windows

La distribution Windows reste conçue pour Lively Wallpaper. Le mode **Par écran** est recommandé : appliquer le même fond au paysage gauche et au vertical droit, avec **Disposition des écrans → Automatique par écran**. Le mode étendu reste disponible pour une seule surface couvrant les deux écrans. Voir `INSTALLATION-WINDOWS.md`.

## Développement et aperçu

Node.js 18 ou plus récent est requis uniquement pour le développement :

```bash
npm run dev
npm test
npm run validate
```

L’aperçu local est disponible sur `http://127.0.0.1:4173`. Paramètres utiles :

```text
?layout=landscape&hour=12
?layout=portrait&hour=23
?layout=span&portraitShare=36&align=1&hour=19
?speed=120&debug=1
?seed=9287
```

## Construire les paquets

Sous Windows :

```text
Construire-Lively-Windows.cmd
```

Sous macOS :

```text
Construire-macOS.command
```

Ou en terminal, sur la plateforme correspondante :

```bash
# Windows
npm run package:windows

# macOS
npm run package:macos
```

## Architecture

- `index.html`, `src/`, `assets/` : moteur WebGL commun, cycle lumineux et seed tournante ;
- `platforms/windows/` : métadonnées et packaging Lively ;
- `platforms/macos/` : hôte AppKit/WebKit, `Info.plist` et construction du `.app` ;
- `tests/`, `scripts/` : tests, validation et serveur d’aperçu ;
- `dist/` : paquets générés localement.

La version macOS utilise pragmatiquement une fenêtre applicative placée juste sous les icônes du Bureau. Ce n’est pas une API officielle de fond animé garantie par Apple : son comportement devra être revérifié après les mises à jour majeures de macOS. Une distribution publique sans avertissement Gatekeeper nécessiterait aussi une signature Developer ID et une notarisation Apple.
