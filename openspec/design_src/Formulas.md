
## Weight / Power Output ratio
**Total Weight Calculation**
$$TotalWeight = Weight_{Body} + Weight_{ArmL} + Weight_{ArmR} + Weight_{Legs} + \sum Weight_{Weapons}$$
**Total Power Output Calculation**
$$TotalPowerOutput = PowerOutput_{Body} + PowerOutput_{Legs}$$
**Deployment Constraint**
A unit can only be deployed if
$$TotalWeight \le TotalPowerOutput$$

**Movement Efficiency**
$$MoveEfficiency = \max(5000, 10000 - floor(\max(0, \frac{TotalWeight \times  10000}{TotalPowerOutput} - 7000) \times  \frac{5}{3}))$$

**Defender's Evasion (Mech)**
$$Defender's\ Evasion = \max(0, \min(10000, 10000 - floor(\max(0, \frac{TotalWeight \times  10000}{TotalPowerOutput} - 3000) \times  \frac{10}{7})))$$

## Movement Speed
$$ActualSpeed = floor(EntityBaseSpeed \times  \frac{10000 + \sum AdditiveMods}{10000} \times  \frac{MoveEfficiency}{10000} \times  \frac{\prod StatusMultipliers}{10000^{n}})$$

## Attack Speed
$$Weapon AttackInterval = floor(TypeAttackInterval \times \frac{10000}{10000 + LocalAttackSpeedMod})$$
$$FinalAttackInterval = floor(Weapon AttackInterval \times \frac{10000}{10000 + \sum GlobalAttackSpeedMods})$$

## Chance to Hit
$$Chance\ to\ Hit = \max(\frac{Attacker's\ Accuracy}{10000 + Defender's\ Evasion}, 0.05)$$

## Damage Calculation
Note: this is a temporary solution.
**Attack:** The attacker's equipped weapon `Attack` stat (or the enemy's base attack data).
**Defense:** The `Defense` stat of the specific defender's part that is hit (e.g., Body, Arm L, Arm R, Legs), or the enemy's base defense data.
$$MitigationMultiplier = \frac{Attack}{Attack + Defense}$$
$$FinalDamage = \max(1, round(Attack \times MitigationMultiplier))$$