/**
 * @fileOverview A generic maze-search module that supports DFS, BFS, and A* search algorithms.
 *
 * - findPath - A function that finds a path through the maze.
 * - SEARCH_METHODS - A constant array of available search method names.
 * - SearchMethod - Type that indicates the search method, derived from SEARCH_METHODS.
 * - getSearchMethods - Function to retrieve the list of available search methods.
 * - SearchNode - Interface for nodes used in the search algorithms.
 * - MazeCell - Interface representing the structure of a maze cell.
 */

/**
 * List of all available search methods. Automatically used in the UI.
 */
export const SEARCH_METHODS = [
  'DFS',
  'DFS_EXPLORE',
  'BFS',
  'BFS_EXPLORE',
  'ASTAR',
  'ASTAR_EXPLORE'
] as const;

/**
 * Union type for search methods, derived from SEARCH_METHODS.
 */
export type SearchMethod = typeof SEARCH_METHODS[number];

interface SearchNode {
  x: number;
  y: number;
  path: [number, number][];
}

interface MazeCell {
  north: boolean;
  east: boolean;
  south: boolean;
  west: boolean;
}

/**
 * Returns the list of methods for dynamic UI generation.
 * @returns Array of SearchMethod names.
 */
export function getSearchMethods(): SearchMethod[] {
  return SEARCH_METHODS as unknown as SearchMethod[];
}


/**
 * Finds a path through the maze using the specified algorithm.
 * @param startX Starting column index.
 * @param startY Starting row index.
 * @param endX   Exit column index.
 * @param endY   Exit row index.
 * @param method Which algorithm to use ('DFS', 'BFS', 'ASTAR', etc.).
 * @param maze   2D array of MazeCell describing walls.
 * @returns       Array of [x,y] coordinates *after* the start, or [] if no path exists.
 */
export function findPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  method: SearchMethod,
  maze: MazeCell[][]
): [number, number][] {
  switch (method) {
    case 'DFS':
      return dfs(startX, startY, endX, endY, maze);
    case 'BFS':
      return bfs(startX, startY, endX, endY, maze);
    case 'ASTAR':
      return astar(startX, startY, endX, endY, maze);
    case 'DFS_EXPLORE':
      return dfsExplore(startX, startY, endX, endY, maze);
    case 'BFS_EXPLORE':
      return bfsExplore(startX, startY, endX, endY, maze);
    case 'ASTAR_EXPLORE':
      return astarExplore(startX, startY, endX, endY, maze);
    default:
      return [];
  }
}

/**
 * Implements the Depth-First Search algorithm to find a path through the maze.
 * @param startX Starting column index.
 * @param startY Starting row index.
 * @param endX   Exit column index.
 * @param endY   Exit row index.
 * @param maze   2D array of MazeCell describing walls.
 * @returns       Array of [x,y] coordinates *after* the start, or [] if no path exists.
 */
function dfs(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  maze: MazeCell[][]
): [number, number][] {
  const stack: SearchNode[] = [{ x: startX, y: startY, path: [[startX, startY]] }];
  const visited = new Set<string>();
  const MAZE_WIDTH = maze[0].length;
  const MAZE_HEIGHT = maze.length;

  while (stack.length > 0) {
    const node = stack.pop()!;
    const { x, y, path } = node;
    const key = `${x},${y}`;

    if (visited.has(key)) continue;
    visited.add(key);

    if (x === endX && y === endY) {
      return path.slice(1); // Exclude the starting cell
    }

    // Explore neighbors in the order: Up, Right, Down, Left
    const directions: { dx: number; dy: number; wall: (cell: MazeCell) => boolean }[] = [
      { dx: 0, dy: -1, wall: cell => cell.north }, // Up
      { dx: 1, dy: 0, wall: cell => cell.east },  // Right
      { dx: 0, dy: 1, wall: cell => cell.south }, // Down
      { dx: -1, dy: 0, wall: cell => cell.west }  // Left
    ];

    // Push neighbors onto the stack in reverse order
    for (let i = directions.length - 1; i >= 0; i--) {
      const { dx, dy, wall } = directions[i];
      const nx = x + dx;
      const ny = y + dy;

      if (nx >= 0 && nx < MAZE_WIDTH && ny >= 0 && ny < MAZE_HEIGHT && !wall(maze[y][x])) {
        stack.push({ x: nx, y: ny, path: [...path, [nx, ny]] });
      }
    }
  }

  return []; // No path found
}

/**
 * Implements the Breadth-First Search algorithm to find a path through the maze.
 * @param startX Starting column index.
 * @param startY Starting row index.
 * @param endX   Exit column index.
 * @param endY   Exit row index.
 * @param maze   2D array of MazeCell describing walls.
 * @returns       Array of [x,y] coordinates *after* the start, or [] if no path exists.
 */
