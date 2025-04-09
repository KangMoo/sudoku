class SudokuSolver {
    constructor() {
        this.SIZE = 9;
        this.EMPTY = 0;
        this.BOX_SIZE = 3;
    }

    // 스도쿠가 유효한지 확인
    isValidSudoku(board) {
        for (let row = 0; row < this.SIZE; row++) {
            for (let col = 0; col < this.SIZE; col++) {
                const num = board[row][col];
                if (num !== this.EMPTY) {
                    // 현재 숫자를 일시적으로 제거하고 유효성 검사
                    board[row][col] = this.EMPTY;
                    if (!this.isValidPlacement(board, row, col, num)) {
                        board[row][col] = num; // 원상 복구
                        return false;
                    }
                    board[row][col] = num; // 원상 복구
                }
            }
        }
        return true;
    }

    // 주어진 위치에 숫자를 놓을 수 있는지 확인
    isValidPlacement(board, row, col, num) {
        return this.isRowValid(board, row, num) &&
            this.isColumnValid(board, col, num) &&
            this.isBoxValid(board, row, col, num);
    }

    // 행이 유효한지 확인
    isRowValid(board, row, num) {
        for (let i = 0; i < this.SIZE; i++) {
            if (board[row][i] === num) return false;
        }
        return true;
    }

    // 열이 유효한지 확인
    isColumnValid(board, col, num) {
        for (let i = 0; i < this.SIZE; i++) {
            if (board[i][col] === num) return false;
        }
        return true;
    }

    // 3x3 박스가 유효한지 확인
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

    // 주어진 위치에 올 수 있는 가능한 숫자 목록 반환
    getPossibleNumbers(board, row, col) {
        if (board[row][col] !== this.EMPTY) {
            return []; // 이미 숫자가 있는 경우
        }

        const possibilities = [];
        for (let num = 1; num <= this.SIZE; num++) {
            if (this.isValidPlacement(board, row, col, num)) {
                possibilities.push(num);
            }
        }
        return possibilities;
    }

    // 특정 위치에 특정 숫자가 올 수 있는지 확인
    isCellValid(board, row, col, num) {
        return this.isValidPlacement(board, row, col, num);
    }

    // 주어진 위치와 같은 박스, 행, 열에 있는 셀 반환
    getRelatedCells(row, col) {
        const relatedCells = new Set();

        // 같은 행의 셀
        for (let i = 0; i < this.SIZE; i++) {
            if (i !== col) {
                relatedCells.add(`${row},${i}`);
            }
        }

        // 같은 열의 셀
        for (let i = 0; i < this.SIZE; i++) {
            if (i !== row) {
                relatedCells.add(`${i},${col}`);
            }
        }

        // 같은 3x3 박스의 셀
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
