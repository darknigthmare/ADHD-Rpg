# Audit complet NeuroQuest - 2026-07-13

## Portee

Application auditee : NeuroQuest / ADHD-Rpg, version live `https://adhd-rpg.vercel.app/`.

Ce rapport couvre : etat visuel, UX TDA(H), mobile, sauvegarde locale/cloud, progression XP/PO, boutique, equipe/social, themes/lore, battle scene, assets, gameplay long terme et zones mortes ou fragiles.

Limites : pas de test avec deux vrais comptes Supabase simultanes, pas de test lecteur d'ecran complet, pas de mesure audio objective en dB, pas d'audit reseau exhaustif car l'API `performance` n'etait pas disponible dans le navigateur de test.

## Captures

- `01-live-accueil.png` : accueil et connexion.
- `02b-live-aujourdhui-viewport.png` : onglet Aujourd'hui.
- `03-live-quetes.png` : onglet Quetes.
- `04-live-outils.png` : onglet Outils.
- `05-live-boutique.png` : onglet Boutique.
- `06-live-equipe.png` : onglet Mon Equipe.
- `07-mobile-aujourdhui.png` a `11-mobile-equipe.png` : version mobile.

## Verdict global

NeuroQuest est coherent dans sa direction : RPG d'organisation TDA(H), progression liee aux actions reelles, battle scene toujours visible, focus/noise, planner, repos, boutique, equipe et raids. Les grosses briques sont en place.

Les risques principaux ne sont plus des erreurs bloquantes, mais des risques de produit qui grossit vite : trop de panneaux visibles, modales cachees encore presentes dans le DOM, theme zombie incomplet, battle scene chargee sur mobile, progression raid potentiellement trop longue, et `index.html` encore trop massif pour evoluer sans regressions.

## Etapes auditees

1. Accueil : bon, mais perfectible.
   L'ecran est clair et rassurant. Le compte et la validation email sont expliques. Risque : toute l'application reste montee derriere la modale, ce qui peut brouiller la lecture accessibilite si le fond n'est pas inert/aria-hidden.

2. Aujourd'hui : fonctionnel, dense.
   La boucle TDA(H) est claire : prochaine action, PV, eau reelle, bataille, aides. Risque : meme apres simplification, l'ecran contient encore beaucoup d'informations dans le premier viewport.

3. Quetes : bon socle.
   Journal, filtres monde/type, planner et propositions sont au bon endroit. Les monstres sont reliables aux quetes. Risque : les filtres et le planner demandent encore une vraie hierarchy visuelle quand il y a beaucoup de mondes.

4. Outils : coherent mais sensible au doublon.
   Mode bruit, focus, recuperation et aides sont logiques ici. Risque : certains controles audio existent aussi dans le widget Focus Raid, donc il faut garder un seul etat source pour eviter les divergences.

5. Boutique : coherent gameplay.
   PO depensees pour equipements, soins, consommables et recompenses reelles. Les consommables d'action reelle demandent confirmation avant validation. Risque : categories et boutons internes manquent encore parfois de tooltip/aria-label.

6. Mon Equipe : fonctionnel, mais a surveiller.
   Invitations, live/cloud, co-op boss raids et bonus d'equipe sont comprehensibles. Risque : "mode secours local" peut etre lu comme un etat normal alors que le concept vise le live avec compte.

7. Mobile : utilisable.
   Pas de debordement horizontal mesure, cibles tactiles principales correctes, focus global visible. Risque : battle scene tres chargee, labels de monstres petits, boss + timer + bruit prennent beaucoup de place.

## Ce qui semble casse ou fragile

1. Modales cachees detectees comme mesurables.
   Les overlays `.modal-overlay` sont caches par `opacity/visibility/pointer-events`, mais gardent des dimensions. Visuellement ce n'est pas casse, mais c'est un risque clavier/lecteur d'ecran. A corriger avec `aria-hidden`, gestion du focus, et idealement `inert` sur les modales fermees ou sur le fond quand une modale est ouverte.

