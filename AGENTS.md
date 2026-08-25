# AGENTS.md — Fond Écran Jour/Nuit

> Statut : provisoire  
> Dernière révision : 2026-08-25  
> Validation : utilisateur du projet

## 1. Direction du projet

- Mission confirmée : créer un fond d’écran dynamique multiplateforme qui suit un cycle jour/nuit pendant toute la journée sans vidéo de 24 heures.
- Résultat recherché : un même marbre minéral synchronisé avec l’heure locale, livré séparément pour Windows et macOS. Windows conserve la composition double écran avec priorité au vertical droit ; macOS utilise exclusivement une composition paysage 1470 × 956.
- Critères provisoires de réussite : marbre clair stratifié le jour, assombrissement progressif en fin de journée, graphite presque noir à nappes grises lisibles la nuit, grandes masses diagonales fumées proches de `boo fond terminal.jpg`, quelques filons ouverts nettement marqués avec halo, corps et âme irréguliers, inclusions minérales contrastées courtes et poudreuses, fines rayures non périodiques, seed reproductible, menu repliable discret, rendu Retina/2K/4K, reprise après veille et consommation raisonnable. Aucun personnage, Boo ou objet figuratif ne doit apparaître.

## 2. Utilisateurs et besoins

- Utilisateur prioritaire : propriétaire du projet sur Windows 10/11 et macOS.
- Besoins principaux : distributions clairement séparées, installation simple, cycle fiable, mouvement organique non répétitif, cohérence des deux écrans Windows et version macOS paysage immédiatement ouvrable.
- Décision finale : utilisateur du projet.

## 3. Périmètre

- Inclus dans le socle : shader WebGL de marbre graphite stratifié, heure système, palettes jour/nuit, seed reproductible, menu intégré repliable, dispositions Windows Lively par écran ou étendue, hôte macOS AppKit/WebKit paysage 1470 × 956, empaquetage séparé et tests sans dépendance d’exécution.
- Hors périmètre actuel : Linux, déploiement comme site web public, météo en ligne, audio, rendu 3D, installateur Windows `.exe` autonome, notarisation Developer ID et publication dans une galerie ou un App Store.
- Livrables : moteur web commun, paquet Lively Windows, application `.app` macOS universelle, archives de transport, documentation et contrôles de validation.

## 4. Priorités et arbitrages

1. Qualité de la composition verticale décorative sur l’écran Windows droit.
2. Séparation claire et fiabilité des distributions Windows et macOS.
3. Cohérence du double écran Windows et netteté du paysage macOS 1470 × 956.
4. Faible consommation, stabilité sur une journée complète et synchronisation avec l’heure réelle.

- Compromis accepté : préférer un shader WebGL procédural sans moteur 3D complet pour préserver la fluidité et la taille du paquet.
- Compromis interdit : dépendre d’un service réseau pour afficher le cycle de base.

## 5. Contraintes, risques et dépendances

- Contraintes confirmées : fonctionnement continu ; pas de MP4 de 24 h.
- Plateformes confirmées : Windows 10/11 et macOS 13+ ; aucune compatibilité Linux n’est requise.
- Hôtes techniques : HTML/CSS/WebGL dans Lively Wallpaper sur Windows ; application native AppKit/WebKit au format `.app` sur macOS.
- Configuration Windows confirmée : écran principal paysage à gauche en 2K ou 4K ; écran décoratif vertical à droite, considéré comme le plus important.
- Configuration macOS confirmée : une seule composition paysage de 1470 × 956 points, sans portrait ni mode double écran ; canvas Retina via `devicePixelRatio`.
- Direction artistique confirmée : `boo fond terminal.jpg` est la référence visuelle prioritaire pour la matière, sans reprendre Boo ni aucun élément figuratif. Le shader vise de grandes nappes obliques fumées, une profondeur graphite, des veines d’épaisseur variable, des halos poudreux et de rares fissures ou poussières. Le jour conserve une inversion claire de la même géologie ; la nuit se rapproche directement de la photo. Éviter les spirales évidentes, les bandes périodiques, les zébrures et le brillant liquide. La méthode Clip Studio reste une inspiration procédurale secondaire ; aucune montagne ni représentation de coucher de soleil.
- Risques : charge GPU excessive en très haute résolution, contraste insuffisant pendant l’inversion jour/nuit, dimensions exactes et alignement physique Windows encore inconnus. Sur macOS, le positionnement derrière les icônes utilise pragmatiquement `CGWindowLevelForKey`, API qu’Apple ne recommande pas aux applications ; son comportement doit être revérifié après une mise à jour majeure de macOS.
- Dépendances d’exécution : Windows 10/11 avec Lively Wallpaper, ou macOS 13+ pour le `.app` ; aucune dépendance web externe. Node.js et Xcode Command Line Tools ne servent qu’au développement et à la construction.
- Budget et échéance : à clarifier.

