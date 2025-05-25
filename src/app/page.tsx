
"use client";

import React, { useState } from 'react';
import GameBoard from './game-board';
import { Button } from "@/components/ui/button";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {Label} from "@/components/ui/label";

type GameMode = 'playerVsPlayer' | 'playerVsAI';

export default function MazeGame() {
  const [gameMode, setGameMode] = useState<GameMode | undefined>(undefined);
  const [gameStarted, setGameStarted] = useState(false);

  const startGame = (mode: GameMode) => {
    setGameMode(mode);
    setGameStarted(true);
  };

  const returnToMenu = () => {
    setGameMode(undefined); // Fix: Use undefined instead of null
    setGameStarted(false)
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      {!gameStarted ? (
        <div className="flex flex-col items-center space-y-4">
          <h1 className="text-4xl font-bold mb-4">Dual Maze Escape</h1>
          <RadioGroup
            value={gameMode} // Controlled component
            onValueChange={(value) => setGameMode(value as GameMode)} // Update state on change
            className="flex space-x-4 justify-center" // Use flex and justify-center
            // Removed defaultValue
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="playerVsPlayer" id="playerVsPlayer"/>
              <Label htmlFor="playerVsPlayer">Player vs Player</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="playerVsAI" id="playerVsAI"/>
              <Label htmlFor="playerVsAI">Player vs AI</Label>
            </div>
          </RadioGroup>
          <Button onClick={() => { if (gameMode) setGameStarted(true); }} disabled={gameMode === undefined}>
            Start Game
          </Button>
        </div>
      ) : (
        // Render GameBoard only if gameStarted is true and gameMode is defined
        gameMode && <GameBoard gameMode={gameMode} onReturnToMenu={returnToMenu} />
      )}
    </div>
  );
}
