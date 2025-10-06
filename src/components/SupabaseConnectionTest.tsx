'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function SupabaseConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...')
  const [tableExists, setTableExists] = useState<boolean | null>(null)

  useEffect(() => {
    const testConnection = async () => {
      try {
        // First check if Supabase client is properly configured
        console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
        console.log('Supabase Key configured:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
        
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          setConnectionStatus('❌ Missing Supabase environment variables')
          setTableExists(false)
          return
        }

        // Test basic connection
        const { data, error } = await supabase
          .from('games')
          .select('count')
          .limit(1)

        if (error) {
          console.error('Supabase connection error:', error)
          setConnectionStatus(`❌ Connection Error: ${error.message}`)
          setTableExists(false)
        } else {
          setConnectionStatus('✅ Connected to Supabase successfully!')
          setTableExists(true)
          
          // Clean up any previous test data first
          await supabase.from('games').delete().like('code', 'TEST%')
          
          // Test if we can create a test game
          const testGameId = crypto.randomUUID()
          const randomCode = 'TEST' + Math.random().toString(36).substring(2, 4).toUpperCase()
          
          const testGame = {
            id: testGameId,
            code: randomCode,
            status: 'waiting' as const,
            numbers_called: [],
            current_number: null,
            current_letter: null
          }
          
          const { data: insertData, error: insertError } = await supabase
            .from('games')
            .insert(testGame)
            .select()

          if (insertError) {
            console.error('Insert test error:', insertError)
            console.error('Full error object:', JSON.stringify(insertError, null, 2))
            setConnectionStatus(`✅ Connected, but insert failed: ${insertError.message || JSON.stringify(insertError)}`)
          } else {
            // Test player insert
            const testPlayer = {
              id: "test-user-123",
              name: "Test Player",
              game_id: testGameId,
              board: [[1,2,3,4,5],[6,7,8,9,10],[11,12,0,14,15],[16,17,18,19,20],[21,22,23,24,25]],
              is_host: true
            }
            
            const { error: playerError } = await supabase
              .from('players')
              .insert(testPlayer)

            if (playerError) {
              console.error('Player insert error:', playerError)
              console.error('Full player error object:', JSON.stringify(playerError, null, 2))
              setConnectionStatus(`✅ Game insert OK, but player insert failed: ${playerError.message || JSON.stringify(playerError)}`)
            } else {
              setConnectionStatus('✅ Fully functional! Can read and write to database.')
              
              // Clean up test data
              await supabase.from('players').delete().eq('id', 'test-user-123')
            }
            
            // Clean up test game data
            if (insertData && insertData[0]) {
              await supabase
                .from('games')
                .delete()
                .eq('id', insertData[0].id)
            }
          }
        }
      } catch (err) {
        console.error('Connection test failed:', err)
        console.error('Full error:', JSON.stringify(err, null, 2))
        setConnectionStatus(`❌ Failed: ${err instanceof Error ? err.message : JSON.stringify(err)}`)
        setTableExists(false)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border">
      <h3 className="text-lg font-semibold mb-4">🔗 Supabase Connection Test</h3>
      
      <div className="space-y-3">
        <div>
          <strong>Status:</strong> {connectionStatus}
        </div>
        
        <div>
          <strong>Database URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured'}
        </div>
        
        <div>
          <strong>API Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing'}
        </div>
        
        <div>
          <strong>Tables:</strong> {tableExists === null ? 'Testing...' : tableExists ? '✅ Accessible' : '❌ Not accessible'}
        </div>
        
        {tableExists === false && (
          <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Setup Required:</strong> Run the database schema from <code>database.sql</code> in your Supabase SQL editor to create the required tables.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}