# mob_behavior.py

class MobBehavior:
    def __init__(self, mob_type):
        self.mob_type = mob_type
        self.attack_damage = self.get_attack_damage()
        self.attack_range = self.get_attack_range()

    def get_attack_damage(self):
        mob_damage = {
            'zombie': 3,
            'skeleton': 4,
            'enderman': 7,
            'blaze': 6,
            'ender_dragon': 15
        }
        return mob_damage.get(self.mob_type, 1)  # Default to 1 if mob type is unknown

    def get_attack_range(self):
        mob_range = {
            'zombie': 1.5,
            'skeleton': 15,
            'enderman': 4,
            'blaze': 10,
            'ender_dragon': 20
        }
        return mob_range.get(self.mob_type, 1.5)

    def is_hostile(self):
        hostile_mobs = ['zombie', 'skeleton', 'enderman', 'blaze', 'ender_dragon']
        return self.mob_type in hostile_mobs

    def attack_pattern(self):
        if self.mob_type == 'skeleton':
            return "ranged_attack"
        elif self.mob_type in ['zombie', 'enderman']:
            return "melee_attack"
        elif self.mob_type == 'blaze':
            return "fireball_attack"
        elif self.mob_type == 'ender_dragon':
            return "swoop_attack"
        else:
            return "melee_attack"
