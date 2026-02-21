## Attack

All successful attacks do damage, and some attack skills will also apply buffs or debuffs, or have other effects. The player's default attack is an attack skill that is always available to use.

Attacks deal damage with hits. In the case of player, their damage and speed calculations use the player's equipped parts and weapons. In the case of enemies, enemy data is used.

Attacks have a chance to miss (instead of hit), which is dependent on the relation between the attacker's accuracy rating and the target's evasion rating.

### Weapons with multiple projectiles
The weapon firing logic must be decoupled from the animation duration. The FinalAttackInterval timer must start the moment the first projectile is spawned. Do not use 'on animation complete' callbacks to reset the firing timer; use the calculated interval as the sole authority for refire rate.


## DPS
Exists for informative purposes only.
Attacks Speed (Attacks per Second):
$$APS = \frac{1000}{FinalAttackInterval}$$
$$DPS = (AverageDamage \times APS)$$