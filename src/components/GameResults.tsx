'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Game, Player, supabase } from '@/lib/supabase'
import { generateBingoBoard } from '@/lib/bingo-utils'
import { Trophy, RotateCcw, Home, Crown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface GameResultsProps {
  game: Game
  players: Player[]
  currentUser: { id: string; nickname: string }
}

export function GameResults({ game, players, currentUser }: GameResultsProps) {
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const router = useRouter()

  const winner = players.find(p => p.has_won)
  const isHost = game.host_id === currentUser.id
  const isWinner = winner?.id === currentUser.id

  const playAgain = async () => {
    if (!isHost) return

    setIsCreatingNew(true)
    try {
      // Reset all players' boards and win status
      const updatePromises = players.map(player => 
        supabase
          .from('players')
          .update({
            board: generateBingoBoard(),
            has_won: false
          })
          .eq('id', player.id)
      )

      await Promise.all(updatePromises)

      // Clear all moves
      await supabase
        .from('moves')
        .delete()
        .eq('game_id', game.id)

      // Clear all claims
      await supabase
        .from('claims')
        .delete()
        .eq('game_id', game.id)

      // Reset game status
      await supabase
        .from('games')
        .update({
          status: 'started',
          current_number: null
        })
        .eq('id', game.id)

    } catch (err) {
      console.error('Error creating new game:', err)
    } finally {
      setIsCreatingNew(false)
    }
  }

  const goHome = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-600 mb-2">🎱 GAME OVER</h1>
          <p className="text-gray-600">Game Code: {game.code}</p>
        </div>

        {/* Winner Announcement */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 rounded-full">
                <Trophy className="h-16 w-16 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl text-yellow-600">
              🎉 {winner ? `${winner.name} Wins!` : 'Game Complete'} 🎉
            </CardTitle>
            <CardDescription className="text-lg">
              {isWinner 
                ? 'Congratulations! You are the Bingo champion!' 
                : winner 
                  ? `${winner.name} got BINGO first!`
                  : 'Thanks for playing!'
              }
            </CardDescription>
          </CardHeader>
          {isWinner && (
            <CardContent className="text-center">
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-6 rounded-lg">
                <h3 className="text-2xl font-bold text-yellow-700 mb-2">🏆 VICTORY! 🏆</h3>
                <p className="text-yellow-600">
                  You achieved the winning pattern and claimed BINGO first!
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Final Standings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-center">
              <Trophy className="h-6 w-6" />
              Final Standings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {players
                .sort((a, b) => {
                  if (a.has_won && !b.has_won) return -1
                  if (!a.has_won && b.has_won) return 1
                  return a.name.localeCompare(b.name)
                })
                .map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      player.has_won 
                        ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300'
                        : player.id === currentUser.id
                          ? 'bg-indigo-50 border border-indigo-200'
                          : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`text-2xl font-bold ${
                        player.has_won ? 'text-yellow-600' : 'text-gray-400'
                      }`}>
                        {player.has_won ? '🏆' : `#${index + 1}`}
                      </div>
                      <div>
                        <div className="font-semibold">
                          {player.name}
                          {player.id === currentUser.id && ' (You)'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {player.has_won ? 'Winner!' : 'Participant'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {player.is_host && (
                        <div className="flex items-center gap-1 text-yellow-600">
                          <Crown className="h-4 w-4" />
                          <span className="text-sm">Host</span>
                        </div>
                      )}
                      {player.has_won && (
                        <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          BINGO!
                        </div>
                      )}
                    </div>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {isHost && (
            <Button
              onClick={playAgain}
              disabled={isCreatingNew}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              {isCreatingNew ? 'Starting New Game...' : 'Play Again'}
            </Button>
          )}
          
          <Button
            onClick={goHome}
            variant="outline"
            className="px-8 py-3 text-lg"
          >
            <Home className="h-5 w-5 mr-2" />
            Go Home
          </Button>
        </div>

        {!isHost && (
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Waiting for host to start a new game or you can go home to create your own!
            </p>
          </div>
        )}

        {/* Game Statistics */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-center">📊 Game Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-indigo-600">{players.length}</div>
                <div className="text-sm text-gray-600">Total Players</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {winner ? '1' : '0'}
                </div>
                <div className="text-sm text-gray-600">Winners</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{game.code}</div>
                <div className="text-sm text-gray-600">Game Code</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}