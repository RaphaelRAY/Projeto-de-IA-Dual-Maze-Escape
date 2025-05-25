
'use client';

import React, {useState, useEffect, useRef, useCallback} from 'react';
import {Button} from "@/components/ui/button";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {Label} from "@/components/ui/label";
import {Slider} from "@/components/ui/slider";
import {findPath, SearchMethod, getSearchMethods, SEARCH_METHODS} from '@/pathfinder'; // Import the pathfinder
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,

} from "@/components/ui/accordion"

const CELL_SIZE = 20; // Size of each cell in pixels
const MAZE_WIDTH = 25; // Number of cells wide
const MAZE_HEIGHT = 20; // Number of cells high
const PLAYER_SIZE = CELL_SIZE * 0.7; // Player size relative to cell size
const EXIT_SIZE = CELL_SIZE * 0.8; // Reduced exit size
const TRAIL_DOT_SIZE = CELL_SIZE * 0.15;


// Define the MazeCell type
type MazeCell = {
  north: boolean;
  east: boolean;
  south: boolean;
  west: boolean;
  visited: boolean; // Keep visited for generation, pathfinder uses its own visited set
};

// Define the Player type
type Player = {
  x: number;
  y: number;
  color: string;
  name: string;
  pathTaken: [number, number][];
};

// Define the Exit type
type Exit = {
  x: number;
  y: number;
};

// Define the Corner type
type Corner = {
  x: number;
  y: number;
};

type GameMode = 'playerVsPlayer' | 'playerVsAI' | null;

