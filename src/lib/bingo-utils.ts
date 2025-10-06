// Utility functions for Bingo game logic

/**
 * Generates a random 5x5 bingo board following standard rules:
 * B: 1-15, I: 16-30, N: 31-45, G: 46-60, O: 61-75
 * Center cell is always FREE (marked as 0)
 */
export function generateBingoBoard(): number[][] {
  const board: number[][] = []
  
  // Column ranges for B-I-N-G-O
  const columnRanges = [
    [1, 15],   // B column
    [16, 30],  // I column  
    [31, 45],  // N column
    [46, 60],  // G column
    [61, 75]   // O column
  ]
  
  for (let col = 0; col < 5; col++) {
    const column: number[] = []
    const [min, max] = columnRanges[col]
    const availableNumbers = Array.from({ length: max - min + 1 }, (_, i) => min + i)
    
    // Select 5 random numbers from the column range
    for (let row = 0; row < 5; row++) {
      const randomIndex = Math.floor(Math.random() * availableNumbers.length)
      const selectedNumber = availableNumbers.splice(randomIndex, 1)[0]
      column.push(selectedNumber)
    }
    
    board.push(column)
  }
  
  // Make center cell FREE
  board[2][2] = 0
  
  return board
}

/**
 * Generates a unique 6-character room code
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Checks if a bingo board has a winning pattern
 * @param board 5x5 board with marked cells (true = marked, false = unmarked)
 * @returns Object with winning status and pattern type
 */
export function checkBingoWin(board: boolean[][]): { 
  hasWon: boolean; 
  pattern?: 'row' | 'column' | 'diagonal';
  line?: number;
} {
  // Check rows
  for (let row = 0; row < 5; row++) {
    if (board[row].every(cell => cell)) {
      return { hasWon: true, pattern: 'row', line: row }
    }
  }
  
  // Check columns
  for (let col = 0; col < 5; col++) {
    if (board.every(row => row[col])) {
      return { hasWon: true, pattern: 'column', line: col }
    }
  }
  
  // Check diagonal (top-left to bottom-right)
  if (board.every((row, i) => row[i])) {
    return { hasWon: true, pattern: 'diagonal', line: 0 }
  }
  
  // Check diagonal (top-right to bottom-left)
  if (board.every((row, i) => row[4 - i])) {
    return { hasWon: true, pattern: 'diagonal', line: 1 }
  }
  
  return { hasWon: false }
}

/**
 * Validates if a number is valid for bingo (1-75)
 */
export function isValidBingoNumber(num: number): boolean {
  return Number.isInteger(num) && num >= 1 && num <= 75
}

/**
 * Gets the letter prefix for a bingo number
 */
export function getBingoLetter(num: number): string {
  if (num >= 1 && num <= 15) return 'B'
  if (num >= 16 && num <= 30) return 'I'
  if (num >= 31 && num <= 45) return 'N'
  if (num >= 46 && num <= 60) return 'G'
  if (num >= 61 && num <= 75) return 'O'
  return ''
}

/**
 * Formats a bingo number with its letter prefix
 */
export function formatBingoNumber(num: number): string {
  return `${getBingoLetter(num)}-${num}`
}

/**
 * Creates marked board state from board numbers and drawn numbers
 */
export function createMarkedBoard(boardNumbers: number[][], drawnNumbers: number[]): boolean[][] {
  return boardNumbers.map(row => 
    row.map(num => num === 0 || drawnNumbers.includes(num)) // 0 is FREE space
  )
}

/**
 * Gets a random number from the remaining available numbers
 */
export function getNextBingoNumber(drawnNumbers: number[]): number | null {
  const allNumbers = Array.from({ length: 75 }, (_, i) => i + 1)
  const availableNumbers = allNumbers.filter(num => !drawnNumbers.includes(num))
  
  if (availableNumbers.length === 0) return null
  
  const randomIndex = Math.floor(Math.random() * availableNumbers.length)
  return availableNumbers[randomIndex]
}