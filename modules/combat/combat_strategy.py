# combat_strategy.py

import random
from .mob_behavior import MobBehavior
from modules.combat import mob_behavior

class CombatStrategy:
    def __init__(self, health, resources):
        self.health = health
        self.resources = resources
        self.weapons = self.resources.get('weapons', [])
        self.shield = self.resources.get('shield', False)

    def choose_attack(self, mob_type):
        mob_behavior = MobBehavior(mob_type)

        if mob_behavior.is_hostile():
            if mob_type == 'skeleton' and 'bow' in self.weapons:
                return "use_bow"
            elif mob_type == 'enderman' and 'sword' in self.weapons:
                return "use_sword"
            elif mob_type == 'blaze' and 'crossbow' in self.weapons:
                return "use_crossbow"
            elif mob_type == 'ender_dragon' and 'bed' in self.resources.get('items', []):
                return "use_bed_explosion"
            else:
                return "basic_attack"
        else:
            return "no_attack"

    def defensive_action(self):
        if self.health < 10 and self.shield:
            return "block"
        elif self.health < 5:
            return "retreat"
        return "stand_firm"

    def adapt_strategy(self, mob_type, mob_distance):
        """ Adapts strategy based on distance and current health """
        if mob_distance > 10:
            return "close_distance"
        elif mob_distance <= mob_behavior.get_attack_range() and self.health > 15:
            return self.choose_attack(mob_type)
        else:
            return self.defensive_action()