## 6. Organisation et conventions

- `index.html`, `src/`, `assets/` : moteur commun, cycle horaire, shader WebGL, configuration de matière, disposition et styles.
- `platforms/windows/` : métadonnées et packaging Lively.
- `platforms/macos/` : hôte AppKit/WebKit, `Info.plist`, sources natives et script de construction du `.app` universel.
- `tests/` et `scripts/` : vérifications automatiques et serveur de développement.
- Les fichiers `.cmd` à la racine constituent les entrées utilisateur Windows ; `Construire-macOS.command` constitue l’entrée de construction macOS.
- JavaScript natif, UTF-8, pas de dépendance d’exécution, paramètres regroupés dans `LivelyProperties.json`.
- Vérification commune : `npm test` et `npm run validate`; contrôle Windows via `Verifier-Windows.cmd` et contrôle macOS par construction/signature/lancement du `.app`.

## 7. Exigences de qualité

- Le rendu doit s’adapter à la résolution et limiter son taux d’images.
- Les grandes veines doivent bouger et se déformer de façon organique, lente mais perceptible au réglage par défaut. Le déplacement, la torsion et la respiration des formes partagent exactement la même phase d’animation interne et le même réglage de vitesse, jusqu’à l’arrêt complet ; le réglage « Déformation » pilote leur amplitude. Le portrait doit conserver sa propre distribution aléatoire sans devenir un simple recadrage du paysage, et l’animation ne doit pas donner une impression de liquide uniforme.
- L’heure locale pilote silencieusement le cycle jour/nuit mais ne doit jamais être affichée sur le fond d’écran ni proposée comme option visuelle.
- Les frontières doivent rester irrégulières et localement lisibles, avec un cœur parfois net entouré d’une transition minérale douce ; éviter aussi bien les cassures artificielles que les contours graphiques continus.
- La couche de détail contrastée doit rester subordonnée aux grandes nappes : fragments courts et ouverts, cœur d’environ 5 à 8 px et gangue poudreuse plus large, extrémités fondues, aucune bifurcation anguleuse, boucle topographique, griffure blanche ou ligne traversant l’écran.
- La matière doit éviter l’effet zébré régulier : privilégier de grandes zones aléatoires, des nappes remplies plutôt que des boucles de niveau fermées, des stries anisotropes et des variations minérales internes.
- Le menu intégré doit rester fermé par défaut, ancré en haut à gauche, accessible par un petit bouton discret et permettre de régler intensité, déformation, contraste, grain, quatre couleurs et seed aléatoire. Sur macOS, ce bouton est un petit lanceur natif indépendant afin que le reste du Bureau demeure traversant aux clics.
- Une même seed et les mêmes réglages doivent reproduire le même motif ; les réglages du menu sont conservés localement sans réseau.
- Le mode étendu doit accepter une largeur relative et un alignement réglables pour les écrans de résolutions différentes.
- Le rendu doit se suspendre lorsque la page ou Lively est en pause.
- Aucun secret, suivi utilisateur ou appel réseau dans le socle.
- La distribution macOS doit forcer `layout=landscape`, rester fixée à 1470 × 956 points et proposer dans la barre de menus l’accès aux réglages, le retour au Bureau et la fermeture propre.
- Acceptation finale : test Windows avec Lively sur les deux écrans physiques et test macOS du `.app` sur l’écran 1470 × 956 par l’utilisateur.

