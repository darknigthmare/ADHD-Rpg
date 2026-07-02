# Production Sprites Themes - 2026-07-02

## Contenu ajoute

- 10 planches de monstres premium : `medieval`, `horror`, `cyberpunk`, `zombie`, `scifi`, `noir`, `inferno`, `arcane`, `stargate`, `sartorius`.
- 10 planches de boss premium pour les memes themes.
- 16 sprites par planche, soit 160 monstres et 160 boss.
- Une preview globale : `assets/monsters/sheets/all-theme-sprite-previews-v1.png`.

## Integration gameplay

- Les nouvelles quetes choisissent maintenant un sprite premium selon le theme du monde et la difficulte.
- Les boss personnalises choisissent maintenant un boss premium selon le theme du monde.
- Les anciens sprites restent disponibles.
- Le mode calme retombe sur les sprites simples pour eviter la surcharge visuelle.
- Le theme `zombie` dispose maintenant d'un vrai pool de monstres dans `THEMED_MONSTERS`.

## Verification

- Syntaxe JavaScript valide.
- 160 fichiers `*_monster_XX.png` presents.
- 160 fichiers `*_boss_XX.png` presents.
- Aucune planche ou preview manquante.

