# pathfinding.py

import heapq

class Pathfinding:
    def __init__(self, grid):
        """
        Initialize the pathfinding with a grid representing the game environment.
        :param grid: A 2D list representing the Minecraft world.
        """
        self.grid = grid
        self.rows = len(grid)
        self.cols = len(grid[0])

    def is_valid_cell(self, x, y):
        """Check if a cell is within bounds and not an obstacle."""
        return 0 <= x < self.rows and 0 <= y < self.cols and self.grid[x][y] != 1

    def heuristic(self, x1, y1, x2, y2):
        """Calculate the Manhattan distance heuristic."""
        return abs(x1 - x2) + abs(y1 - y2)

    def a_star_search(self, start, goal):
        """A* algorithm for finding the shortest path from start to goal."""
        open_list = []
        heapq.heappush(open_list, (0, start))
        came_from = {}
        g_score = {start: 0}
        f_score = {start: self.heuristic(*start, *goal)}

        while open_list:
            _, current = heapq.heappop(open_list)

            if current == goal:
                return self.reconstruct_path(came_from, current)

            neighbors = self.get_neighbors(current)
            for neighbor in neighbors:
                tentative_g_score = g_score[current] + 1

                if neighbor not in g_score or tentative_g_score < g_score[neighbor]:
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g_score
                    f_score[neighbor] = tentative_g_score + self.heuristic(*neighbor, *goal)
                    if neighbor not in [i[1] for i in open_list]:
                        heapq.heappush(open_list, (f_score[neighbor], neighbor))

        return None  # No path found

    def get_neighbors(self, node):
        """Get valid neighboring cells."""
        x, y = node
        directions = [(1, 0), (-1, 0), (0, 1), (0, -1)]
        neighbors = []

        for dx, dy in directions:
            nx, ny = x + dx, y + dy
            if self.is_valid_cell(nx, ny):
                neighbors.append((nx, ny))

        return neighbors

    def reconstruct_path(self, came_from, current):
        """Reconstructs the path from the came_from map."""
        path = [current]
        while current in came_from:
            current = came_from[current]
            path.append(current)
        path.reverse()
        return path