## 8. Protocole de décision

- Les améliorations techniques réversibles et conformes aux priorités peuvent être réalisées sans validation supplémentaire.
- La direction artistique, le changement de plateforme, l’ajout de services externes et la distribution publique demandent l’accord de l’utilisateur.
- En cas de conflit : présenter le conflit, ses conséquences et demander l’arbitrage.

## 9. Décisions actives

| Date | Décision | Justification | Conséquence | Statut |
|---|---|---|---|---|
| 2026-08-10 | Utiliser une application temps réel plutôt qu’une vidéo de 24 h | Synchronisation, taille et évolutivité | Rendu calculé à partir de l’heure système | confirmée |
| 2026-08-10 | Démarrer en HTML/Canvas compatible Lively | Socle léger et sans compilation | Lively reste nécessaire sur Windows | provisoire |
| 2026-08-10 | Garder le cycle de base hors ligne | Fiabilité et confidentialité | Météo réelle reportée | provisoire |
| 2026-08-10 | Cibler un écran paysage à gauche et un écran vertical décoratif prioritaire à droite | Configuration matérielle précisée par l’utilisateur | Deux compositions et un moteur de disposition sont requis | confirmée |
| 2026-08-10 | Cibler exclusivement la plateforme Windows | Première orientation explicitement confirmée | Documentation et commandes initialement spécifiques à Windows | remplacée le 2026-08-10 |
| 2026-08-10 | Remplacer le paysage par un marbre liquide monochrome évoluant avec le jour et la nuit | Direction artistique explicitement décrite par l’utilisateur | Le moteur Canvas paysager est remplacé par un shader WebGL | confirmée |
| 2026-08-10 | Lisser les veines et privilégier de longues courbes continues | L’utilisateur jugeait les veines initiales trop cassantes | La déformation haute fréquence et les branches secondaires sont fortement réduites | confirmée |
| 2026-08-10 | Prendre les fonds de marbre Boo fournis comme référence de matière | Demande explicite de l’utilisateur | Le shader privilégie des nappes fumées obliques, des strates poudreuses et une profondeur irrégulière plutôt que des lignes régulières | confirmée |
| 2026-08-10 | Renforcer nettement le contraste des palettes jour et nuit | Demande explicite de l’utilisateur après validation de la matière | Le blanc du jour est plus lumineux, les veines diurnes plus noires et les veines nocturnes plus lisibles sur un fond presque noir | confirmée |
| 2026-08-10 | Remplacer les nappes liquides par une base minérale aléatoire | L’utilisateur jugeait le rendu encore trop liquide | Le champ aléatoire reste la base du motif et reçoit ensuite des tourbillons contrôlés, des variations internes et une dérive ralentie | confirmée |
| 2026-08-10 | Adapter en monochrome l’apparence du tutoriel Clip Studio 9287 | Référence explicite fournie par l’utilisateur | Cette piste a guidé le premier shader à tourbillons | remplacée le 2026-08-12 |
| 2026-08-10 | Ajouter un menu intégré discret et repliable | Demande explicite de l’utilisateur | Intensité, déformation, contraste, grain, couleurs et seed sont réglables en direct et conservés localement | confirmée |
| 2026-08-10 | Séparer les distributions Windows et macOS | Nouvelle demande explicite de l’utilisateur | Le moteur WebGL reste commun, les hôtes et paquets sont rangés sous `platforms/` | confirmée |
| 2026-08-10 | Livrer macOS en application `.app` paysage 1470 × 956 | L’utilisateur veut pouvoir l’ouvrir directement sur macOS | Hôte AppKit/WebKit universel, menu de barre système et ZIP de transport | confirmée |
| 2026-08-10 | Ancrer le menu de réglages en haut à gauche et le rendre directement cliquable sur macOS | Demande explicite de l’utilisateur après essai du `.app` | Petit lanceur natif gauche au-dessus du Bureau, grande fenêtre toujours traversante aux clics | confirmée |
| 2026-08-10 | Animer visiblement les grandes veines du marbre | Demande explicite de l’utilisateur | Courbure, domaine minéral et frontières animés lentement, vitesse exposée dans le menu et arrêt possible à zéro | confirmée |
| 2026-08-10 | Synchroniser la déformation avec le déplacement des veines | Demande explicite de l’utilisateur | Une phase d’animation commune pilote dérive, torsion et respiration ; la vitesse zéro fige toutes les composantes | confirmée |
| 2026-08-11 | Retirer entièrement l’affichage de l’heure | Demande explicite de l’utilisateur | Le cycle continue d’utiliser l’heure système, mais aucun widget ni réglage d’horloge n’est livré | confirmée |
| 2026-08-12 | Faire de `boo fond terminal.jpg` la cible esthétique prioritaire, sans Boo | Demande explicite de l’utilisateur | Le shader remplace les vortex et bandes sinusoïdales par des nappes anisotropes, une veine maîtresse diagonale, des halos, stries et microtextures ; l’image source n’est pas embarquée | confirmée |
| 2026-08-12 | Renforcer les filons sans revenir à un effet graphique ou liquide | L’utilisateur jugeait les veines trop peu marquées | Des iso-contours anisotropes ouverts ajoutent halo, corps, âme et rares fractures ; le vertical reçoit une nappe plus présente, sans boucle topographique ni tracé blanc | confirmée |
| 2026-08-12 | Ajouter une seconde couche d’inclusions minérales contrastées | L’utilisateur souhaite retrouver le détail des premiers traits contrastés sans dégrader le marbre validé | Trois familles de fragments courts, élargis et texturés réutilisent le champ géologique ; leurs gangues diffuses évitent l’effet de rayure, sans nouveau bruit coûteux | confirmée |
| 2026-08-25 | Nommer l’application « Liquide-Wallpaper » | Demande explicite de l’utilisateur | Les intitulés visibles, bundles et archives de distribution utilisent ce nom | confirmée |
| 2026-08-25 | Utiliser un symbole minéral monochrome dans la barre des menus macOS | Demande explicite de l’utilisateur | L’icône présente une veine maîtresse et deux fragments ; le mode template garantit sa lisibilité dans les deux apparences macOS | confirmée |
| 2026-08-25 | Livrer aussi macOS en image disque `.dmg` | Demande explicite de l’utilisateur | La construction macOS génère une image disque installable en plus du bundle et de l’archive ZIP | confirmée |
| 2026-08-25 | Appliquer les éléments graphiques fournis aux distributions | Demande explicite de l’utilisateur | L’icône iOS 1024 px devient l’icône du bundle macOS et la charte graphique devient la vignette Windows/Lively | confirmée |

## 10. Questions ouvertes

| Priorité | Question | Décision débloquée | Responsable |
|---|---|---|---|
| Haute | Quelles sont les résolutions exactes des deux écrans et leur alignement haut/centre/bas ? | Valeurs par défaut du mode étendu | utilisateur |
| Moyenne | Faut-il intégrer météo réelle et saison/localisation ? | Réseau, API et confidentialité | utilisateur |

## 11. Maintenance

Réviser ce fichier après tout changement durable de direction, plateforme, périmètre, architecture ou critère de réussite, à chaque jalon important et après trente jours d’activité sans révision.

Prochaine révision : après confirmation des résolutions et de l’alignement, ou après validation visuelle du marbre sur les écrans physiques.
