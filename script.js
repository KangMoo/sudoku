document.addEventListener('DOMContentLoaded', () => {
    const sudokuGenerator = new SudokuGenerator();
    const sudokuSolver = new SudokuSolver();

    let sudoku = null;          // 현재 스도쿠 게임 상태
    let selectedCell = null;    // 현재 선택된 셀
    let isMemoMode = false;     // 메모 모드 여부
    let timer = null;           // 타이머 참조
    let seconds = 0;            // 경과 시간 (초)
    let mistakeCount = 0;       // 실수 횟수
    let hintsUsed = 0;          // 힌트 사용 횟수
    let memos = {};             // 메모 상태 관리

    const screens = {
        start: document.getElementById('start-screen'),
        game: document.getElementById('game-screen'),
        victory: document.getElementById('victory-screen')
    };

    const elements = {
        sudokuBoard: document.getElementById('sudoku-board'),
        timer: document.getElementById('timer'),
        mistakes: document.getElementById('mistakes'),
        hintsUsed: document.getElementById('hints-used'),
        memoButton: document.getElementById('memo-button'),
        hintButton: document.getElementById('hint-button'),
        deleteButton: document.getElementById('delete-button'),
        numberButtons: document.querySelector('.number-buttons'),
        finalTime: document.querySelector('#final-time span'),
        finalMistakes: document.querySelector('#final-mistakes span'),
        finalHints: document.querySelector('#final-hints span')
    };

    // 난이도 선택 버튼 이벤트 리스너
    document.getElementById('easy').addEventListener('click', () => startGame('easy'));
    document.getElementById('medium').addEventListener('click', () => startGame('medium'));
    document.getElementById('hard').addEventListener('click', () => startGame('hard'));
    document.getElementById('expert').addEventListener('click', () => startGame('expert'));

    // 다시 하기 버튼 이벤트 리스너
    document.getElementById('play-again').addEventListener('click', () => {
        showScreen('start');
    });

    // 힌트 버튼 이벤트 리스너 - 이벤트 전파 방지 추가
    elements.hintButton.addEventListener('click', (event) => {
        event.stopPropagation();
        useHint();
    });

    // 메모 버튼 이벤트 리스너 - 이벤트 전파 방지 추가
    elements.memoButton.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleMemoMode();
    });

    // 삭제 버튼 이벤트 리스너 - 이벤트 전파 방지 추가
    elements.deleteButton.addEventListener('click', (event) => {
        event.stopPropagation();
        deleteNumber();
    });

    // 숫자 버튼 생성 - 이벤트 전파 방지 추가
    for (let i = 1; i <= 9; i++) {
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('number-button-container');

        const button = document.createElement('button');
        button.textContent = i;
        button.dataset.number = i;
        button.addEventListener('click', (event) => {
            event.stopPropagation(); // 클릭 이벤트 전파 방지
            inputNumber(i);
        });

        const counter = document.createElement('span');
        counter.classList.add('number-counter');
        counter.textContent = '0';
        counter.dataset.number = i;

        buttonContainer.appendChild(button);
        buttonContainer.appendChild(counter);
        elements.numberButtons.appendChild(buttonContainer);
    }

    // 게임 시작 함수
    function startGame(difficulty) {
        // 새 스도쿠 생성
        sudoku = sudokuGenerator.generateSudoku(difficulty);

        // 상태 초기화
        selectedCell = null;
        isMemoMode = false;
        seconds = 0;
        mistakeCount = 0;
        hintsUsed = 0;
        memos = {};

        // UI 초기화
        elements.memoButton.classList.remove('active');
        elements.timer.textContent = '00:00';
        elements.mistakes.textContent = '실수: 0';
        elements.hintsUsed.textContent = '사용한 힌트: 0';

        // 타이머 시작
        if (timer) clearInterval(timer);
        timer = setInterval(updateTimer, 1000);

        // 보드 그리기
        drawBoard();

        // 초기 숫자 카운터 업데이트
        updateNumberCounters();

        // 게임 화면 표시
        showScreen('game');
    }

    // 화면 전환 함수
    function showScreen(screenName) {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        screens[screenName].classList.add('active');
    }

    // 타이머 업데이트 함수
    function updateTimer() {
        seconds++;
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        elements.timer.textContent = `${mins}:${secs}`;
    }

    // 보드 그리기 함수
    function drawBoard() {
        elements.sudokuBoard.innerHTML = '';

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.classList.add('sudoku-cell');
                cell.dataset.row = row;
                cell.dataset.col = col;

                const value = sudoku.puzzle[row][col];
                if (value !== 0) {
                    cell.textContent = value;
                    cell.classList.add('given');
                } else {
                    // 메모 컨테이너 추가
                    const memoContainer = document.createElement('div');
                    memoContainer.classList.add('memo-container');

                    // 9개의 메모 영역 생성
                    for (let i = 0; i < 9; i++) {
                        const memoNumber = document.createElement('div');
                        memoNumber.classList.add('memo-number');
                        memoNumber.dataset.number = i + 1;
                        memoContainer.appendChild(memoNumber);
                    }

                    cell.appendChild(memoContainer);
                }

                // 모든 셀에 클릭 이벤트 리스너 추가 (given 셀 포함)
                cell.addEventListener('click', () => selectCell(row, col));
                elements.sudokuBoard.appendChild(cell);
            }
        }

        // 메모 상태 표시 업데이트
        updateMemos();

        // 숫자 카운터 업데이트
        updateNumberCounters();
    }

    // 셀 선택 함수
    function selectCell(row, col) {
        // 이미 선택된 셀을 다시 클릭한 경우 선택 해제
        if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
            clearHighlights();
            selectedCell = null;
            return;
        }

        // 이전 선택 셀 관련 효과 제거
        clearHighlights();

        // 새 셀 선택
        selectedCell = { row, col };

        // 선택된 셀 및 관련 셀 강조
        highlightCell(row, col);

        // 같은 숫자 강조
        const value = getValue(row, col);
        if (value !== 0) {
            highlightSameNumber(value);
        }
    }

    // 셀 강조 효과 함수
    function highlightCell(row, col) {
        const cell = getCellElement(row, col);
        if (!cell) return;

        // 선택된 셀 강조
        cell.classList.add('selected');

        // 같은 행/열 약한 강조
        for (let i = 0; i < 9; i++) {
            // 같은 행
            if (i !== col) {
                const rowCell = getCellElement(row, i);
                if (rowCell) rowCell.classList.add('related-row-col');
            }
            // 같은 열
            if (i !== row) {
                const colCell = getCellElement(i, col);
                if (colCell) colCell.classList.add('related-row-col');
            }
        }
    }

    // 같은 숫자 강조 함수
    function highlightSameNumber(num) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const value = getValue(row, col);
                const cell = getCellElement(row, col);

                if (!cell) continue;

                // 같은 숫자 강조
                if (value === num) {
                    cell.classList.add('same-number');
                }

                // 같은 숫자가 들어갈 수 없는 셀에 약한 음영
                // value === 0 조건을 제거하여 given 셀도 invalid-position 효과를 받도록 함
                if (value !== num && !sudokuSolver.isCellValid(sudoku.puzzle, row, col, num)) {
                    cell.classList.add('invalid-position');
                }
            }
        }
    }

    // 강조 효과 제거 함수
    function clearHighlights() {
        const cells = document.querySelectorAll('.sudoku-cell');
        cells.forEach(cell => {
            cell.classList.remove('selected', 'related-row-col', 'same-number', 'invalid-position');
        });
    }

    // 스도쿠 영역 밖 클릭 이벤트를 수정 (이벤트 버블링 방지)
    document.addEventListener('click', (event) => {
        // 클릭된 요소가 스도쿠 셀이거나 컨트롤 버튼이면 이벤트 처리하지 않음
        if (event.target.closest('.sudoku-cell') ||
            event.target.closest('.number-buttons') ||
            event.target.closest('.action-buttons')) {
            return;
        }

        // 그 외의 영역 클릭 시 셀 선택 해제
        clearHighlights();
        selectedCell = null;
    });

    // 숫자 입력 함수
    function inputNumber(num) {
        if (!selectedCell) {
            // 선택된 셀이 없을 때, 해당 숫자에 대한 강조 효과만 적용
            clearHighlights();
            highlightNumberWithoutSelection(num);
            return;
        }

        const { row, col } = selectedCell;
        const cell = getCellElement(row, col);

        // 선택된 셀이 초기값이거나 이미 정답이 입력된 경우
        if (cell && cell.classList.contains('given')) {
            clearHighlights();
            highlightNumberWithoutSelection(num);
            return;
        }

        // 현재 셀에 이미 정답이 입력된 경우, 오답으로 덮어쓰기 방지
        const currentValue = sudoku.puzzle[row][col];
        if (currentValue !== 0 && currentValue === sudoku.solution[row][col]) {
            // 이미 정답이 입력된 경우, 해당 숫자에 대한 강조 효과만 적용 
            clearHighlights();
            highlightNumberWithoutSelection(num);
            return;
        }

        if (isMemoMode) {
            // 메모 모드로 숫자 기록
            toggleMemoNumber(row, col, num);
            updateMemos();

            // 메모 입력 후에도 셀 선택 상태를 유지
            // selectCell 대신 강조 효과만 다시 적용
            clearHighlights();
            highlightCell(row, col);
            const value = getValue(row, col);
            if (value !== 0) {
                highlightSameNumber(value);
            }
            // 선택 상태 명시적으로 유지
            selectedCell = { row, col };
        } else {
            // 기존에 오답 클래스가 있으면 제거
            cell.classList.remove('wrong-number');

            // 정답 확인
            if (sudoku.solution[row][col] === num) {
                sudoku.puzzle[row][col] = num;
                cell.textContent = num;

                // 정답이 입력된 셀의 메모 모두 삭제
                const key = `${row},${col}`;
                if (memos[key]) {
                    delete memos[key];
                }

                // 관련 셀들의 메모에서 입력된 숫자만 제거
                removeRelatedMemos(row, col, num);

                // 숫자 카운터 업데이트
                updateNumberCounters();

                // 게임 클리어 확인
                if (isGameComplete()) {
                    gameComplete();
                    return; // 게임 클리어 시 셀 선택 로직 실행하지 않음
                }

                // 정답 입력 후에도 셀 선택 상태 유지 (누락된 부분 추가)
                clearHighlights(); // 기존 강조 효과 제거 후 다시 적용
                highlightCell(row, col);
                highlightSameNumber(num);

                // 선택 상태 유지
                selectedCell = { row, col };
            } else {
                // 오답 처리 - 빨간 글씨로 입력하기
                mistakeCount++;
                elements.mistakes.textContent = `실수: ${mistakeCount}`;

                // 오답 효과 및 입력
                cell.classList.add('error-flash');
                setTimeout(() => {
                    cell.classList.remove('error-flash');
                }, 500);

                // 오답을 셀에 표시하고 wrong-number 클래스 추가
                sudoku.puzzle[row][col] = num;
                cell.textContent = num;
                cell.classList.add('wrong-number');

                // 메모 컨테이너 제거 (오답 입력 시)
                const memoContainer = cell.querySelector('.memo-container');
                if (memoContainer) {
                    memoContainer.remove();
                }

                // 정답이 입력된 셀의 메모 모두 삭제
                const key = `${row},${col}`;
                if (memos[key]) {
                    delete memos[key];
                }

                // 숫자 카운터 업데이트
                updateNumberCounters();

                // 오답 입력 후에도 셀 선택 상태 유지
                clearHighlights(); // 기존 강조 효과 제거 후 다시 적용
                highlightCell(row, col);
                selectedCell = { row, col };
            }
        }
    }

    // 강조 효과만 다시 적용하는 헬퍼 함수 추가
    function refreshHighlights() {
        if (!selectedCell) return;

        const { row, col } = selectedCell;
        clearHighlights();
        highlightCell(row, col);

        const value = getValue(row, col);
        if (value !== 0) {
            highlightSameNumber(value);
        }
    }

    // 메모 모드 토글
    function toggleMemoMode() {
        isMemoMode = !isMemoMode;
        elements.memoButton.classList.toggle('active', isMemoMode);

        // 메모 모드 전환 후에도 선택 상태와 강조 효과 유지
        refreshHighlights();
    }

    // 메모에 숫자 추가/제거
    function toggleMemoNumber(row, col, num) {
        const key = `${row},${col}`;
        if (!memos[key]) memos[key] = new Set();

        if (memos[key].has(num)) {
            memos[key].delete(num);
        } else {
            memos[key].add(num);
        }
    }

    // 메모 상태 업데이트
    function updateMemos() {
        for (const key in memos) {
            const [row, col] = key.split(',').map(Number);
            const cell = getCellElement(row, col);
            if (!cell) continue;

            const memoContainer = cell.querySelector('.memo-container');
            if (!memoContainer) continue;

            // 모든 메모 숫자 비우기
            const memoElements = memoContainer.querySelectorAll('.memo-number');
            memoElements.forEach(elem => {
                elem.textContent = '';
            });

            // 저장된 메모 표시
            memos[key].forEach(num => {
                const memoElem = memoContainer.querySelector(`[data-number="${num}"]`);
                if (memoElem) memoElem.textContent = num;
            });
        }
    }

    // 관련 셀들의 메모에서 숫자 제거 (같은 행, 열, 박스에 있는 셀만 처리)
    function removeRelatedMemos(row, col, num) {
        const relatedCells = sudokuSolver.getRelatedCells(row, col);
        let updated = false;
        const animationPromises = [];

        relatedCells.forEach(cell => {
            const key = `${cell.row},${cell.col}`;
            if (memos[key] && memos[key].has(num)) {
                const cellElement = getCellElement(cell.row, cell.col);
                const memoContainer = cellElement?.querySelector('.memo-container');
                const memoElem = memoContainer?.querySelector(`[data-number="${num}"]`);

                if (memoElem && memoElem.textContent) {
                    // 시각적 효과 적용
                    memoElem.classList.add('fading-out');

                    // 애니메이션 완료 후 실제 메모 삭제
                    const promise = new Promise(resolve => {
                        setTimeout(() => {
                            memos[key].delete(num);
                            if (memos[key].size === 0) {
                                delete memos[key];
                            }
                            resolve();
                        }, 800); // 애니메이션 시간과 일치
                    });

                    animationPromises.push(promise);
                    updated = true;
                } else {
                    // DOM 요소가 없는 경우 바로 삭제
                    memos[key].delete(num);
                    if (memos[key].size === 0) {
                        delete memos[key];
                    }
                    updated = true;
                }
            }
        });

        // 모든 애니메이션이 완료된 후 메모 업데이트
        if (updated) {
            Promise.all(animationPromises).then(() => {
                updateMemos();
            });
        }
    }

    // 힌트 사용 함수
    function useHint() {
        if (!selectedCell) return;

        const { row, col } = selectedCell;
        const cell = getCellElement(row, col);

        // 선택된 셀이 초기값이거나 이미 채워진 경우
        if (cell.classList.contains('given') || sudoku.puzzle[row][col] !== 0) return;

        const correctNumber = sudoku.solution[row][col];
        sudoku.puzzle[row][col] = correctNumber;
        cell.textContent = correctNumber;

        // 힌트 사용 카운트 증가
        hintsUsed++;
        elements.hintsUsed.textContent = `사용한 힌트: ${hintsUsed}`;

        // 관련 셀들의 메모에서 입력된 숫자 제거
        removeRelatedMemos(row, col, correctNumber);

        // 게임 클리어 확인
        if (isGameComplete()) {
            gameComplete();
        }

        // 셀 재선택하여 강조 효과 업데이트
        clearHighlights();
        highlightCell(row, col);
        highlightSameNumber(correctNumber);

        // 선택 상태 명시적으로 유지
        selectedCell = { row, col };
    }

    // 숫자 삭제 함수
    function deleteNumber() {
        if (!selectedCell) return;

        const { row, col } = selectedCell;
        const cell = getCellElement(row, col);

        // 선택된 셀이 초기값인 경우
        if (cell.classList.contains('given')) return;

        // 숫자가 입력된 경우 (오답 포함)
        if (sudoku.puzzle[row][col] !== 0) {
            // 오답인 경우도 삭제 가능하도록 변경
            sudoku.puzzle[row][col] = 0;
            cell.textContent = '';
            cell.classList.remove('wrong-number');

            // 메모 컨테이너가 없으면 추가
            if (!cell.querySelector('.memo-container')) {
                const memoContainer = document.createElement('div');
                memoContainer.classList.add('memo-container');

                for (let i = 0; i < 9; i++) {
                    const memoNumber = document.createElement('div');
                    memoNumber.classList.add('memo-number');
                    memoNumber.dataset.number = i + 1;
                    memoContainer.appendChild(memoNumber);
                }

                cell.appendChild(memoContainer);
            }

            // 숫자 카운터 업데이트
            updateNumberCounters();
        }

        // 선택된 셀의 메모만 삭제
        const key = `${row},${col}`;
        if (memos[key]) {
            const memoContainer = cell.querySelector('.memo-container');
            if (memoContainer) {
                const memoElements = memoContainer.querySelectorAll('.memo-number');
                const animationPromises = [];

                memoElements.forEach(elem => {
                    if (elem.textContent) {
                        // 시각적 효과 적용
                        elem.classList.add('fading-out');

                        const promise = new Promise(resolve => {
                            setTimeout(resolve, 800); // 애니메이션 시간과 일치
                        });
                        animationPromises.push(promise);
                    }
                });

                // 애니메이션 완료 후 메모 삭제
                Promise.all(animationPromises).then(() => {
                    delete memos[key];
                    // updateMemos 함수 호출하여 DOM 업데이트
                    updateMemos();

                    // 선택 상태 유지
                    refreshHighlights();
                });
            } else {
                // DOM 요소가 없는 경우 바로 삭제
                delete memos[key];
            }
        }

        // 선택 상태 명시적으로 유지
        clearHighlights();
        highlightCell(row, col);
        selectedCell = { row, col };
    }

    // 숫자 카운터 업데이트 함수
    function updateNumberCounters() {
        // 1-9까지 각 숫자의 개수 세기
        const counts = Array(10).fill(0); // 인덱스 0은 사용하지 않음

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const value = sudoku.puzzle[row][col];
                if (value !== 0) {
                    counts[value]++;
                }
            }
        }

        // 각 숫자 버튼 카운터 업데이트
        for (let num = 1; num <= 9; num++) {
            const counter = document.querySelector(`.number-counter[data-number="${num}"]`);
            if (counter) {
                counter.textContent = counts[num];

                // 9개가 모두 사용된 숫자는 다른 색상으로 표시
                const button = document.querySelector(`button[data-number="${num}"]`);
                if (button) {
                    if (counts[num] >= 9) {
                        button.classList.add('number-completed');
                    } else {
                        button.classList.remove('number-completed');
                    }
                }
            }
        }
    }

    // 셀 요소 가져오기
    function getCellElement(row, col) {
        return document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
    }

    // 셀의 값 가져오기
    function getValue(row, col) {
        return sudoku.puzzle[row][col];
    }

    // 게임 클리어 확인
    function isGameComplete() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (sudoku.puzzle[row][col] === 0) return false;
            }
        }
        return true;
    }

    // 게임 클리어 처리
    function gameComplete() {
        // 타이머 중지
        clearInterval(timer);

        // 결과 표시
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        elements.finalTime.textContent = `${mins}:${secs}`;
        elements.finalMistakes.textContent = mistakeCount;
        elements.finalHints.textContent = hintsUsed;

        // 승리 화면 표시
        showScreen('victory');
    }

    // 선택된 셀이 없을 때 숫자 버튼 클릭 시 강조 효과를 적용하는 함수
    function highlightNumberWithoutSelection(num) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const value = getValue(row, col);
                const cell = getCellElement(row, col);

                if (!cell) continue;

                // 같은 숫자 강조
                if (value === num) {
                    cell.classList.add('same-number');
                }

                // 해당 숫자가 들어갈 수 없는 셀에 약한 음영
                if (value !== num && !sudokuSolver.isCellValid(sudoku.puzzle, row, col, num)) {
                    cell.classList.add('invalid-position');
                }
            }
        }
    }

    // 키보드 입력 처리 이벤트 리스너
    document.addEventListener('keydown', (event) => {
        // 숫자키 1-9 감지 (키패드와 상단 숫자키 모두 지원)
        const key = event.key;

        // 입력 필드나 다른 입력 요소에 포커스가 있을 때는 무시
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        // 숫자키 1-9 처리
        if (/^[1-9]$/.test(key)) {
            const num = parseInt(key);
            inputNumber(num);

            // 대응하는 버튼에 시각적 클릭 효과
            const button = document.querySelector(`button[data-number="${num}"]`);
            if (button) {
                button.classList.add('button-active');
                setTimeout(() => {
                    button.classList.remove('button-active');
                }, 200);
            }
        }
        // 기타 키 처리 (선택적 기능)
        else if (key === 'Delete' || key === 'Backspace') {
            // 지우기 버튼과 동일한 기능
            deleteNumber();

            // 지우기 버튼 시각적 클릭 효과
            const deleteButton = document.getElementById('delete-button');
            if (deleteButton) {
                deleteButton.classList.add('button-active');
                setTimeout(() => {
                    deleteButton.classList.remove('button-active');
                }, 200);
            }
        } else if (key === 'h' || key === 'H') {
            // 힌트 버튼과 동일한 기능
            useHint();

            // 힌트 버튼 시각적 클릭 효과
            const hintButton = document.getElementById('hint-button');
            if (hintButton) {
                hintButton.classList.add('button-active');
                setTimeout(() => {
                    hintButton.classList.remove('button-active');
                }, 200);
            }
        } else if (key === 'm' || key === 'M') {
            // 메모 버튼과 동일한 기능
            toggleMemoMode();

            // 메모 버튼 시각적 클릭 효과
            const memoButton = document.getElementById('memo-button');
            if (memoButton) {
                memoButton.classList.add('button-active');
                setTimeout(() => {
                    memoButton.classList.remove('button-active');
                }, 200);
            }
        }
    });

    // 뒤로가기 버튼 이벤트 리스너
    document.getElementById('back-button').addEventListener('click', () => {
        // 게임 진행 중 뒤로가기 버튼 클릭 시 확인 메시지
        if (confirm('게임을 종료하고 시작 화면으로 돌아가시겠습니까?')) {
            // 타이머 정지
            if (timer) {
                clearInterval(timer);
                timer = null;
            }

            // 시작 화면으로 이동
            showScreen('start');
        }
    });
});
