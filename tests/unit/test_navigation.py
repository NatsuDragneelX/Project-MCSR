# test_navigation.py

import unittest
from src.modules.navigation.pathfinding import Pathfinding

class TestPathfinding(unittest.TestCase):
    def setUp(self):
        """Set up a simple grid for pathfinding tests."""
        self.grid = [
            [0, 0, 0, 1, 0],
            [0, 1, 0, 1, 0],
            [0, 0, 0, 0, 0],
            [1, 0, 1, 1, 0],
            [0, 0, 0, 0, 0]
        ]
        self.pathfinder = Pathfinding(self.grid)

    def test_is_valid_cell(self):
        """Test if a cell is valid or not."""
        self.assertTrue(self.pathfinder.is_valid_cell(0, 0))
        self.assertFalse(self.pathfinder.is_valid_cell(1, 3))

    def test_a_star_search_finds_valid_path(self):
        """Test if A* search finds a valid path."""
        start = (0, 0)
        goal = (4, 4)
        path = self.pathfinder.a_star_search(start, goal)
        self.assertIsNotNone(path)
        self.assertEqual(path[0], start)
        self.assertEqual(path[-1], goal)

    def test_a_star_search_no_path(self):
        """Test if A* search returns None when no path exists."""
        start = (0, 0)
        goal = (3, 2)  # Surrounded by obstacles
        path = self.pathfinder.a_star_search(start, goal)
        self.assertIsNone(path)

if __name__ == '__main__':
    unittest.main()