function bfs(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  maze: MazeCell[][]
): [number, number][] {
  const queue: SearchNode[] = [{ x: startX, y: startY, path: [[startX, startY]] }];
  const visited = new Set<string>();
   const MAZE_WIDTH = maze[0].length;
  const MAZE_HEIGHT = maze.length;

  while (queue.length > 0) {
    const node = queue.shift()!;
    const { x, y, path } = node;
    const key = `${x},${y}`;

    if (visited.has(key)) continue;
    visited.add(key);

    if (x === endX && y === endY) {
      return path.slice(1); // Exclude the starting cell
    }

    // Explore neighbors in the order: Up, Right, Down, Left
    const directions: { dx: number; dy: number; wall: (cell: MazeCell) => boolean }[] = [
      { dx: 0, dy: -1, wall: cell => cell.north }, // Up
      { dx: 1, dy: 0, wall: cell => cell.east },  // Right
      { dx: 0, dy: 1, wall: cell => cell.south }, // Down
      { dx: -1, dy: 0, wall: cell => cell.west }   // Left
    ];

    for (const { dx, dy, wall } of directions) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx >= 0 && nx < MAZE_WIDTH && ny >= 0 && ny < MAZE_HEIGHT && !wall(maze[y][x])) {
        queue.push({ x: nx, y: ny, path: [...path, [nx, ny]] });
      }
    }
  }

  return []; // No path found
}

/**
 * Implements the Depth-First Search exploration order for the maze.
 * @param startX Starting column index.
 * @param startY Starting row index.
 * @param endX   Exit column index.
 * @param endY   Exit row index.
 * @param maze   2D array of MazeCell describing walls.
 * @returns       Array of [x,y] coordinates in the order they were explored, excluding the start.
 */
function dfsExplore(
 startX: number,
 startY: number,
 endX: number,
 endY: number,
 maze: MazeCell[][]
): [number, number][] {
  const stack: SearchNode[] = [{ x: startX, y: startY, path: [[startX, startY]] }];
  const visited = new Set<string>();
  const explored: [number, number][] = [];
  const WIDTH = maze[0].length;
  const HEIGHT = maze.length;

  while (stack.length > 0) {
    const { x, y } = stack.pop()!;
    const key = `${x},${y}`;
 if (visited.has(key)) continue;
 visited.add(key);
 explored.push([x, y]);

 if (x === endX && y === endY) {
 return explored.slice(1);
    }

    const DIRECTIONS: { dx: number; dy: number; wall: (cell: MazeCell) => boolean }[] = [
      { dx: 0, dy: -1, wall: cell => cell.north }, // Up
      { dx: 1, dy: 0, wall: cell => cell.east },  // Right
      { dx: 0, dy: 1, wall: cell => cell.south }, // Down
      { dx: -1, dy: 0, wall: cell => cell.west }  // Left
    ];

    for (let i = DIRECTIONS.length - 1; i >= 0; i--) {
      const { dx, dy, wall } = DIRECTIONS[i];
      const nx = x + dx, ny = y + dy;
 if (
 nx >= 0 && nx < WIDTH && ny >= 0 && ny < HEIGHT &&
 !wall(maze[y][x])
 ) {
 stack.push({ x: nx, y: ny, path: [] }); // path isn't strictly needed for exploration, but kept for SearchNode consistency
      }
    }
  }

  return explored.slice(1);
}

/**
 * Implements the Breadth-First Search exploration order for the maze.
 * @param startX Starting column index.
 * @param startY Starting row index.
 * @param endX   Exit column index.
 * @param endY   Exit row index.
 * @param maze   2D array of MazeCell describing walls.
 * @returns       Array of [x,y] coordinates in the order they were explored, excluding the start.
 */
function bfsExplore(
 startX: number,
 startY: number,
 endX: number,
 endY: number,
 maze: MazeCell[][]
): [number, number][] {
  const queue: SearchNode[] = [{ x: startX, y: startY, path: [[startX, startY]] }];
  const visited = new Set<string>();
  const explored: [number, number][] = [];
  const WIDTH = maze[0].length;
  const HEIGHT = maze.length;

  while (queue.length > 0) {
    const { x, y } = queue.shift()!;
    const key = `${x},${y}`;
 if (visited.has(key)) continue;
 visited.add(key);
 explored.push([x, y]);

 if (x === endX && y === endY) {
 return explored.slice(1);
    }

    const DIRECTIONS: { dx: number; dy: number; wall: (cell: MazeCell) => boolean }[] = [
      { dx: 0, dy: -1, wall: cell => cell.north }, { dx: 1, dy: 0, wall: cell => cell.east }, { dx: 0, dy: 1, wall: cell => cell.south }, { dx: -1, dy: 0, wall: cell => cell.west }
    ];
 for (const { dx, dy, wall } of DIRECTIONS) {
      const nx = x + dx, ny = y + dy;
 if (
 nx >= 0 && nx < WIDTH && ny >= 0 && ny < HEIGHT &&
 !wall(maze[y][x])
 ) {
 queue.push({ x: nx, y: ny, path: [] }); // path isn't strictly needed for exploration
      }
    }
  }

 return explored.slice(1);
}

/**
 * Heuristic function for A* algorithm: Manhattan distance to the exit.
 * @param x Current column index.
 * @param y Current row index.
 * @param endX Exit column index.
 * @param endY Exit row index.
 * @returns Manhattan distance to the exit.
 */
