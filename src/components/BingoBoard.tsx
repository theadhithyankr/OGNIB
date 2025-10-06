'use client'

import { useMemo } from 'react'
import { createMarkedBoard, checkBingoWin } from '@/lib/bingo-utils'

interface BingoBoardProps {
  board: number[][]
  drawnNumbers: number[]
  onBingo?: () => void
  disabled?: boolean
}

export function BingoBoard({ board, drawnNumbers, onBingo, disabled = false }: BingoBoardProps) {
  // Create marked board state
  const markedBoard = useMemo(() => {
    return createMarkedBoard(board, drawnNumbers)
  }, [board, drawnNumbers])

  // Check for winning patterns
  const winResult = useMemo(() => {
    return checkBingoWin(markedBoard)
  }, [markedBoard])

  const columnHeaders = ['B', 'I', 'N', 'G', 'O']

  return (
    <div className="max-w-md mx-auto">
      {/* Column Headers */}
      <div className="grid grid-cols-5 gap-1 mb-2">
        {columnHeaders.map((letter) => (
          <div
            key={letter}
            className="h-12 bg-indigo-600 text-white text-xl font-bold flex items-center justify-center rounded-lg"
          >
            {letter}
          </div>
        ))}
      </div>

      {/* Bingo Board */}
      <div className="grid grid-cols-5 gap-1 bg-white p-2 rounded-lg shadow-lg">
        {board.map((column, colIndex) =>
          column.map((number, rowIndex) => {
            const isMarked = markedBoard[colIndex][rowIndex]
            const isFree = number === 0
            const isWinningCell = winResult.hasWon && (
              (winResult.pattern === 'row' && winResult.line === rowIndex) ||
              (winResult.pattern === 'column' && winResult.line === colIndex) ||
              (winResult.pattern === 'diagonal' && (
                (winResult.line === 0 && rowIndex === colIndex) ||
                (winResult.line === 1 && rowIndex === 4 - colIndex)
              ))
            )

            return (
              <div
                key={`${colIndex}-${rowIndex}`}
                className={`
                  aspect-square flex items-center justify-center text-lg font-bold rounded-lg border-2 transition-all duration-200
                  ${isMarked 
                    ? isWinningCell
                      ? 'bg-yellow-400 border-yellow-500 text-yellow-900 animate-pulse'
                      : 'bg-green-500 border-green-600 text-white'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }
                  ${isFree ? 'bg-red-500 border-red-600 text-white' : ''}
                  ${disabled ? 'cursor-not-allowed opacity-50' : ''}
                `}
              >
                {isFree ? (
                  <span className="text-sm font-bold">FREE</span>
                ) : (
                  <span>{number}</span>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Bingo Button */}
      {winResult.hasWon && onBingo && (
        <div className="mt-4 text-center">
          <button
            onClick={onBingo}
            disabled={disabled}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-2xl font-bold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 animate-bounce disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none disabled:transform-none"
          >
            🎉 BINGO! 🎉
          </button>
          <p className="text-sm text-gray-600 mt-2">
            You have {winResult.pattern} #{winResult.line !== undefined ? winResult.line + 1 : ''}!
          </p>
        </div>
      )}
    </div>
  )
}