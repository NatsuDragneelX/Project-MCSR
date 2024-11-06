# test_combat.py

import unittest
from src.modules.combat.combat_strategy import CombatStrategy

class TestCombatStrategy(unittest.TestCase):
    def setUp(self):
        """Set up test environment with sample data."""
        self.health_full = 20
        self.health_low = 5
        self.resources = {'weapons': ['sword', 'bow'], 'shield': True, 'items': ['bed']}
        self.combat_strategy = CombatStrategy(self.health_full, self.resources)

    def test_choose_attack_skeleton(self):
        """Test attack choice when facing a skeleton."""
        attack = self.combat_strategy.choose_attack('skeleton')
        self.assertEqual(attack, 'use_bow')

    def test_choose_attack_enderman(self):
        """Test attack choice when facing an enderman."""
        attack = self.combat_strategy.choose_attack('enderman')
        self.assertEqual(attack, 'use_sword')

    def test_choose_attack_ender_dragon(self):
        """Test attack choice when facing the Ender Dragon."""
        attack = self.combat_strategy.choose_attack('ender_dragon')
        self.assertEqual(attack, 'use_bed_explosion')

    def test_defensive_action_with_low_health(self):
        """Test defensive behavior when health is low."""
        combat_strategy_low_health = CombatStrategy(self.health_low, self.resources)
        defense = combat_strategy_low_health.defensive_action()
        self.assertIn(defense, ['block', 'retreat'])

    def test_adapt_strategy_close_distance(self):
        """Test strategy adaptation when the mob is close."""
        strategy = self.combat_strategy.adapt_strategy('zombie', mob_distance=2)
        self.assertIn(strategy, ['use_sword', 'basic_attack'])

if __name__ == '__main__':
    unittest.main()
