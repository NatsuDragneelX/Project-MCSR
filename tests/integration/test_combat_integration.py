# test_combat_integration.py

import unittest
from src.modules.combat.combat_strategy import CombatStrategy
from src.modules.navigation.pathfinding import Pathfinding

class TestCombatIntegration(unittest.TestCase):
    def setUp(self):
        """Set up environment for combat integration tests."""
        self.health = 15
        self.resources = {'weapons': ['sword', 'bow'], 'shield': True, 'items': ['potion']}
        self.combat_strategy = CombatStrategy(self.health, self.resources)
        
        self.grid = [
            [0, 0, 0, 1, 0],
            [0, 1, 0, 1, 0],
            [0, 0, 0, 0, 0],
            [1, 0, 1, 1, 0],
            [0, 0, 0, 0, 0]
        ]
        self.pathfinder = Pathfinding(self.grid)

    def test_combat_with_navigation_path(self):
        """Test if combat can work alongside navigation."""
        path = self.pathfinder.a_star_search((0, 0), (4, 4))
        self.assertIsNotNone(path)
        attack = self.combat_strategy.choose_attack('skeleton')
        self.assertEqual(attack, 'use_bow')
        defense = self.combat_strategy.defensive_action()
        self.assertIn(defense, ['block', 'stand_firm'])

if __name__ == '__main__':
    unittest.main()
