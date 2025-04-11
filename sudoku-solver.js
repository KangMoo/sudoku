class SudokuSolver {
    constructor() {
        this.SIZE = 9;
        this.EMPTY = 0;
        this.BOX_SIZE = 3;
    }

    // Check if the Sudoku is valid
    isValidSudoku(board) {
        for (let row = 0; row < this.SIZE; row++) {
            for (let col = 0; col < this.SIZE; col++) {
                const num = board[row][col];
                if (num !== this.EMPTY) {
                    // Temporarily remove the current number and check validity
                    board[row][col] = this.EMPTY;
                    if (!this.isValidPlacement(board, row, col, num)) {
                        board[row][col] = num; // Restore
                        return false;
                    }
                    board[row][col] = num; // Restore
                }
            }
        }
        return true;
    }

    // Check if a number can be placed at the given position
    isValidPlacement(board, row, col, num) {
        return this.isRowValid(board, row, num) &&
            this.isColumnValid(board, col, num) &&
            this.isBoxValid(board, row, col, num);
    }

    // Check if the row is valid
    isRowValid(board, row, num) {
        for (let i = 0; i < this.SIZE; i++) {
            if (board[row][i] === num) return false;
        }
        return true;
    }

    // Check if the column is valid
    isColumnValid(board, col, num) {
        for (let i = 0; i < this.SIZE; i++) {
            if (board[i][col] === num) return false;
        }
        return true;
    }

    // Check if the 3x3 box is valid
    isBoxValid(board, row, col, num) {
        const startRow = Math.floor(row / this.BOX_SIZE) * this.BOX_SIZE;
        const startCol = Math.floor(col / this.BOX_SIZE) * this.BOX_SIZE;

        for (let i = 0; i < this.BOX_SIZE; i++) {
            for (let j = 0; j < this.BOX_SIZE; j++) {
                if (board[startRow + i][startCol + j] === num) return false;
            }
        }
        return true;
    }

    // Return a list of possible numbers for the given position
    getPossibleNumbers(board, row, col) {
        if (board[row][col] !== this.EMPTY) {
            return []; // If the cell already has a number
        }

        const possibilities = [];
        for (let num = 1; num <= this.SIZE; num++) {
            if (this.isValidPlacement(board, row, col, num)) {
                possibilities.push(num);
            }
        }
        return possibilities;
    }

    // Check if a specific number can be placed at a specific position
    isCellValid(board, row, col, num) {
        return this.isValidPlacement(board, row, col, num);
    }

    // Return cells in the same box, row, and column
    getRelatedCells(row, col) {
        const relatedCells = new Set();

        // Cells in the same row
        for (let i = 0; i < this.SIZE; i++) {
            if (i !== col) {
                relatedCells.add(`${row},${i}`);
            }
        }

        // Cells in the same column
        for (let i = 0; i < this.SIZE; i++) {
            if (i !== row) {
                relatedCells.add(`${i},${col}`);
            }
        }

        // Cells in the same 3x3 box
        const startRow = Math.floor(row / this.BOX_SIZE) * this.BOX_SIZE;
        const startCol = Math.floor(col / this.BOX_SIZE) * this.BOX_SIZE;

        for (let i = 0; i < this.BOX_SIZE; i++) {
            for (let j = 0; j < this.BOX_SIZE; j++) {
                const r = startRow + i;
                const c = startCol + j;
                if (r !== row || c !== col) {
                    relatedCells.add(`${r},${c}`);
                }
            }
        }

        return Array.from(relatedCells).map(cell => {
            const [r, c] = cell.split(',').map(Number);
            return { row: r, col: c };
        });
    }
}
