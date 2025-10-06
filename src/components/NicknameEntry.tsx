'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'

export function NicknameEntry() {
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nickname.trim()) {
      setError('Please enter a nickname')
      return
    }

    if (nickname.length < 2 || nickname.length > 20) {
      setError('Nickname must be between 2 and 20 characters')
      return
    }

    setLoading(true)
    setError('')

    try {
      await signIn(nickname.trim())
    } catch (error) {
      console.error('Sign in error:', error)
      setError('Failed to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-indigo-600">🎱 BINGO</CardTitle>
          <CardDescription>
            Enter your nickname to start playing multiplayer Bingo!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Enter your nickname..."
                value={nickname}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNickname(e.target.value)}
                maxLength={20}
                className="text-center"
                disabled={loading}
              />
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </div>
            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Start Playing'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}