'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Game, Player, Move, supabase } from '@/lib/supabase'
import { BingoBoard } from '@/components/BingoBoard'
import { getNextBingoNumber, formatBingoNumber, checkBingoWin, createMarkedBoard } from '@/lib/bingo-utils'
import { Users, Volume2, Crown, Dice6 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface GameBoardProps {
  game: Game
  players: Player[]
  moves: Move[]
  currentUser: { id: string; nickname: string }
}

export function GameBoard({ game, players, moves, currentUser }: GameBoardProps) {
  const [isDrawing, setIsDrawing] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const router = useRouter()

  const isHost = game.host_id === currentUser.id
  const currentPlayer = players.find(p => p.id === currentUser.id)
  const drawnNumbers = moves.map(m => m.number)

  // Check if current player has won
  const playerWinStatus = useMemo(() => {
    if (!currentPlayer) return { hasWon: false }
    const markedBoard = createMarkedBoard(currentPlayer.board, drawnNumbers)
    return checkBingoWin(markedBoard)
  }, [currentPlayer, drawnNumbers])

  const drawNumber = async () => {
    if (!isHost || isDrawing) return

    setIsDrawing(true)
    try {
      const nextNumber = getNextBingoNumber(drawnNumbers)
      if (!nextNumber) {
        alert('All numbers have been drawn!')
        return
      }

      // Insert the new move
      const { error } = await supabase
        .from('moves')
        .insert({
          game_id: game.id,
          number: nextNumber
        })

      if (error) throw error

      // Update the game's current number
      await supabase
        .from('games')
        .update({ current_number: nextNumber })
        .eq('id', game.id)

    } catch (err) {
      console.error('Error drawing number:', err)
    } finally {
      setIsDrawing(false)
    }
  }

  const claimBingo = async () => {
    if (!currentPlayer || !playerWinStatus.hasWon || isClaiming) return

    setIsClaiming(true)
    try {
      // Create the claim
      const { error: claimError } = await supabase
        .from('claims')
        .insert({
          game_id: game.id,
          player_id: currentUser.id,
          pattern: playerWinStatus.pattern!,
          verified: true // For now, we auto-verify
        })

      if (claimError) throw claimError

      // Mark player as winner
      await supabase
        .from('players')
        .update({ has_won: true })
        .eq('id', currentUser.id)

      // End the game
      await supabase
        .from('games')
        .update({ status: 'finished' })
        .eq('id', game.id)

    } catch (err) {
      console.error('Error claiming bingo:', err)
    } finally {
      setIsClaiming(false)
    }
  }

  const leaveGame = () => {
    router.push('/')
  }

  if (!currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">You are not part of this game</p>
          <Button onClick={leaveGame}>Go Home</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <div className="text-center sm:text-left mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold text-indigo-600">🎱 BINGO GAME</h1>
            <p className="text-gray-600">Game Code: {game.code}</p>
          </div>
          <Button variant="outline" onClick={leaveGame}>
            Leave Game
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Game Board */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">
                  Your Bingo Board
                </CardTitle>
                <CardDescription className="text-center">
                  {drawnNumbers.length} numbers called • {75 - drawnNumbers.length} remaining
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BingoBoard
                  board={currentPlayer.board}
                  drawnNumbers={drawnNumbers}
                  onBingo={claimBingo}
                  disabled={isClaiming}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Number */}
            {game.current_number && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Latest Number</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-4xl font-bold py-6 px-4 rounded-lg mb-4">
                    {formatBingoNumber(game.current_number)}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <Volume2 className="h-4 w-4" />
                    <span className="text-sm">Number {drawnNumbers.length}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Host Controls */}
            {isHost && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-600" />
                    Host Controls
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={drawNumber}
                    disabled={isDrawing || drawnNumbers.length >= 75}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Dice6 className="h-4 w-4 mr-2" />
                    {isDrawing ? 'Drawing...' : 'Draw Number'}
                  </Button>
                  {drawnNumbers.length >= 75 && (
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      All numbers drawn!
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Players List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Players ({players.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-2 rounded ${
                        player.id === currentUser.id 
                          ? 'bg-indigo-50 border border-indigo-200' 
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          player.has_won ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <span className="text-sm font-medium">
                          {player.name}
                          {player.id === currentUser.id && ' (You)'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {player.is_host && (
                          <Crown className="h-3 w-3 text-yellow-600" />
                        )}
                        {player.has_won && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            WINNER
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Called Numbers */}
            <Card>
              <CardHeader>
                <CardTitle>Called Numbers</CardTitle>
                <CardDescription>
                  {drawnNumbers.length} of 75 numbers called
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-1 max-h-32 overflow-y-auto">
                  {drawnNumbers.slice().reverse().map((number, index) => (
                    <div
                      key={number}
                      className={`text-xs font-bold py-1 px-2 rounded text-center ${
                        index === 0 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {number}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}