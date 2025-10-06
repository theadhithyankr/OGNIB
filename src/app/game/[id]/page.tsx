'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, Game, Player, Move } from '@/lib/supabase'
import { GameLobby } from '@/components/GameLobby'
import { GameBoard } from '@/components/GameBoard'
import { GameResults } from '@/components/GameResults'

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [moves, setMoves] = useState<Move[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const gameId = params.id as string

  useEffect(() => {
    if (!user || !gameId) return

    const loadGameData = async () => {
      try {
        // Load game
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .select('*')
          .eq('id', gameId)
          .single()

        if (gameError || !gameData) {
          throw new Error('Game not found')
        }

        // Load players
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('*')
          .eq('game_id', gameId)

        if (playersError) throw playersError

        // Load moves
        const { data: movesData, error: movesError } = await supabase
          .from('moves')
          .select('*')
          .eq('game_id', gameId)
          .order('drawn_at', { ascending: true })

        if (movesError) throw movesError

        setGame(gameData)
        setPlayers(playersData || [])
        setMoves(movesData || [])

        // Check if user is in the game
        const userInGame = playersData?.some(p => p.id === user?.id)
        if (!userInGame) {
          setError('You are not part of this game')
          return
        }

      } catch (err) {
        console.error('Error loading game:', err)
        setError('Failed to load game')
      } finally {
        setLoading(false)
      }
    }

    const handleGameUpdate = (payload: { new?: Game }) => {
      if (payload.new) {
        setGame(payload.new)
      }
    }

    const handlePlayersUpdate = () => {
      loadGameData() // Reload all data to ensure consistency
    }

    const handleMovesUpdate = (payload: { new?: Move }) => {
      if (payload.new) {
        setMoves(prev => [...prev, payload.new!])
      }
    }

    // Load initial game data
    loadGameData()

    // Load initial game data
    loadGameData()

    // Poll for updates every 2 seconds as a fallback
    const pollInterval = setInterval(() => {
      loadGameData()
    }, 2000)

    return () => {
      clearInterval(pollInterval)
    }
  }, [user, gameId])

  const loadGameData = async () => {
    try {
      // Load game
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single()

      if (gameError || !gameData) {
        throw new Error('Game not found')
      }

      // Load players
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', gameId)

      if (playersError) throw playersError

      // Load moves
      const { data: movesData, error: movesError } = await supabase
        .from('moves')
        .select('*')
        .eq('game_id', gameId)
        .order('drawn_at', { ascending: true })

      if (movesError) throw movesError

      setGame(gameData)
      setPlayers(playersData || [])
      setMoves(movesData || [])

      // Check if user is in the game
      const userInGame = playersData?.some(p => p.id === user?.id)
      if (!userInGame) {
        setError('You are not part of this game')
        return
      }

    } catch (err) {
      console.error('Error loading game:', err)
      setError('Failed to load game')
    } finally {
      setLoading(false)
    }
  }

  const handleGameUpdate = (payload: { new?: Game }) => {
    if (payload.new) {
      setGame(payload.new)
    }
  }

  const handlePlayersUpdate = () => {
    loadGameData() // Reload all data to ensure consistency
  }

  const handleMovesUpdate = (payload: { new?: Move }) => {
    if (payload.new) {
      setMoves(prev => [...prev, payload.new!])
    }
  }

  if (!user) {
    router.push('/')
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading game...</p>
        </div>
      </div>
    )
  }

  if (error || !game) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Game not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  // Show appropriate component based on game status
  if (game.status === 'waiting') {
    return (
      <GameLobby
        game={game}
        players={players}
        currentUser={user}
      />
    )
  }

  if (game.status === 'started') {
    return (
      <GameBoard
        game={game}
        players={players}
        moves={moves}
        currentUser={user}
      />
    )
  }

  if (game.status === 'finished') {
    return (
      <GameResults
        game={game}
        players={players}
        currentUser={user}
      />
    )
  }

  return null
}