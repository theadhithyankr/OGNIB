'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Game, Player, Move, supabase } from '@/lib/supabase'
import { BingoBoard } from '@/components/BingoBoard'
import { getNextBingoNumber, formatBingoNumber, checkBingoWin, createMarkedBoard } from '@/lib/bingo-utils'
import { Users, Volume2, Crown, Dice6, Trophy, Clock, Target } from 'lucide-react'
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

  // Find host from players (since game doesn't have host_id)
  const host = players.find(p => p.is_host)
  const isHost = host?.id === currentUser.id
  const currentPlayer = players.find(p => p.id === currentUser.id)
  const drawnNumbers = moves.map(m => m.number).sort((a, b) => a - b)
  const lastCalledNumber = moves.length > 0 ? moves[moves.length - 1].number : null

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
          <CardContent className="text-center p-8">
            <h2 className="text-2xl font-bold text-red-600 mb-4">⚠️ Access Denied</h2>
            <p className="text-gray-700 mb-6">You are not part of this game</p>
            <Button onClick={leaveGame} className="bg-red-600 hover:bg-red-700 text-white">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header - Responsive */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200">
          <div className="text-center sm:text-left mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              🎯 BINGO GAME
            </h1>
            <p className="text-gray-700 font-medium">Game Code: <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{game.code}</span></p>
          </div>
          <Button 
            variant="outline" 
            onClick={leaveGame}
            className="bg-white hover:bg-red-50 border-red-300 text-red-600 hover:text-red-700 font-medium"
          >
            Leave Game
          </Button>
        </div>

        {/* Main Game Layout - Mobile First */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Game Board - Takes full width on mobile, 3 columns on desktop */}
          <div className="xl:col-span-3 order-2 xl:order-1">
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0">
              <CardHeader className="text-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="text-lg sm:text-xl flex items-center justify-center gap-2">
                  <Target className="h-6 w-6" />
                  Your Bingo Board
                </CardTitle>
                <CardDescription className="text-indigo-100">
                  {drawnNumbers.length} numbers called • {75 - drawnNumbers.length} remaining
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <BingoBoard
                  board={currentPlayer.board}
                  drawnNumbers={drawnNumbers}
                  onBingo={claimBingo}
                  disabled={isClaiming}
                />
                
                {/* Bingo Status */}
                {playerWinStatus.hasWon && (
                  <div className="mt-4 text-center">
                    <Button 
                      onClick={claimBingo}
                      disabled={isClaiming}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3 px-8 text-lg animate-pulse"
                    >
                      <Trophy className="h-5 w-5 mr-2" />
                      {isClaiming ? 'Claiming...' : 'CLAIM BINGO! 🎉'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Shows on top on mobile, side on desktop */}
          <div className="xl:col-span-1 order-1 xl:order-2 space-y-4">
            
            {/* Current Number Display */}
            {lastCalledNumber && (
              <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-xl">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-sm sm:text-base text-white">Latest Called</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="bg-white/20 backdrop-blur-sm text-3xl sm:text-4xl font-bold py-4 px-2 rounded-lg mb-3">
                    {formatBingoNumber(lastCalledNumber)}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-indigo-100">
                    <Volume2 className="h-4 w-4" />
                    <span className="text-sm">Call #{drawnNumbers.length}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Host Controls */}
            {isHost && (
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-gray-800">
                    <Crown className="h-5 w-5 text-yellow-600" />
                    Host Controls
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={drawNumber}
                    disabled={isDrawing || drawnNumbers.length >= 75}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 shadow-lg"
                  >
                    <Dice6 className="h-4 w-4 mr-2" />
                    {isDrawing ? 'Drawing...' : 'Draw Next Number'}
                  </Button>
                  {drawnNumbers.length >= 75 && (
                    <p className="text-sm text-gray-600 mt-2 text-center font-medium">
                      All numbers drawn!
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {!isHost && (
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="text-center py-6">
                  <div className="flex items-center justify-center gap-2 text-gray-700 mb-3">
                    <Clock className="h-5 w-5 text-indigo-600" />
                    <span className="text-sm font-medium">Waiting for <span className="font-bold text-indigo-600">{host?.name || 'host'}</span> to call next number...</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <div className="animate-bounce w-2 h-2 bg-indigo-600 rounded-full"></div>
                    <div className="animate-bounce w-2 h-2 bg-indigo-600 rounded-full" style={{ animationDelay: '0.1s' }}></div>
                    <div className="animate-bounce w-2 h-2 bg-indigo-600 rounded-full" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Players List */}
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-gray-800">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Players ({players.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-3 rounded-lg transition-all border ${
                        player.id === currentUser.id 
                          ? 'bg-indigo-50 border-indigo-300 shadow-sm' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          player.has_won ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
                        }`} />
                        <span className="text-sm font-semibold text-gray-800">
                          {player.name}
                          {player.id === currentUser.id && (
                            <span className="text-indigo-600 font-bold"> (You)</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {player.is_host && (
                          <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-full">
                            <Crown className="h-4 w-4 text-yellow-600" />
                            <span className="text-xs font-bold text-yellow-800">HOST</span>
                          </div>
                        )}
                        {player.has_won && (
                          <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full font-bold shadow-sm">
                            WINNER!
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Called Numbers - Compact on mobile */}
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm sm:text-base text-gray-800">Recent Numbers</CardTitle>
                <CardDescription className="text-xs text-gray-600">
                  Last {Math.min(drawnNumbers.length, 10)} called
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-1">
                  {drawnNumbers.slice(-10).reverse().map((number, index) => (
                    <div
                      key={number}
                      className={`text-xs font-bold py-2 px-1 rounded text-center transition-all ${
                        index === 0 
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-110' 
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      {number}
                    </div>
                  ))}
                </div>
                {drawnNumbers.length > 10 && (
                  <p className="text-xs text-gray-600 mt-2 text-center font-medium">
                    +{drawnNumbers.length - 10} more numbers called
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}