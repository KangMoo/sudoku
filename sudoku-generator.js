class SudokuGenerator {
  constructor() {
    this.SIZE = 9;
    this.EMPTY = 0;
    this.BOX_SIZE = 3;
  }

  // 스도쿠 보드 생성
  generateSudoku(difficulty) {
    // 빈 보드 생성
    const board = Array(this.SIZE).fill().map(() => Array(this.SIZE).fill(this.EMPTY));

    // 완성된 스도쿠 해결책 생성
    this.solveSudoku(board);

    // 난이도에 따라 셀 제거
    this.removeNumbers(board, difficulty);

    return {
      puzzle: this.copyBoard(board),
      solution: this.getSolution(board)
    };
  }

  // 스도쿠 보드 복사
  copyBoard(board) {
    return board.map(row => [...row]);
  }

  // 백트래킹을 사용한 스도쿠 풀이
  solveSudoku(board) {
    const emptyCell = this.findEmptyCell(board);

    if (!emptyCell) return true; // 다 채워진 경우

    const [row, col] = emptyCell;
    const nums = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    for (const num of nums) {
      if (this.isValid(board, row, col, num)) {
        board[row][col] = num;

        if (this.solveSudoku(board)) {
          return true;
        }

        board[row][col] = this.EMPTY; // 실패 시 다시 비우기
      }
    }

    return false; // 해결책 없음
  }

  // 빈 셀 찾기
  findEmptyCell(board) {
    for (let row = 0; row < this.SIZE; row++) {
      for (let col = 0; col < this.SIZE; col++) {
        if (board[row][col] === this.EMPTY) {
          return [row, col];
        }
      }
    }
    return null; // 빈 셀 없음
  }

  // 숫자 유효성 확인
  isValid(board, row, col, num) {
    // 행 확인
    for (let i = 0; i < this.SIZE; i++) {
      if (board[row][i] === num) return false;
    }

    // 열 확인
    for (let i = 0; i < this.SIZE; i++) {
      if (board[i][col] === num) return false;
    }

    // 3x3 박스 확인
    const boxRow = Math.floor(row / this.BOX_SIZE) * this.BOX_SIZE;
    const boxCol = Math.floor(col / this.BOX_SIZE) * this.BOX_SIZE;

    for (let i = 0; i < this.BOX_SIZE; i++) {
      for (let j = 0; j < this.BOX_SIZE; j++) {
        if (board[boxRow + i][boxCol + j] === num) return false;
      }
    }

    return true;
  }

  // 배열 섞기 (Fisher-Yates 알고리즘)
  shuffleArray(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  // 해결책이 몇 개인지 확인하는 함수 (최대 2개까지만 세어본다)
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

    // 제거 가능한 모든 셀의 좌표를 초기화
    let positions = this.shuffleArray(
      Array.from({ length: this.SIZE ** 2 }, (_, i) => [Math.floor(i / this.SIZE), i % this.SIZE])
    );

    while (positions.length > 0 && removed < targetRemoved) {
      const [row, col] = positions.pop();
      const temp = board[row][col];
      board[row][col] = this.EMPTY;

      // 답이 하나가 아니면 복원
      if (this.countSolutions(this.copyBoard(board)) !== 1) {
        board[row][col] = temp;
      } else {
        removed++;
        // 성공하면 남은 셀을 다시 섞어서 최대한 랜덤성 유지
        positions = this.shuffleArray(positions);
      }
    }
  }

  // 해결책 가져오기
  getSolution(board) {
    const solution = this.copyBoard(board);
    this.solveSudoku(solution);
    return solution;
  }
}
