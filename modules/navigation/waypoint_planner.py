# waypoint_planner.py

class WaypointPlanner:
    def __init__(self, grid, pathfinder):
        """
        Initialize the waypoint planner.
        :param grid: A 2D grid of the game world.
        :param pathfinder: An instance of the Pathfinding class.
        """
        self.grid = grid
        self.pathfinder = pathfinder

    def plan_waypoints(self, start, waypoints):
        """
        Plan a path that goes through a series of waypoints.
        :param start: Starting position as a tuple (x, y).
        :param waypoints: List of waypoint positions [(x1, y1), (x2, y2), ...].
        :return: Full path from start through all waypoints.
        """
        full_path = []
        current_position = start

        for waypoint in waypoints:
            path = self.pathfinder.a_star_search(current_position, waypoint)
            if path:
                full_path.extend(path[1:])  # Exclude the first node to avoid duplicates
                current_position = waypoint
            else:
                print(f"Path to waypoint {waypoint} not found.")
                return None

        return full_path

    def add_waypoint(self, waypoint):
        """Add a new waypoint to the grid."""
        if self.pathfinder.is_valid_cell(*waypoint):
            self.grid[waypoint[0]][waypoint[1]] = 0  # Mark as a valid path cell
        else:
            print("Invalid waypoint location.")
