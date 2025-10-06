'use client'

import { useAuth } from '@/contexts/AuthContext'
import { NicknameEntry } from '@/components/NicknameEntry'
import { HomePage } from '@/components/HomePage'

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <NicknameEntry />
  }

  return <HomePage />
}
