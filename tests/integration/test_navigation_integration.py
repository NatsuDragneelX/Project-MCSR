# test_navigation_integration.py

import unittest
from src.modules.navigation.pathfinding import Pathfinding
from src.modules.navigation.waypoint_planner import WaypointPlanner

class TestNavigationIntegration(unittest.TestCase):
    def setUp(self):
        """Set up environment for navigation integration tests."""
        self.grid = [
            [0, 0, 0, 1, 0],
            [0, 1, 0, 1, 0],
            [0, 0, 0, 0, 0],
            [1, 0, 1, 1, 0],
            [0, 0, 0, 0, 0]
        ]
        self.pathfinder = Pathfinding(self.grid)
        self.waypoint_planner = WaypointPlanner(self.grid, self.pathfinder)

    def test_waypoint_pathfinding(self):
        """Test pathfinding through waypoints."""
        start = (0, 0)
        waypoints = [(2, 2), (4, 4)]
        full_path = self.waypoint_planner.plan_waypoints(start, waypoints)
        self.assertIsNotNone(full_path)
        self.assertEqual(full_path[0], start)
        self.assertEqual(full_path[-1], (4, 4))

if __name__ == '__main__':
    unittest.main()
