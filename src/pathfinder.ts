/**
 * @fileOverview A generic maze-search module that supports DFS, BFS, and A* search algorithms.
 *
 * - findPath - A function that finds a path through the maze.
 * - SEARCH_METHODS - A constant array of available search method names.
 * - SearchMethod - Type that indicates the search method, derived from SEARCH_METHODS.
 * - getSearchMethods - Function to retrieve the list of available search methods.
 * - SearchNode - Interface for nodes used in DFS, BFS, and standard A* search algorithms.
 * - AStarExploreSearchNode - Interface for nodes used specifically in the astarExplore algorithm.
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

// Interface for nodes used specifically in the astarExplore algorithm
interface AStarExploreSearchNode {
  x: number;
  y: number;
  g: number;    // cost from start to here
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
  if (!maze || maze.length === 0 || !maze[0]) return [];
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
      const aStarResult = astarExplore(startX, startY, endX, endY, maze);
      return aStarResult.explored; // Return the sequence of explored cells
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
        if (!visited.has(`${nx},${ny}`)) { // Ensure not to push already processed or to be processed from stack
            stack.push({ x: nx, y: ny, path: [...path, [nx, ny]] });
        }
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
  visited.add(`${startX},${startY}`); // Add start to visited immediately
  const MAZE_WIDTH = maze[0].length;
  const MAZE_HEIGHT = maze.length;

  while (queue.length > 0) {
    const node = queue.shift()!;
    const { x, y, path } = node;
    
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
      const neighborKey = `${nx},${ny}`;

      if (nx >= 0 && nx < MAZE_WIDTH && ny >= 0 && ny < MAZE_HEIGHT && !wall(maze[y][x]) && !visited.has(neighborKey)) {
        visited.add(neighborKey);
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
  const stack: { x: number; y: number }[] = [{ x: startX, y: startY }]; // path not needed for pure exploration
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
        // For _EXPLORE methods, we return all explored cells up to the point the exit is found.
        // The slice(1) removes the start node from the returned list.
        return explored.slice(1); 
    }

    const DIRECTIONS: { dx: number; dy: number; wall: (cell: MazeCell) => boolean }[] = [
      { dx: 0, dy: -1, wall: cell => cell.north }, // Up
      { dx: 1, dy: 0, wall: cell => cell.east },  // Right
      { dx: 0, dy: 1, wall: cell => cell.south }, // Down
      { dx: -1, dy: 0, wall: cell => cell.west }  // Left
    ];

    // Push neighbors in reverse order for correct DFS exploration sequence (Up, Right, Down, Left)
    for (let i = DIRECTIONS.length - 1; i >= 0; i--) {
      const { dx, dy, wall } = DIRECTIONS[i];
      const nx = x + dx;
      const ny = y + dy;
      if (
        nx >= 0 && nx < WIDTH && ny >= 0 && ny < HEIGHT &&
        !wall(maze[y][x]) && !visited.has(`${nx},${ny}`)
      ) {
        stack.push({ x: nx, y: ny }); 
      }
    }
  }

  return explored.slice(1); // Return all explored if exit not found
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
  const queue: { x: number; y: number }[] = [{ x: startX, y: startY }]; // path not needed for pure exploration
  const visited = new Set<string>();
  visited.add(`${startX},${startY}`);
  const explored: [number, number][] = [];
  const WIDTH = maze[0].length;
  const HEIGHT = maze.length;

  while (queue.length > 0) {
    const { x, y } = queue.shift()!;
    explored.push([x, y]);

    if (x === endX && y === endY) {
      return explored.slice(1);
    }

    const DIRECTIONS: { dx: number; dy: number; wall: (cell: MazeCell) => boolean }[] = [
      { dx: 0, dy: -1, wall: cell => cell.north }, { dx: 1, dy: 0, wall: cell => cell.east }, { dx: 0, dy: 1, wall: cell => cell.south }, { dx: -1, dy: 0, wall: cell => cell.west }
    ];
    for (const { dx, dy, wall } of DIRECTIONS) {
      const nx = x + dx;
      const ny = y + dy;
      const neighborKey = `${nx},${ny}`;
      if (
        nx >= 0 && nx < WIDTH && ny >= 0 && ny < HEIGHT &&
        !wall(maze[y][x]) && !visited.has(neighborKey)
      ) {
        visited.add(neighborKey);
        queue.push({ x: nx, y: ny });
      }
    }
  }

 return explored.slice(1); // Return all explored if exit not found
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

  // Note: A* uses SearchNode {x, y, path} and calculates g from path.length
  const openSet: SearchNode[] = [{ x: startX, y: startY, path: [[startX, startY]] }];
  const closedSet = new Set<string>(); // Stores "x,y" for visited nodes in the closed set

  // gScore stores the cost from start to a node
  const gScore = new Map<string, number>();
  gScore.set(`${startX},${startY}`, 0);

  // fScore = gScore + heuristic
  const fScore = (node: SearchNode) => (gScore.get(`${node.x},${node.y}`) ?? Infinity) + heuristic(node.x, node.y, endX, endY);

  while (openSet.length > 0) {
    // Sort openSet by fScore to get the node with the lowest fScore
    openSet.sort((a, b) => fScore(a) - fScore(b));
    const current = openSet.shift()!; // Node with the lowest fScore

    const { x, y, path } = current;
    const key = `${x},${y}`;

    if (x === endX && y === endY) {
      return path.slice(1); // Exclude the starting cell
    }

    closedSet.add(key); // Move current to closed set

    // Explore neighbors
    const directions: { dx: number; dy: number; wall: (cell: MazeCell) => boolean }[] = [
      { dx: 0, dy: -1, wall: cell => cell.north }, // Up
      { dx: 1, dy: 0, wall: cell => cell.east },  // Right
      { dx: 0, dy: 1, wall: cell => cell.south }, // Down
      { dx: -1, dy: 0, wall: cell => cell.west }   // Left
    ];

    for (const { dx, dy, wall } of directions) {
      const nx = x + dx;
      const ny = y + dy;
      const neighborKey = `${nx},${ny}`;

      if (nx >= 0 && nx < MAZE_WIDTH && ny >= 0 && ny < MAZE_HEIGHT && !wall(maze[y][x])) {
        if (closedSet.has(neighborKey)) {
          continue; // Ignore neighbor if it's already evaluated
        }

        const tentativeGScore = (gScore.get(key) ?? Infinity) + 1; // Distance from start to current + 1

        let neighborInOpenSet = openSet.find(node => node.x === nx && node.y === ny);

        if (!neighborInOpenSet) { // Discover a new node
          gScore.set(neighborKey, tentativeGScore);
          const newPath = [...path, [nx, ny] as [number, number]];
          openSet.push({ x: nx, y: ny, path: newPath });
        } else if (tentativeGScore < (gScore.get(neighborKey) ?? Infinity)) {
          // This path to neighbor is better than any previous one. Record it!
          gScore.set(neighborKey, tentativeGScore);
          // Update path for the existing neighbor in openSet
                  
          const existingNodeIndex = openSet.findIndex(node => node.x === nx && node.y === ny);
          if (existingNodeIndex > -1) {
            openSet[existingNodeIndex].path = [...path, [nx,ny] as [number,number]];
          }
        }
      }
    }
  }
  return []; // No path found
}


/**
 * Implements the A* Search exploration order for the maze, returning both explored cells and the optimal path.
 * @param startX Starting column index.
 * @param startY Starting row index.
 * @param endX   Exit column index.
 * @param endY   Exit row index.
 * @param maze   2D array of MazeCell describing walls.
 * @returns       An object containing `explored` (Array of [x,y] coordinates in exploration order)
 *                and `path` (Array of [x,y] coordinates for the optimal path).
 *                Both arrays exclude the start node.
 */