function heuristic(x: number, y: number, endX: number, endY: number): number {
  return Math.abs(x - endX) + Math.abs(y - endY);
}

/**
 * Implements the A* search algorithm to find a path through the maze.
 * @param startX Starting column index.
 * @param startY Starting row index.
 * @param endX   Exit column index.
 * @param endY   Exit row index.
 * @param maze   2D array of MazeCell describing walls.
 * @returns       Array of [x,y] coordinates *after* the start, or [] if no path exists.
 */
function astar(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  maze: MazeCell[][]
): [number, number][] {
  const MAZE_WIDTH = maze[0].length;
  const MAZE_HEIGHT = maze.length;

  const openSet: SearchNode[] = [{ x: startX, y: startY, path: [[startX, startY]] }];
  const closedSet = new Set<string>();

  // Function to evaluate f = g + h (cost)
  const fScore = (node: SearchNode) => node.path.length + heuristic(node.x, node.y, endX, endY);

  while (openSet.length > 0) {
    // Get the node with the lowest fScore
    openSet.sort((a, b) => fScore(a) - fScore(b));
    const current = openSet.shift()!;

    const { x, y, path } = current;
    const key = `${x},${y}`;

    if (closedSet.has(key)) continue;
    closedSet.add(key);

    if (x === endX && y === endY) {
      return path.slice(1); // Exclude the starting cell
    }

    // Explore neighbors in the order: Up, Right, Down, Left
    const directions: { dx: number; dy: number; wall: (cell: MazeCell) => boolean }[] = [
      { dx: 0, dy: -1, wall: cell => cell.north }, // Up
      { dx: 1, dy: 0, wall: cell => cell.east },  // Right
      { dx: 0, dy: 1, wall: cell => cell.south }, // Down
      { dx: -1, dy: 0, wall: cell => cell.west }   // Left
    ];

    for (const { dx, dy, wall } of directions) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx >= 0 && nx < MAZE_WIDTH && ny >= 0 && ny < MAZE_HEIGHT && !wall(maze[y][x])) {
        const neighbor: SearchNode = { x: nx, y: ny, path: [...path, [nx, ny]] };
        const neighborKey = `${nx},${ny}`;
        if (closedSet.has(neighborKey)) continue;


        const existingNeighborIndex = openSet.findIndex(node => node.x === nx && node.y === ny);
        if (existingNeighborIndex !== -1) {
          const existingNeighbor = openSet[existingNeighborIndex];
          if (fScore(neighbor) < fScore(existingNeighbor)) {
            openSet.splice(existingNeighborIndex, 1, neighbor);
          }
        } else {
          openSet.push(neighbor);
        }
      }
    }
  }

  return []; // No path found
}

/**
 * Implements the A* Search exploration order for the maze.
 * @param startX Starting column index.
 * @param startY Starting row index.
 * @param endX   Exit column index.
 * @param endY   Exit row index.
 * @param maze   2D array of MazeCell describing walls.
 * @returns       Array of [x,y] coordinates in the order they were explored, excluding the start.
 */
function astarExplore(
 startX: number,
 startY: number,
 endX: number,
 endY: number,
 maze: MazeCell[][]
): [number, number][] {
  const WIDTH = maze[0].length;
  const HEIGHT = maze.length;
  const openSet: SearchNode[] = [{ x: startX, y: startY, path: [[startX, startY]] }];
  const closed = new Set<string>();
  const explored: [number, number][] = [];

  const f = (node: SearchNode) => node.path.length + heuristic(node.x, node.y, endX, endY);

  while (openSet.length > 0) {
 openSet.sort((a, b) => f(a) - f(b));
    const { x, y } = openSet.shift()!; // path is not strictly needed for exploration part here
    const key = `${x},${y}`;
 if (closed.has(key)) continue;
 closed.add(key);
 explored.push([x, y]);

 if (x === endX && y === endY) {
 return explored.slice(1);
    }

    const DIRECTIONS: { dx: number; dy: number; wall: (cell: MazeCell) => boolean }[] = [
      { dx: 0, dy: -1, wall: cell => cell.north }, { dx: 1, dy: 0, wall: cell => cell.east }, { dx: 0, dy: 1, wall: cell => cell.south }, { dx: -1, dy: 0, wall: cell => cell.west }
    ];
 for (const { dx, dy, wall } of DIRECTIONS) {
      const nx = x + dx, ny = y + dy;
      const neighborKey = `${nx},${ny}`;
 if ( nx >= 0 && nx < WIDTH && ny >= 0 && ny < HEIGHT && !wall(maze[y][x]) && !closed.has(neighborKey)) {
 openSet.push({ x: nx, y: ny, path: [] }); // path isn't strictly needed for exploration
      }
    }
  }
  return explored.slice(1);
}
// Example usage (can be removed or commented out for production)
/*
import { findPath } from './pathfinder';
// ...
const path = findPath(sx, sy, ex, ey, 'BFS', maze);
setAIPath(path);
*/
