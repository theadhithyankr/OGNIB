'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Game, Player, supabase } from '@/lib/supabase'
import { Copy, Users, Crown, Play } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface GameLobbyProps {
  game: Game
  players: Player[]
  currentUser: { id: string; nickname: string }
}

export function GameLobby({ game, players, currentUser }: GameLobbyProps) {
  const [isStarting, setIsStarting] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const router = useRouter()

  const isHost = game.host_id === currentUser.id
  const canStart = players.length >= 2 // Minimum 2 players to start

  const copyGameCode = async () => {
    try {
      await navigator.clipboard.writeText(game.code)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const startGame = async () => {
    if (!isHost || !canStart) return

    setIsStarting(true)
    try {
      const { error } = await supabase
        .from('games')
        .update({ status: 'started' })
        .eq('id', game.id)

      if (error) throw error
    } catch (err) {
      console.error('Error starting game:', err)
    } finally {
      setIsStarting(false)
    }
  }

  const leaveGame = async () => {
    try {
      if (isHost) {
        // If host leaves, delete the game
        await supabase.from('games').delete().eq('id', game.id)
      } else {
        // If player leaves, just remove them from players
        await supabase.from('players').delete().eq('id', currentUser.id).eq('game_id', game.id)
      }
      router.push('/')
    } catch (err) {
      console.error('Error leaving game:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-600 mb-2">🎱 BINGO LOBBY</h1>
          <p className="text-gray-600">Waiting for players to join...</p>
        </div>

        {/* Game Info Card */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  Players ({players.length})
                </CardTitle>
                <CardDescription>
                  {canStart 
                    ? 'Ready to start!' 
                    : `Need at least ${2 - players.length} more player${2 - players.length === 1 ? '' : 's'} to start`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {players.map((player) => (
                    <div 
                      key={player.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        player.id === currentUser.id 
                          ? 'bg-indigo-50 border-indigo-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          player.id === currentUser.id ? 'bg-green-500' : 'bg-blue-500'
                        }`} />
                        <span className="font-medium">
                          {player.name}
                          {player.id === currentUser.id && ' (You)'}
                        </span>
                      </div>
                      {player.is_host && (
                        <div className="flex items-center gap-1 text-yellow-600">
                          <Crown className="h-4 w-4" />
                          <span className="text-sm font-medium">Host</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Game Code Card */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Game Code</CardTitle>
                <CardDescription className="text-center">
                  Share this code with friends
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="bg-gray-100 p-4 rounded-lg mb-4">
                  <div className="text-3xl font-bold text-indigo-600 tracking-wider">
                    {game.code}
                  </div>
                </div>
                <Button
                  onClick={copyGameCode}
                  variant="outline"
                  className="w-full"
                  disabled={copySuccess}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copySuccess ? 'Copied!' : 'Copy Code'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {isHost ? (
            <Button
              onClick={startGame}
              disabled={!canStart || isStarting}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
            >
              <Play className="h-5 w-5 mr-2" />
              {isStarting ? 'Starting...' : 'Start Game'}
            </Button>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-2">Waiting for host to start the game...</p>
              <div className="flex items-center justify-center gap-2">
                <div className="animate-bounce w-2 h-2 bg-indigo-600 rounded-full"></div>
                <div className="animate-bounce w-2 h-2 bg-indigo-600 rounded-full" style={{ animationDelay: '0.1s' }}></div>
                <div className="animate-bounce w-2 h-2 bg-indigo-600 rounded-full" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}

          <Button
            onClick={leaveGame}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            {isHost ? 'Cancel Game' : 'Leave Game'}
          </Button>
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-center">🎯 How to Play</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-semibold text-indigo-600 mb-3">Game Rules:</h4>
                <ul className="space-y-2 text-gray-600">
                  <li>• Each player gets a unique 5×5 Bingo board</li>
                  <li>• Numbers are called automatically by the host</li>
                  <li>• Mark called numbers on your board</li>
                  <li>• Get 5 in a row (any direction) to win!</li>
                  <li>• Center square is FREE for everyone</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-indigo-600 mb-3">During the Game:</h4>
                <ul className="space-y-2 text-gray-600">
                  <li>• Listen for called numbers (B-1 to O-75)</li>
                  <li>• Your board updates automatically</li>
                  <li>• Click &quot;BINGO!&quot; when you have 5 in a row</li>
                  <li>• The system will verify your win</li>
                  <li>• Winner is announced to all players</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}