function astarExplore(
  startX: number,
  startY: number,
  endX:   number,
  endY:   number,
  maze:   MazeCell[][]
): {
  explored: [number, number][];
  path:     [number, number][];
} {
  const W = maze[0].length;
  const H = maze.length;

  const openSet: AStarExploreSearchNode[] = [{ x: startX, y: startY, g: 0 }];
  const inClosed = new Set<string>(); // Tracks nodes for which neighbors have been fully processed.
  const explored: [number, number][] = []; // Tracks nodes in the order they are popped from openSet (visited for expansion).

  // gScore stores the cost of the cheapest path from start to n currently known.
  const gScore = new Map<string, number>();
  gScore.set(`${startX},${startY}`, 0);

  // cameFrom[n] is the node immediately preceding n on the cheapest path from start to n currently known.
  const cameFrom = new Map<string, string>();

  const f = (n: AStarExploreSearchNode) =>
    n.g + heuristic(n.x, n.y, endX, endY);

  const DIRS = [
    { dx:  0, dy: -1, wall: (c: MazeCell) => c.north },
    { dx:  1, dy:  0, wall: (c: MazeCell) => c.east  },
    { dx:  0, dy:  1, wall: (c: MazeCell) => c.south },
    { dx: -1, dy:  0, wall: (c: MazeCell) => c.west  },
  ];

  while (openSet.length > 0) {
    // 1) Choose the node in openSet having the lowest fScore[] value.
    openSet.sort((a, b) => f(a) - f(b));
    const current = openSet.shift()!;
    const key = `${current.x},${current.y}`;

    // If current is already processed (should not happen if properly managed with closed set/gScore checks for openSet)
    // However, a simple `inClosed.has(key)` check before adding to openSet or updating gScore is typical.
    // Here, we add to `inClosed` after popping, so this check handles re-expansion.
    if (inClosed.has(key)) {
        continue;
    }
    inClosed.add(key); // Mark as processed for expansion

    // 3) Record in exploration order
    if (current.x !== startX || current.y !== startY) { // Don't add start to explored list meant for AI pathing
        explored.push([current.x, current.y]);
    }


    // 4) If current is the goal, we are done with exploration for pathfinding.
    if (current.x === endX && current.y === endY) {
      // Path reconstruction happens after loop if goal is found
      break;
    }

    // 5) Expand neighbors
    for (const { dx, dy, wall } of DIRS) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const nkey = `${nx},${ny}`;

      // Check bounds and wall
      if (
        nx < 0 || nx >= W ||
        ny < 0 || ny >= H ||
        wall(maze[current.y][current.x]) ||
        inClosed.has(nkey) // Skip if already fully processed
      ) {
        continue;
      }

      const tentativeG = current.g + 1; // Assuming cost of moving to neighbor is 1

      // If this path to neighbor is better than any previous one
      if (tentativeG < (gScore.get(nkey) ?? Infinity)) {
        cameFrom.set(nkey, key);
        gScore.set(nkey, tentativeG);
        
        // Add to openSet if not already there, or update if a better path found
        // (sorting handles priority implicitly after push; for true priority queue, would update)
        const existingNodeInOpenSet = openSet.find(node => node.x === nx && node.y === ny);
        if (!existingNodeInOpenSet) {
            openSet.push({ x: nx, y: ny, g: tentativeG });
        } else {
            // If using a min-heap, this would be an update operation.
            // With a sorted array, it might get re-evaluated.
            // For simplicity with array `sort`, ensure gScore map is the source of truth for `f`
            existingNodeInOpenSet.g = tentativeG; // Update g for resorting
        }
      }
    }
  }

  // Reconstruct the optimal path from end to start
  const optimalPath: [number, number][] = [];
  let curKey = `${endX},${endY}`;
  // Check if the goal was reached (i.e., curKey is in cameFrom or is the start)
  if (gScore.has(curKey)) { // Ensures goal was reachable
    while (curKey && curKey !== `${startX},${startY}`) {
        const [cx, cy] = curKey.split(',').map(Number) as [number, number];
        optimalPath.push([cx, cy]);
        curKey = cameFrom.get(curKey)!; // Move to the predecessor
    }
  }
  optimalPath.reverse(); // Path is now from start (exclusive, if start isn't pushed) to end.

  // The initial `explored.push` was inside the loop after popping.
  // `explored.slice(1)` was used in the user's example.
  // If startX,startY was pushed to `explored` first, then `slice(1)` is correct.
  // My current logic for `explored` avoids adding startX,startY initially.

  // Let's ensure `explored` correctly excludes the start node if that's the convention.
  // The very first node popped is startX, startY. If it was added to `explored`, then `slice(1)` is needed.
  // My `explored.push` is conditional: `if (current.x !== startX || current.y !== startY)`
  // This means `explored` already excludes the start node. So, `explored.slice(1)` is not needed for `explored`.

  // For `optimalPath`, it's reconstructed from `endX,endY` back to (but not including) `startX,startY`.
  // So `optimalPath` is already `[first_step_after_start, ..., end_node]`.
  // The user's code had `path: path.slice(1)`. This is likely not needed if reconstruction is correct.
  // I will return `optimalPath` as is.

  return {
    explored: explored, // Already excludes start
    path: optimalPath,  // Already excludes start
  };
}

// Example usage (can be removed or commented out for production)
/*
import { findPath } from './pathfinder';
// ...
const path = findPath(sx, sy, ex, ey, 'BFS', maze); // Example call
// For ASTAR_EXPLORE, if you need both:
// const { explored, path: optimalAStarPath } = astarExplore(sx, sy, ex, ey, maze);
// setAIPath(explored); // if AI follows exploration
// or setAIPath(optimalAStarPath); // if AI should follow the optimal path after exploration visualization
*/