2. Theme zombie incomplet.
   Assets detectes : 16 monstres et 16 boss zombie. Manquant : `assets/backgrounds/layers/zombie/back.webp`, `floor.webp`, `props.png`. Le theme zombie n'est pas dans `WORLD_THEME_OPTIONS`, donc il existe comme contenu mais pas comme theme monde complet.

3. Plusieurs boutons visibles n'ont pas encore d'aide claire.
   Exemples detectes : categories inventaire/collections, actions cloud, reset, coffre/marchand, certains boutons generes. La plupart des gros boutons ont des tooltips, mais pas encore tout.

4. Battle scene mobile surchargee.
   Le hero, les monstres, le Focus Raid et les labels tiennent, mais la lecture devient limite. En mode calme, il faudrait reduire plus fortement labels, transparences, particules et densite de sprites.

5. Captures full-page polluees par sticky header/battle scene.
   Ce n'est pas forcement visible pour le joueur, mais c'est un signal que les elements sticky peuvent compliquer impression/export/tests visuels.

6. `index.html` reste le plus gros risque technique.
   Plus de 800 Ko avec rendu, etat, audio, cloud, gameplay, battle, boutique et equipe dans un seul fichier. Toute evolution importante augmente le risque de regression.

## Pas utilise ou partiellement relie

1. Zombie : contenu de monstres/boss present, theme monde absent/incomplet.
2. Some legacy naming reste : `STORAGE_KEY = "questlog_rpg_state"` alors que le produit s'appelle NeuroQuest. Pas visible joueur, mais dette de coherence.
3. SNL n'est pas dans le perimetre de cette app. Les instructions AGENTS.md concernent un autre projet UE/Stargate et ne doivent pas guider NeuroQuest.
4. Le role libre du heros est encore surtout identitaire. Les classes ont des effets plus clairs; le role libre sert a la fiche/personnalisation, pas au gameplay profond.

## Coherence gameplay XP / PO

Points solides :

- XP/PO viennent d'actions : quete, sous-tache, Focus Raid, boss, haut fait.
- Le repos ne donne plus de PO/XP, il soigne et prepare un buff.
- Les consommables reels demandent confirmation avant effet.
- Les hauts faits donnent une recompense PO.
- Les stats ont un rendement reduit apres 50 puis 100, ce qui evite une inflation brute.

Risques :

- Les boss de depart montent jusqu'a 15000 HP, puis certains boss suggeres montent aussi tres haut. A haut niveau cela peut devenir motivant si le joueur a des raids d'equipe, mais frustrant en solo.
- Les bonus empilables peuvent devenir opaques : equipement, familier, streak, transcendance, repos, planner, pacing. Le joueur voit le gain final, mais pas toujours pourquoi il obtient ce montant.
- Les PO peuvent etre depensees dans beaucoup de directions. Il manque un conseil clair "meilleur achat maintenant" dans les cas ou le joueur a peu de PV, pas de familier, ou trop peu d'equipement.

## Gameplay long terme

Ce qui fonctionne :

- Progression niveau + stats + equipement + familiers + collection + raids + prestige.
- Les mondes permettent de classer les projets.
- Les hauts faits couvrent quetes, boss, planner, themes, hydratation, bruit, repos, equipe.

Ce qui manque pour tenir longtemps :

1. Une courbe de progression visible.
   Exemple : niveau 1-5 apprentissage, 5-10 equipement, 10+ prestige, 20+ raids longs, etc.

2. Une saison ou chapitre.
   Les mondes/projets gagneraient a avoir un objectif de chapitre : nettoyer 10 quetes, battre 1 boss, puis "monde apaise".

3. Des paliers de boss solo vs equipe.
   Les boss doivent afficher "solo raisonnable", "equipe conseillee", "raid long".

4. Des recompenses reelles mieux structurees.
   Il faut distinguer recompense plaisir, recuperation, hygiene de vie, social, pause courte.

5. Une meilleure lisibilite de la meta progression.
   Le prestige existe, mais son role devrait etre explique dans une fiche "fin de chapitre".

## Lore / themes

