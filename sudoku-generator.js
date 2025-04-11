class SudokuGenerator {
    constructor() {
        this.SIZE = 9;
        this.EMPTY = 0;
        this.BOX_SIZE = 3;
    }

    // Generate Sudoku board
    generateSudoku(difficulty) {
        // Create an empty board
        const board = Array(this.SIZE).fill().map(() => Array(this.SIZE).fill(this.EMPTY));

        // Generate a complete Sudoku solution
        this.solveSudoku(board);

        // Remove cells according to difficulty
        this.removeNumbers(board, difficulty);

        return {
            puzzle: this.copyBoard(board),
            solution: this.getSolution(board)
        };
    }

    // Copy Sudoku board
    copyBoard(board) {
        return board.map(row => [...row]);
    }

    // Solve Sudoku using backtracking
    solveSudoku(board) {
        const emptyCell = this.findEmptyCell(board);

        if (!emptyCell) return true; // All cells filled

        const [row, col] = emptyCell;
        const nums = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);

        for (const num of nums) {
            if (this.isValid(board, row, col, num)) {
                board[row][col] = num;

                if (this.solveSudoku(board)) {
                    return true;
                }

                board[row][col] = this.EMPTY; // Reset if failed
            }
        }

        return false; // No solution
    }

    // Find an empty cell
    findEmptyCell(board) {
        for (let row = 0; row < this.SIZE; row++) {
            for (let col = 0; col < this.SIZE; col++) {
                if (board[row][col] === this.EMPTY) {
                    return [row, col];
                }
            }
        }
        return null; // No empty cell
    }

    // Check if number is valid
    isValid(board, row, col, num) {
        // Check row
        for (let i = 0; i < this.SIZE; i++) {
            if (board[row][i] === num) return false;
        }

        // Check column
        for (let i = 0; i < this.SIZE; i++) {
            if (board[i][col] === num) return false;
        }

        // Check 3x3 box
        const boxRow = Math.floor(row / this.BOX_SIZE) * this.BOX_SIZE;
        const boxCol = Math.floor(col / this.BOX_SIZE) * this.BOX_SIZE;

        for (let i = 0; i < this.BOX_SIZE; i++) {
            for (let j = 0; j < this.BOX_SIZE; j++) {
                if (board[boxRow + i][boxCol + j] === num) return false;
            }
        }

        return true;
    }

    // Shuffle array (Fisher-Yates algorithm)
    shuffleArray(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    // Count solutions (up to 2 solutions)
    countSolutions(board, limit = 2) {
        const emptyCell = this.findEmptyCell(board);
        if (!emptyCell) return 1;

        let solutions = 0;
        const [row, col] = emptyCell;

        for (let num = 1; num <= this.SIZE && solutions < limit; num++) {
            if (this.isValid(board, row, col, num)) {
                board[row][col] = num;
                solutions += this.countSolutions(board, limit);
                board[row][col] = this.EMPTY;
            }
        }

        return solutions;
    }

    removeNumbers(board, difficulty) {
        const targetRemoved = {
            easy: 40, medium: 45, hard: 50, expert: 64
        }[difficulty] || 45;

        let removed = 0;

        // Initialize coordinates of all removable cells
        let positions = this.shuffleArray(
            Array.from({ length: this.SIZE ** 2 }, (_, i) => [Math.floor(i / this.SIZE), i % this.SIZE])
        );

        while (positions.length > 0 && removed < targetRemoved) {
            const [row, col] = positions.pop();
            const temp = board[row][col];
            board[row][col] = this.EMPTY;

            // Restore if solution is not unique
            if (this.countSolutions(this.copyBoard(board)) !== 1) {
                board[row][col] = temp;
            } else {
                removed++;
                // Reshuffle remaining cells for maximum randomness
                positions = this.shuffleArray(positions);
            }
        }
    }

    // Get solution
    getSolution(board) {
        const solution = this.copyBoard(board);
        this.solveSudoku(solution);
        return solution;
    }
}