interface GameBoardProps {
  gameMode: GameMode;
  onReturnToMenu: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameMode, onReturnToMenu }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [maze, setMaze] = useState<MazeCell[][]>([]);
  const [player1, setPlayer1] = useState<Player>({x: 0, y: 0, color: 'teal', name: 'Player 1', pathTaken: []});
  const [player2, setPlayer2] = useState<Player>({x: 0, y: 0, color: '#4B0082', name: 'Player 2', pathTaken: []}); // Changed color to indigo
  const [exit, setExit] = useState<Exit>({x: 0, y: 0});
  const [gameWon, setGameWon] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [mazeGenerated, setMazeGenerated] = useState(false);
  const [aiPath, setAIPath] = useState<[number, number][]>([]);
  const [currentAiPathIndex, setCurrentAiPathIndex] = useState(0);
  const [aiSpeed, setAISpeed] = useState(500);
  const [searchMethod, setSearchMethod] = useState<SearchMethod>(SEARCH_METHODS[0]);
  const startCornerRef = useRef<Corner>({x: 1, y: 1});
  const aiIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>("00:00");
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const methods = getSearchMethods();


  const stopAI = useCallback(() => {
    if (aiIntervalRef.current) {
      clearInterval(aiIntervalRef.current);
      aiIntervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setStartTime(Date.now());
    setElapsedTime("00:00");
    timerIntervalRef.current = setInterval(() => {
      setStartTime(prevStartTime => {
        if (prevStartTime === null) return null;
        const now = Date.now();
        const diff = now - prevStartTime;
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setElapsedTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        return prevStartTime;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const calculateAIPath = useCallback((startX: number, startY: number, endX: number, endY: number, method: SearchMethod, currentMaze: MazeCell[][]) => {
      if (!currentMaze || currentMaze.length === 0 || !currentMaze[0] || gameMode !== 'playerVsAI') return;
      const path = findPath(startX, startY, endX, endY, method, currentMaze);
      setAIPath(path);
      setCurrentAiPathIndex(0);
  }, [gameMode]);


  const generateMaze = useCallback(() => {
    const initialMaze: MazeCell[][] = Array(MAZE_HEIGHT)
      .fill(null)
      .map(() =>
        Array(MAZE_WIDTH)
          .fill(null)
          .map(() => ({
            north: true,
            east: true,
            south: true,
            west: true,
            visited: false,
          }))
      );

    let currentMaze = initialMaze;

    function recursiveBacktracker(row: number, col: number) {
      currentMaze[row][col].visited = true;
      const directions = ['north', 'east', 'south', 'west'];
      for (let i = directions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [directions[i], directions[j]] = [directions[j], directions[i]];
      }

      for (const direction of directions) {
        let nextRow = row;
        let nextCol = col;
        switch (direction) {
          case 'north': nextRow = row - 1; break;
          case 'east': nextCol = col + 1; break;
          case 'south': nextRow = row + 1; break;
          case 'west': nextCol = col - 1; break;
        }
        if (nextRow >= 0 && nextRow < MAZE_HEIGHT && nextCol >= 0 && nextCol < MAZE_WIDTH && !currentMaze[nextRow][nextCol].visited) {
          switch (direction) {
            case 'north': currentMaze[row][col].north = false; currentMaze[nextRow][nextCol].south = false; break;
            case 'east': currentMaze[row][col].east = false; currentMaze[nextRow][nextCol].west = false; break;
            case 'south': currentMaze[row][col].south = false; currentMaze[nextRow][nextCol].north = false; break;
            case 'west': currentMaze[row][col].west = false; currentMaze[nextRow][nextCol].east = false; break;
          }
          recursiveBacktracker(nextRow, nextCol);
        }
      }
    }

    const corners: Corner[] = [
      {x: 1, y: 1}, {x: MAZE_WIDTH - 2, y: 1},
      {x: 1, y: MAZE_HEIGHT - 2}, {x: MAZE_WIDTH - 2, y: MAZE_HEIGHT - 2},
    ];
    const startCornerIndex = Math.floor(Math.random() * corners.length);
    const startCorner = corners[startCornerIndex];
    startCornerRef.current = startCorner;

    let endCorner: Corner;
    if (startCorner.x === 1 && startCorner.y === 1) endCorner = {x: MAZE_WIDTH - 2, y: MAZE_HEIGHT - 2};
    else if (startCorner.x === MAZE_WIDTH - 2 && startCorner.y === 1) endCorner = {x: 1, y: MAZE_HEIGHT - 2};
    else if (startCorner.x === 1 && startCorner.y === MAZE_HEIGHT - 2) endCorner = {x: MAZE_WIDTH - 2, y: 1};
    else endCorner = {x: 1, y: 1};

    recursiveBacktracker(startCorner.y, startCorner.x);

    const numWallsToRemove = Math.floor((MAZE_WIDTH * MAZE_HEIGHT) * 0.25);
    let wallsRemoved = 0;
    const attempts = numWallsToRemove * 10;
    let attemptCount = 0;

    while (wallsRemoved < numWallsToRemove && attemptCount < attempts) {
      attemptCount++;
      const r = Math.floor(Math.random() * (MAZE_HEIGHT - 2)) + 1;
      const c = Math.floor(Math.random() * (MAZE_WIDTH - 2)) + 1;

      const possibleWallsToRemove: ('north' | 'east' | 'south' | 'west')[] = [];
      if (r > 0 && currentMaze[r]?.[c]?.north && currentMaze[r - 1]?.[c]) possibleWallsToRemove.push('north');
      if (c < MAZE_WIDTH - 1 && currentMaze[r]?.[c]?.east && currentMaze[r]?.[c + 1]) possibleWallsToRemove.push('east');
      if (r < MAZE_HEIGHT - 1 && currentMaze[r]?.[c]?.south && currentMaze[r + 1]?.[c]) possibleWallsToRemove.push('south');
      if (c > 0 && currentMaze[r]?.[c]?.west && currentMaze[r]?.[c - 1]) possibleWallsToRemove.push('west');

      if (possibleWallsToRemove.length > 0) {
        const wallToRemove = possibleWallsToRemove[Math.floor(Math.random() * possibleWallsToRemove.length)];
        let removed = false;
        switch (wallToRemove) {
          case 'north':
            if (currentMaze[r][c].north && r > 0) {
              currentMaze[r][c].north = false; currentMaze[r-1][c].south = false; removed = true;
            }
            break;
          case 'east':
            if (currentMaze[r][c].east && c < MAZE_WIDTH -1) {
              currentMaze[r][c].east = false; currentMaze[r][c+1].west = false; removed = true;
            }
            break;
          case 'south':
            if (currentMaze[r][c].south && r < MAZE_HEIGHT -1) {
              currentMaze[r][c].south = false; currentMaze[r+1][c].north = false; removed = true;
            }
            break;
          case 'west':
            if (currentMaze[r][c].west && c > 0) {
              currentMaze[r][c].west = false; currentMaze[r][c-1].east = false; removed = true;
            }
            break;
        }
        if (removed) wallsRemoved++;
      }
    }

    setPlayer1({x: startCorner.x, y: startCorner.y, color: 'teal', name: 'Player 1', pathTaken: [[startCorner.x, startCorner.y]]});
    setPlayer2({x: startCorner.x, y: startCorner.y, color: '#4B0082', name: 'Player 2', pathTaken: [[startCorner.x, startCorner.y]]}); // Changed color to indigo
    setExit({x: endCorner.x, y: endCorner.y});

    setMaze(currentMaze);
    setMazeGenerated(true);
    setGameWon(false);
    setWinner(null);
    setAIPath([]);
    setCurrentAiPathIndex(0);

    startTimer();
    stopAI();
  }, [stopAI, startTimer]);


  useEffect(() => {
      generateMaze();
  }, [generateMaze]);


  const drawMaze = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!maze || maze.length === 0 || !maze[0] || !mazeGenerated) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, MAZE_WIDTH * CELL_SIZE, MAZE_HEIGHT * CELL_SIZE);
    ctx.strokeStyle = 'hsl(var(--maze-wall))';
    ctx.lineWidth = 2;

    for (let row = 0; row < MAZE_HEIGHT; row++) {
      for (let col = 0; col < MAZE_WIDTH; col++) {
        if (!maze[row]?.[col]) continue;
        const cell = maze[row][col];

        ctx.beginPath();
        if (cell.north) { ctx.moveTo(col * CELL_SIZE, row * CELL_SIZE); ctx.lineTo((col + 1) * CELL_SIZE, row * CELL_SIZE); }
        if (cell.east) { ctx.moveTo((col + 1) * CELL_SIZE, row * CELL_SIZE); ctx.lineTo((col + 1) * CELL_SIZE, (row + 1) * CELL_SIZE); }
        if (cell.south) { ctx.moveTo((col + 1) * CELL_SIZE, (row + 1) * CELL_SIZE); ctx.lineTo(col * CELL_SIZE, (row + 1) * CELL_SIZE); }
        if (cell.west) { ctx.moveTo(col * CELL_SIZE, (row + 1) * CELL_SIZE); ctx.lineTo(col * CELL_SIZE, row * CELL_SIZE); }
        ctx.stroke();
      }
    }
  }, [maze, mazeGenerated]);

  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D, player: Player) => {
    if (player.color === 'teal') {
        ctx.fillStyle = 'rgba(0, 128, 128, 0.3)'; // Teal trail
    } else if (player.color === '#4B0082') { // Indigo trail
        ctx.fillStyle = 'rgba(75, 0, 130, 0.3)';
    } else { // Fallback for other colors if any (should not happen with current setup)
        ctx.fillStyle = 'rgba(128, 128, 128, 0.3)'; // Default gray trail
    }

    player.pathTaken.forEach(([px, py]) => {
      ctx.beginPath();
      ctx.arc((px + 0.5) * CELL_SIZE, (py + 0.5) * CELL_SIZE, TRAIL_DOT_SIZE / 2, 0, 2 * Math.PI);
      ctx.fill();
    });

    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc((player.x + 0.5) * CELL_SIZE, (player.y + 0.5) * CELL_SIZE, PLAYER_SIZE / 2, 0, 2 * Math.PI);
    ctx.fill();
  }, []);

  const drawExit = useCallback((ctx: CanvasRenderingContext2D) => {
    if (exit && typeof exit.x === 'number' && typeof exit.y === 'number') {
        ctx.fillStyle = 'hsl(var(--primary))';
        ctx.fillRect(exit.x * CELL_SIZE + (CELL_SIZE - EXIT_SIZE) / 2, exit.y * CELL_SIZE + (CELL_SIZE - EXIT_SIZE) / 2, EXIT_SIZE, EXIT_SIZE);
    }
  }, [exit]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mazeGenerated || !maze || maze.length === 0 || !maze[0]) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMaze(ctx);
    if (player1) drawPlayer(ctx, player1);
    if (player2) drawPlayer(ctx, player2);
    drawExit(ctx);

  }, [maze, player1, player2, exit, mazeGenerated, drawMaze, drawPlayer, drawExit]);


  const movePlayer = useCallback((
    player: Player,
    setPlayer: React.Dispatch<React.SetStateAction<Player>>,
    dx: number,
    dy: number
  ) => {
    if (!maze || maze.length === 0 || gameWon || !mazeGenerated || !player) return;

    const newRow = player.y + dy;
    const newCol = player.x + dx;

    if (newRow >= 0 && newRow < MAZE_HEIGHT && newCol >= 0 && newCol < MAZE_WIDTH) {
      const cell = maze[player.y]?.[player.x];
      if (!cell) return;

      let canMove = true;
      if (dy === -1 && cell.north) canMove = false;
      if (dy === 1 && cell.south) canMove = false;
      if (dx === -1 && cell.west) canMove = false;
      if (dx === 1 && cell.east) canMove = false;

      if (canMove) {
        setPlayer(prevPlayer => ({
            ...prevPlayer,
            x: newCol,
            y: newRow,
            pathTaken: [...prevPlayer.pathTaken, [newCol, newRow]]
        }));
      }
    }
  }, [maze, gameWon, mazeGenerated]);


  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (gameWon || !mazeGenerated) return;

    if (player1) {
        if (event.key === 'w') movePlayer(player1, setPlayer1, 0, -1);
        if (event.key === 's') movePlayer(player1, setPlayer1, 0, 1);
        if (event.key === 'a') movePlayer(player1, setPlayer1, -1, 0);
        if (event.key === 'd') movePlayer(player1, setPlayer1, 1, 0);
    }


    if (gameMode === 'playerVsPlayer' && player2) {
      if (event.key === 'ArrowUp') movePlayer(player2, setPlayer2, 0, -1);
      if (event.key === 'ArrowDown') movePlayer(player2, setPlayer2, 0, 1);
      if (event.key === 'ArrowLeft') movePlayer(player2, setPlayer2, -1, 0);
      if (event.key === 'ArrowRight') movePlayer(player2, setPlayer2, 1, 0);
    }
  }, [player1, player2, movePlayer, gameWon, gameMode, mazeGenerated]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);


  const aiMove = useCallback(() => {
      if (!aiPath.length || currentAiPathIndex >= aiPath.length || gameWon || !mazeGenerated) {
          stopAI();
          return;
      }
      const [nextX, nextY] = aiPath[currentAiPathIndex];
      setPlayer2(prev => ({
          ...prev,
          x: nextX,
          y: nextY,
          pathTaken: [...prev.pathTaken, [nextX, nextY]]
        }));
      setCurrentAiPathIndex(prevIndex => prevIndex + 1);
  }, [aiPath, currentAiPathIndex, gameWon, stopAI, mazeGenerated]);


  useEffect(() => {
      stopAI();

      if (gameMode === 'playerVsAI' && mazeGenerated && !gameWon && aiPath.length > 0 && currentAiPathIndex < aiPath.length) {
          aiIntervalRef.current = setInterval(aiMove, aiSpeed);
      }
      return () => {
          stopAI();
      };
  }, [gameMode, mazeGenerated, gameWon, aiPath, aiSpeed, aiMove, stopAI, currentAiPathIndex]);


  const resetPlayerPosition = useCallback(() => {
    stopAI();
    stopTimer();

    const start = startCornerRef.current;
    setPlayer1(prev => ({ ...prev, x: start.x, y: start.y, pathTaken: [[start.x, start.y]] }));
    setPlayer2(prev => ({ ...prev, x: start.x, y: start.y, pathTaken: [[start.x, start.y]] }));

    setAIPath([]);
    setCurrentAiPathIndex(0);

    setGameWon(false);
    setWinner(null);
    startTimer();

    if (gameMode === 'playerVsAI' && mazeGenerated && maze && maze.length > 0 && maze[0] && exit && Object.keys(exit).length > 0) {
        if (typeof start.x === 'number' && typeof start.y === 'number') {
            calculateAIPath(start.x, start.y, exit.x, exit.y, searchMethod, maze);
        }
    }
  }, [gameMode, mazeGenerated, maze, stopAI, stopTimer, startTimer, exit, searchMethod, calculateAIPath]);


  const changeMap = useCallback(() => {
    stopAI();
    stopTimer();
    setMazeGenerated(false);
    generateMaze();
  }, [generateMaze, stopAI, stopTimer]);


  useEffect(() => {
    if (!gameWon && mazeGenerated && player1 && player2 && exit && Object.keys(exit).length > 0) {
      let winnerFound: string | null = null;
      if (player1.x === exit.x && player1.y === exit.y) {
        winnerFound = player1.name;
      } else if (player2.x === exit.x && player2.y === exit.y) {
        winnerFound = player2.name;
      }

      if (winnerFound) {
        setGameWon(true);
        setWinner(winnerFound);
        stopAI();
        stopTimer();
      }
    }
  }, [player1, player2, exit, gameWon, stopAI, stopTimer, mazeGenerated]);

  const sliderValue = React.useMemo(() => [aiSpeed], [aiSpeed]);
  const handleAISpeedChange = React.useCallback((newValue: number[]) => {
    setAISpeed(newValue[0]);
  }, []);


  return (
    <>
     {gameWon && winner && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground p-4 rounded-md shadow-lg z-10">
          <p className="text-xl font-bold">{winner} Wins! Time: {elapsedTime}</p>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={MAZE_WIDTH * CELL_SIZE}
        height={MAZE_HEIGHT * CELL_SIZE}
        className="border-2 border-primary rounded-md shadow-lg mt-10"
      />
       <div className="mt-2 text-lg font-semibold">
        Time: {elapsedTime}
      </div>
      <div className="mt-4 flex flex-col items-center space-y-2">
        <Accordion type="single" collapsible className="w-full max-w-md">
          <AccordionItem value="settings">
            <AccordionTrigger>Settings</AccordionTrigger>
            <AccordionContent className="flex flex-col items-center space-y-4">
              {gameMode === 'playerVsAI' && (
                <>
                  <div className="w-64">
                    <Label htmlFor="ai-speed">AI Speed (ms): {aiSpeed}</Label>
                    <Slider
                      id="ai-speed"
                      value={sliderValue}
                      max={1000}
                      min={50}
                      step={10}
                      onValueChange={handleAISpeedChange}
                      className="mt-2"
                    />
                     <p className="text-sm text-muted-foreground text-center">Slower ---- Faster</p>
                  </div>
                  <Label>AI Search Method</Label>
                  <RadioGroup
                    value={searchMethod}
                    className="flex space-x-4 justify-center flex-wrap"
                    onValueChange={(value) => {
                        const newMethod = value as SearchMethod;
                        setSearchMethod(newMethod);
                    }}
                    >
                    {methods.map((method) => (
                        <div key={method} className="flex items-center space-x-2">
                            <RadioGroupItem value={method} id={method} />
                            <Label htmlFor={method}>
                            {method === 'ASTAR' ? 'A*'
                                : method.includes('_EXPLORE') ? `${method.replace('_EXPLORE', '')} (Explore)`
                                : method}
                            </Label>
                        </div>
                    ))}
                    </RadioGroup>

                </>
              )}
               {gameMode !== 'playerVsAI' && (
                   <p className="text-muted-foreground">AI settings available in Player vs AI mode.</p>
               )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className="flex space-x-4 mt-4">
          <Button
            variant="secondary"
            onClick={resetPlayerPosition}
          >
            Reset Players
          </Button>
         <Button
            variant="secondary"
            onClick={changeMap}
          >
            Change Map
          </Button>
          <Button
            variant="secondary"
            onClick={onReturnToMenu}
          >
            Return to Menu
          </Button>
        </div>
         {!gameWon && (
            <p className="text-muted-foreground mt-2">
              Player 1: Use WASD keys. {gameMode === 'playerVsPlayer' ? 'Player 2: Use Arrow Keys.' : 'Player 2: AI Controlled.'}
            </p>
          )}
      </div>
    </>
  );
};

export default GameBoard;

