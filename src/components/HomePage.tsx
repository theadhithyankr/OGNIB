'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { generateRoomCode, generateBingoBoard } from '@/lib/bingo-utils'
import { useRouter } from 'next/navigation'

export function HomePage() {
  const [joinCode, setJoinCode] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState('')
  const { user, signOut } = useAuth()
  const router = useRouter()

  const nickname = user?.nickname || 'Player'

  const createGame = async () => {
    if (!user) return
    
    setIsCreating(true)
    setError('')
    
    try {
      const gameCode = generateRoomCode()
      const board = generateBingoBoard()
      
      // Create the game
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          code: gameCode,
          status: 'waiting',
          numbers_called: [],
          current_number: null,
          current_letter: null
        })
        .select()
        .single()
      
      if (gameError) throw gameError
      
      // Add the host as a player (upsert to handle duplicates)
      const { error: playerError } = await supabase
        .from('players')
        .upsert({
          id: user.id,
          name: nickname,
          game_id: game.id,
          board: board,
          is_host: true,
          has_won: false
        }, {
          onConflict: 'id'
        })
      
      if (playerError) throw playerError
      
      // Navigate to the game lobby
      router.push(`/game/${game.id}`)
      
    } catch (err) {
      console.error('Error creating game:', err)
      console.error('Full error object:', JSON.stringify(err, null, 2))
      setError(`Failed to create game: ${err instanceof Error ? err.message : JSON.stringify(err)}`)
    } finally {
      setIsCreating(false)
    }
  }

  const joinGame = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !joinCode.trim()) return
    
    setIsJoining(true)
    setError('')
    
    try {
      // Find the game by code
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('code', joinCode.toUpperCase())
        .eq('status', 'waiting')
        .single()
      
      if (gameError || !game) {
        throw new Error('Game not found or already started')
      }
      
      // Check if player is already in the game
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', game.id)
        .eq('id', user.id)
        .single()
      
      if (!existingPlayer) {
        // Generate board for new player
        const board = generateBingoBoard()
        
        // Add player to the game (upsert to handle duplicates)
        const { error: playerError } = await supabase
          .from('players')
          .upsert({
            id: user.id,
            name: nickname,
            game_id: game.id,
            board: board,
            is_host: false,
            has_won: false
          }, {
            onConflict: 'id'
          })
        
        if (playerError) throw playerError
      }
      
      // Navigate to the game lobby
      router.push(`/game/${game.id}`)
      
    } catch (err) {
      console.error('Error joining game:', err)
      setError('Failed to join game. Please check the code and try again.')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-indigo-600 mb-2">🎱 MULTIPLAYER BINGO</h1>
            <p className="text-gray-600">Play with friends in real-time!</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Hello, {nickname}!</span>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Create Game Card */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-green-600">🎮 Create Game</CardTitle>
              <CardDescription>
                Start a new Bingo game and invite friends to join
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={createGame}
                disabled={isCreating}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg"
              >
                {isCreating ? 'Creating...' : 'Create New Game'}
              </Button>
            </CardContent>
          </Card>

          {/* Join Game Card */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-blue-600">🔗 Join Game</CardTitle>
              <CardDescription>
                Enter a game code to join an existing game
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={joinGame} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter game code..."
                  value={joinCode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setJoinCode(e.target.value.toUpperCase())
                  }
                  maxLength={6}
                  className="text-center uppercase"
                  disabled={isJoining}
                />
                <Button 
                  type="submit"
                  disabled={isJoining || !joinCode.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
                >
                  {isJoining ? 'Joining...' : 'Join Game'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mt-6">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          </div>
        )}

        {/* How to Play */}
        <div className="max-w-2xl mx-auto mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-indigo-600">📝 How to Play</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-green-600 mb-2">🎮 Creating a Game:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Click &quot;Create New Game&quot;</li>
                    <li>• Share the game code with friends</li>
                    <li>• Wait for players to join</li>
                    <li>• Start the game when ready</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-600 mb-2">🔗 Joining a Game:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Get a game code from the host</li>
                    <li>• Enter the code and click &quot;Join&quot;</li>
                    <li>• Wait in the lobby for the game to start</li>
                    <li>• Enjoy playing Bingo!</li>
                  </ul>
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-semibold text-indigo-600 mb-2">🎯 Game Rules:</h4>
                <p className="text-gray-600 text-sm">
                  Get 5 numbers in a row (horizontal, vertical, or diagonal) to win! 
                  Numbers are called automatically and marked on your board in real-time. 
                  Click &quot;BINGO!&quot; when you have a winning pattern.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}