Themes complets en assets : medieval, horror, cyberpunk, scifi, noir, inferno, arcane, stargate, sartorius.

Theme zombie : sprites complets mais decor/theme incomplet.

Stargate : la direction egyptienne/jaffa existe dans le code et les assets. Attention : rester "inspire portail egyptien" plutot que copier trop directement la franchise, surtout si l'app est publique.

Arcane : coherent comme "ecole de magie" plutot que nommer directement Harry Potter.

Inferno : coherent comme enfer brutal/djent, mais eviter de nommer directement Doom dans l'UI publique.

Noir : coherent gangster/detective.

Sci-fi : xeno-like present; pareil, rester inspire et ne pas nommer Alien/Xenomorph publiquement si l'app vise une distribution large.

## Accessibilite / TDA(H)

Points forts :

- Bouton Focus global visible.
- Tooltips deja tres presents.
- Mode faible energie, mode calme, me guider, je suis bloque.
- Prochaine action persistante.
- Hydratation expliquee comme action reelle.

Risques :

- Trop d'elements dans certains premiers viewports.
- Modales fermees potentiellement encore dans l'ordre de focus.
- Effets visuels et battle scene premium peuvent fatiguer sans mode calme plus strict.
- Le bouton reset total doit avoir plus de friction et un texte moins brutal.

## Priorites recommandees

1. Decouper `index.html` progressivement : `state/cloud`, `audio`, `quests/planner`, `battle`, `shop`, `team`.
2. Corriger l'accessibilite des modales : focus trap, `aria-hidden`, `inert`, retour focus.
3. Completer ou retirer le theme zombie de la selection tant qu'il n'a pas ses decors.
4. Ajouter une fiche "Pourquoi ce gain ?" sur les quetes : base + bonus + malus + total.
5. Ajouter une classification boss : solo, long, equipe.
6. Renforcer le mode calme mobile : labels reduits, sprites simples, widget focus compact, moins de particules.
7. Transformer le role libre du heros en champ narratif clairement indique "n'affecte pas les stats".
8. Ajouter un "meilleur achat conseille" dans Boutique.
9. Renommer les cles historiques visibles/dev importantes de QuestLog vers NeuroQuest.
10. Faire un vrai test multi-compte Supabase : compte A invite compte B, B accepte, A/B voient l'equipe apres reload.

## Statut apres corrections

Les points techniques et produit corrigibles sans comptes de test externes ont ete traites :

- modales fermees `inert`, focus piege dans la fenetre active et retour au bouton d'origine ;
- theme zombie complet avec sol, fond, props, musique, lieux et selection de monde ;
- tooltips et noms accessibles centralises pour les actions qui demandent une explication ;
- mode calme mobile renforce, battle scene compacte et effets meteo/particules masques ;
- detail `Pourquoi ce gain ?` avec base, bonus, malus et total, y compris les sous-taches ;
- raids classes `Solo`, `Raid long` ou `Equipe` avec estimation du nombre de quetes ;
- recompenses reelles classees par usage et duree ;
- role du heros explicitement narratif et facultatif ;
- conseil d'achat contextuel confirme dans la boutique ;
- sauvegarde locale migree vers `neuroquest_state_v2` et reset total protege par double confirmation ;
- acceptation d'invitation live rendue atomique par RPC Supabase, droits `anon` retires et politiques RLS durcies ;
- premiere phase du decoupage realisee dans `js/neuroquest-config.js`, `js/neuroquest-i18n.js`, `js/neuroquest-a11y.js` et `js/neuroquest-tooltips.js` ;
- identifiants internes des SVG de monstres rendus uniques pour les hordes ;
- controle automatise ajoute dans `tools/check-app.mjs`.

Validation locale finale : aucun doublon d'identifiant dynamique, aucune erreur console, aucun debordement horizontal a 390 px, 21 badges de raid rendus et toutes les modales fermees retirees de la navigation accessible.

Reste a valider manuellement avec deux comptes Supabase confirmes : creation d'une invitation par A, acceptation par B, rechargement des deux sessions et suppression de l'amitie. Le schema et le parcours applicatif correspondants sont en place.
