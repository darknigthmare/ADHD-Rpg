# Audit Mon Equipe - 2026-07-02

## Surface auditee

Onglet `Mon Equipe` de NeuroQuest : resume equipe, invitations amis, quetes coop, compagnons et raids de boss.

## Etat general

L'onglet est coherent dans son intention : il sert a inviter des amis, visualiser l'escouade, synchroniser les amis live et lancer des raids communs. Les sections en tiroirs reduisent le bruit visuel et le resume donne une prochaine action claire.

## Verifications faites

1. Resume equipe : affiche taille d'equipe, bonus raid, raids actifs, quetes coop, et etat live.
2. Invitations : le live passe par Supabase quand le compte est connecte, avec code local de secours si le cloud echoue.
3. Synchronisation : limite les appels repetes, conserve les amis locaux en secours, et rafraichit le rendu equipe + battle scene.
4. Compagnons : affiche le joueur, jusqu'a 3 amis, stats, arme, origine compte/code local et bonus raid.
5. Suppression d'ami live : supprime les deux sens possibles de la relation dans Supabase avant de retirer localement.
6. Raids : creation personnalisee, suggestions, cible principale, recompenses, scaling haut niveau et suppression fonctionnent cote code.
7. Boss suggeres : chaque suggestion pointe vers un `monsterType`, un nom lisible et un PNG existant.

## Corrections appliquees

- Le clic sur un slot vide ouvre maintenant le partage d'invitation, ce qui correspond au texte "Inviter un ami".
- Quand le boss actif est supprime, la cible principale est recalee automatiquement sur le prochain raid actif ou remise a `null`.
- Ajout de 16 nouveaux boss de raid premium avec sprites uniques.

## Limites

Le navigateur integre n'a pas expose d'onglet controlable pendant cette passe, donc l'audit visuel complet par captures n'a pas pu etre produit. La verification a ete faite par lecture de code, controle des assets et validation de syntaxe JavaScript.

