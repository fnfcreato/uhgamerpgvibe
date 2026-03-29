export class EnemyBattle {
    constructor(def) {
        this.def = def;
        this.name = def.name;
        this.maxHp = def.hp;
        this.hp = def.hp;
        this.damage = def.damage;
        this.dodgePatterns = def.dodgePatterns || [];
        this.attackStatusEffects = def.attackStatusEffects || [];
        this.animator = null;
    }

    get isAlive() {
        return this.hp > 0;
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
    }
}
