document.addEventListener('DOMContentLoaded', () => {
    const sudokuGenerator = new SudokuGenerator();
    const sudokuSolver = new SudokuSolver();
    const shareManager = new ShareManager();

    let sudoku = null;          // Current sudoku game state
    let selectedCell = null;    // Currently selected cell
    let isMemoMode = false;     // Whether memo mode is active
    let timer = null;           // Timer reference
    let seconds = 0;            // Elapsed time (seconds)
    let mistakeCount = 0;       // Number of mistakes
    let hintsUsed = 0;          // Number of hints used
    let memos = {};             // Memo state management
    let currentDifficulty = null; // Current difficulty
    let originalPuzzle = null;  // Initial given sudoku state

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
        backButton: document.getElementById('back-button'),
        difficultyDisplay: document.getElementById('difficulty-display'),
        finalDifficulty: document.querySelector('#final-difficulty span'),
        finalTime: document.querySelector('#final-time span'),
        finalMistakes: document.querySelector('#final-mistakes span'),
        finalHints: document.querySelector('#final-hints span')
    };

    // Difficulty string mapping
    const difficultyNames = {
        'easy': 'Easy',
        'medium': 'Medium',
        'hard': 'Hard',
        'expert': 'Expert'
    };

    function updateDifficultyDisplay() {
        if (!currentDifficulty) return;

        const displayName = difficultyNames[currentDifficulty] || currentDifficulty;
        elements.difficultyDisplay.textContent = `Difficulty: ${displayName}`;
    }


    // Difficulty selection button event listeners
    document.getElementById('easy').addEventListener('click', () => startGame('easy'));
    document.getElementById('medium').addEventListener('click', () => startGame('medium'));
    document.getElementById('hard').addEventListener('click', () => startGame('hard'));
    document.getElementById('expert').addEventListener('click', () => startGame('expert'));

    // Play again button event listener
    document.getElementById('play-again').addEventListener('click', () => {
        showScreen('start');
    });

    // Hint button event listener
    elements.hintButton.addEventListener('click', (event) => {
        event.stopPropagation();
        useHint();
    });

    // Memo button event listener
    elements.memoButton.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleMemoMode();
    });

    // Delete button event listener
    elements.deleteButton.addEventListener('click', (event) => {
        event.stopPropagation();
        deleteNumber();
    });

    // Create number buttons
    for (let i = 1; i <= 9; i++) {
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('number-button-container');

        const button = document.createElement('button');
        button.textContent = i;
        button.dataset.number = i;
        button.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent click event propagation
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

    // Function to update the URL with current game state
    function updateUrlWithGameState(isVictory = false) {
        if (!sudoku) return;

        const gameState = {
            puzzle: sudoku.puzzle,
            solution: sudoku.solution,
            originalPuzzle: originalPuzzle, // Initial puzzle state
            isMemoMode: isMemoMode,
            seconds: seconds,
            mistakeCount: mistakeCount,
            hintsUsed: hintsUsed,
            memos: memos,
            difficulty: currentDifficulty,
            isVictory: isVictory  // Victory state included
        };

        shareManager.saveStateToUrl(gameState);
    }

    // Function to load game state from URL
    function loadGameStateFromUrl() {
        const gameState = shareManager.getStateFromUrl();
        if (gameState) {
            // Restore game state saved in URL
            restoreGameState(gameState);
            return true;
        }
        return false;
    }

    // Function to restore game state
    function restoreGameState(gameState) {
        // Extract necessary information from game state
        sudoku = {
            puzzle: gameState.puzzle,
            solution: gameState.solution
        };

        // Restore initial puzzle state
        originalPuzzle = gameState.originalPuzzle || gameState.puzzle.map(row => row.map(cell => cell !== 0 ? cell : 0));

        isMemoMode = gameState.isMemoMode;
        seconds = gameState.seconds;
        mistakeCount = gameState.mistakeCount;
        hintsUsed = gameState.hintsUsed;
        memos = gameState.memos || {};
        currentDifficulty = gameState.difficulty;

        // Update UI
        elements.memoButton.classList.toggle('active', isMemoMode);
        elements.mistakes.textContent = `Mistakes: ${mistakeCount}`;
        elements.hintsUsed.textContent = `Hints used: ${hintsUsed}`;

        // Timer related logic
        if (timer) clearInterval(timer);
        updateTimer(true); // Update timer display only

        // Show results screen if in victory state
        if (gameState.isVictory) {
            // Display results
            const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
            const secs = (seconds % 60).toString().padStart(2, '0');
            elements.finalTime.textContent = `${mins}:${secs}`;
            elements.finalMistakes.textContent = mistakeCount;
            elements.finalHints.textContent = hintsUsed;

            // Show victory screen
            showScreen('victory');
        } else {
            // Otherwise proceed with normal game restoration
            timer = setInterval(updateTimer, 1000);

            // Draw the board
            drawBoard();

            // Update memos and number counters
            updateMemos();
            updateNumberCounters();

            // Update difficulty display
            updateDifficultyDisplay();

            // Switch to game screen
            showScreen('game');
        }
    }

    // Game start function
    function startGame(difficulty) {
        // Generate new sudoku
        sudoku = sudokuGenerator.generateSudoku(difficulty);

        // Save initial puzzle state
        originalPuzzle = sudoku.puzzle.map(row => [...row]);

        // Initialize state
        selectedCell = null;
        isMemoMode = false;
        seconds = 0;
        mistakeCount = 0;
        hintsUsed = 0;
        memos = {};
        currentDifficulty = difficulty;

        // Initialize UI
        elements.memoButton.classList.remove('active');
        elements.timer.textContent = '00:00';
        elements.mistakes.textContent = 'Mistakes: 0';
        elements.hintsUsed.textContent = `Hints used: 0`;

        // Start timer
        if (timer) clearInterval(timer);
        timer = setInterval(updateTimer, 1000);

        // Draw board
        drawBoard();

        // Update initial number counters
        updateNumberCounters();

        // Update difficulty display
        updateDifficultyDisplay();

        // Show game screen
        showScreen('game');

        // Save game state to URL
        updateUrlWithGameState();
    }

    // Screen transition function
    function showScreen(screenName) {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        screens[screenName].classList.add('active');
    }

    // Timer update function
    function updateTimer() {
        seconds++;
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        elements.timer.textContent = `${mins}:${secs}`;

        // Update URL every 10 seconds
        if (seconds % 10 === 0) {
            updateUrlWithGameState();
        }
    }

    // Board drawing function
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

                    // Distinguish between initial puzzle values and user inputs
                    if (originalPuzzle[row][col] !== 0) {
                        cell.classList.add('given'); // Initially given number
                    } else {
                        cell.classList.add('user-input'); // User input number

                        // If incorrect
                        if (value !== sudoku.solution[row][col]) {
                            cell.classList.add('wrong-number');
                        }
                    }
                } else {
                    // Memo container
                    const memoContainer = document.createElement('div');
                    memoContainer.classList.add('memo-container');

                    // Create 9 memo areas
                    for (let i = 0; i < 9; i++) {
                        const memoNumber = document.createElement('div');
                        memoNumber.classList.add('memo-number');
                        memoNumber.dataset.number = i + 1;
                        memoContainer.appendChild(memoNumber);
                    }

                    cell.appendChild(memoContainer);
                }

                // Add click event listener to all cells (including given cells)
                cell.addEventListener('click', () => selectCell(row, col));
                elements.sudokuBoard.appendChild(cell);
            }
        }

        // Update memo display
        updateMemos();

        // Update number counters
        updateNumberCounters();
    }

    // Cell selection function
    function selectCell(row, col) {
        // If clicking on an already selected cell, deselect it
        if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
            clearHighlights();
            selectedCell = null;
            return;
        }

        // Remove effects from previously selected cell
        clearHighlights();

        // Select new cell
        selectedCell = { row, col };

        // Highlight selected cell and related cells
        highlightCell(row, col);

        // Highlight same numbers
        const value = getValue(row, col);
        if (value !== 0) {
            highlightSameNumber(value);
        }
    }

    // Cell highlighting function
    function highlightCell(row, col) {
        const cell = getCellElement(row, col);
        if (!cell) return;

        // Highlight selected cell
        cell.classList.add('selected');

        // Weak highlight for same row/column
        for (let i = 0; i < 9; i++) {
            // Same row
            if (i !== col) {
                const rowCell = getCellElement(row, i);
                if (rowCell) rowCell.classList.add('related-row-col');
            }
            // Same column
            if (i !== row) {
                const colCell = getCellElement(i, col);
                if (colCell) colCell.classList.add('related-row-col');
            }
        }
    }

    // Same number highlighting function
    function highlightSameNumber(num) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const value = getValue(row, col);
                const cell = getCellElement(row, col);

                if (!cell) continue;

                // Highlight same numbers
                if (value === num) {
                    cell.classList.add('same-number');
                }

                // Light shading for cells where the same number cannot be placed
                // Removed value === 0 condition to also apply invalid-position effect to given cells
                if (value !== num && !sudokuSolver.isCellValid(sudoku.puzzle, row, col, num)) {
                    cell.classList.add('invalid-position');
                }
            }
        }
    }

    // Remove highlighting effects function
    function clearHighlights() {
        const cells = document.querySelectorAll('.sudoku-cell');
        cells.forEach(cell => {
            cell.classList.remove('selected', 'related-row-col', 'same-number', 'invalid-position');
        });
    }

    // Modified click event outside sudoku area (prevent event bubbling)
    document.addEventListener('click', (event) => {
        // Don't process the event if clicking on a sudoku cell or control button
        if (event.target.closest('.sudoku-cell') ||
            event.target.closest('.number-buttons') ||
            event.target.closest('.action-buttons')) {
            return;
        }

        // Clicking elsewhere deselects the cell
        clearHighlights();
        selectedCell = null;
    });

    // Number input function
    function inputNumber(num) {
        try {
            if (!selectedCell) {
                // If no cell is selected, just apply highlighting effects for the number
                clearHighlights();
                highlightNumberWithoutSelection(num);
                return;
            }

            const { row, col } = selectedCell;
            const cell = getCellElement(row, col);

            // If the selected cell is an initial value or already has the correct answer
            if (cell && cell.classList.contains('given')) {
                clearHighlights();
                highlightNumberWithoutSelection(num);
                return;
            }

            // If the current cell already has the correct answer, prevent overwriting with an incorrect answer
            const currentValue = sudoku.puzzle[row][col];
            if (currentValue !== 0 && currentValue === sudoku.solution[row][col]) {
                // If the answer is already correct, just apply highlighting effects for the number
                clearHighlights();
                highlightNumberWithoutSelection(num);
                return;
            }

            if (isMemoMode) {
                // Record number in memo mode
                toggleMemoNumber(row, col, num);
                updateMemos();

                // Maintain cell selection state after memo input
                // Apply highlighting effects instead of calling selectCell
                clearHighlights();
                highlightCell(row, col);
                const value = getValue(row, col);
                if (value !== 0) {
                    highlightSameNumber(value);
                }
                // Explicitly maintain selection state
                selectedCell = { row, col };
            } else {
                // Remove any existing wrong answer class
                cell.classList.remove('wrong-number');

                // Check answer
                if (sudoku.solution[row][col] === num) {
                    sudoku.puzzle[row][col] = num;
                    cell.textContent = num;
                    cell.classList.add('user-input'); // User input number
                    // Delete all memos for the correctly filled cell
                    const key = `${row},${col}`;
                    if (memos[key]) {
                        delete memos[key];
                    }

                    // Remove only the entered number from memos in related cells
                    removeRelatedMemos(row, col, num);

                    // Update number counters
                    updateNumberCounters();

                    // Check for game completion
                    if (isGameComplete()) {
                        gameComplete();
                        return; // Don't run cell selection logic if game is complete
                    }

                    // Maintain cell selection state after correct answer
                    clearHighlights(); // Remove existing effects and reapply
                    highlightCell(row, col);
                    highlightSameNumber(num);

                    // Maintain selection state
                    selectedCell = { row, col };
                } else {
                    // Process incorrect answer
                    mistakeCount++;
                    elements.mistakes.textContent = `Mistakes: ${mistakeCount}`;

                    // Error effect and input
                    cell.classList.add('error-flash');
                    setTimeout(() => {
                        cell.classList.remove('error-flash');
                    }, 500);

                    // Display wrong answer and add wrong-number class
                    sudoku.puzzle[row][col] = num;
                    cell.textContent = num;
                    cell.classList.add('wrong-number');

                    // Remove memo container (for wrong answers)
                    const memoContainer = cell.querySelector('.memo-container');
                    if (memoContainer) {
                        memoContainer.remove();
                    }

                    // Delete all memos for the cell with wrong answer
                    const key = `${row},${col}`;
                    if (memos[key]) {
                        delete memos[key];
                    }

                    // Update number counters
                    updateNumberCounters();

                    // Maintain cell selection state after wrong answer
                    clearHighlights(); // Remove existing effects and reapply
                    highlightCell(row, col);
                    selectedCell = { row, col };
                }
            }
        } finally {
            updateUrlWithGameState();
        }
    }

    // Helper function to reapply highlighting effects
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

    // Toggle memo mode
    function toggleMemoMode() {
        isMemoMode = !isMemoMode;
        elements.memoButton.classList.toggle('active', isMemoMode);

        if (isMemoMode) {
            // Maintain selection state and highlighting when activating memo mode
            refreshHighlights();
        } else {
            // Remove selection state and highlighting when deactivating memo mode
            clearHighlights();
            selectedCell = null;
        }
        
        // Update URL state
        updateUrlWithGameState();    
    }

    // Add/remove number in memo
    function toggleMemoNumber(row, col, num) {
        const key = `${row},${col}`;
        if (!memos[key]) memos[key] = new Set();

        if (memos[key].has(num)) {
            memos[key].delete(num);
        } else {
            memos[key].add(num);
        }
    }

    // Update memo state
    function updateMemos() {
        for (const key in memos) {
            const [row, col] = key.split(',').map(Number);
            const cell = getCellElement(row, col);
            if (!cell) continue;

            const memoContainer = cell.querySelector('.memo-container');
            if (!memoContainer) continue;

            // Clear all memo numbers
            const memoElements = memoContainer.querySelectorAll('.memo-number');
            memoElements.forEach(elem => {
                elem.textContent = '';
                elem.classList.remove('fading-out');
            });

            // Display saved memos
            memos[key].forEach(num => {
                const memoElem = memoContainer.querySelector(`[data-number="${num}"]`);
                if (memoElem) memoElem.textContent = num;
            });
        }
    }

    // Remove numbers from memos in related cells (cells in the same row, column, or box)
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
                    // Apply visual effect
                    memoElem.classList.add('fading-out');

                    // Actually delete memo after animation completes
                    const promise = new Promise(resolve => {
                        setTimeout(() => {
                            memos[key].delete(num);
                            if (memos[key].size === 0) {
                                delete memos[key];
                            }
                            resolve();
                        }, 800); // Match animation time
                    });

                    animationPromises.push(promise);
                    updated = true;
                } else {
                    // Delete immediately if DOM element doesn't exist
                    memos[key].delete(num);
                    if (memos[key].size === 0) {
                        delete memos[key];
                    }
                    updated = true;
                }
            }
        });

        // Update memos after all animations complete
        if (updated) {
            Promise.all(animationPromises).then(() => {
                updateMemos();
            });
        }
    }

    // Use hint function
    function useHint() {
        if (!selectedCell) return;

        const { row, col } = selectedCell;
        const cell = getCellElement(row, col);

        // If selected cell is an initial value or already filled
        if (cell.classList.contains('given') || sudoku.puzzle[row][col] !== 0) return;

        const correctNumber = sudoku.solution[row][col];
        sudoku.puzzle[row][col] = correctNumber;
        cell.textContent = correctNumber;

        // Increment hint usage count
        hintsUsed++;
        elements.hintsUsed.textContent = `Hints used: ${hintsUsed}`;

        // Remove the entered number from memos in related cells
        removeRelatedMemos(row, col, correctNumber);
        
        // Update number counters
        updateNumberCounters();

        // Check for game completion
        if (isGameComplete()) {
            gameComplete();
        }

        // Reselect cell to update highlighting effects
        clearHighlights();
        highlightCell(row, col);
        highlightSameNumber(correctNumber);

        // Explicitly maintain selection state
        selectedCell = { row, col };
        
        // Update URL state
        updateUrlWithGameState();
    }

    // Delete number function
    function deleteNumber() {
        if (!selectedCell) return;

        const { row, col } = selectedCell;
        const cell = getCellElement(row, col);

        // If selected cell is an initial value
        if (cell.classList.contains('given')) return;

        // If a number is entered (including wrong answers)
        if (sudoku.puzzle[row][col] !== 0) {
            // Change to allow deletion of wrong answers
            sudoku.puzzle[row][col] = 0;
            cell.textContent = '';
            cell.classList.remove('wrong-number');

            // Add memo container if it doesn't exist
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

            // Update number counters
            updateNumberCounters();
        }

        // Delete only memos for selected cell
        const key = `${row},${col}`;
        if (memos[key]) {
            const memoContainer = cell.querySelector('.memo-container');
            if (memoContainer) {
                const memoElements = memoContainer.querySelectorAll('.memo-number');
                const animationPromises = [];

                memoElements.forEach(elem => {
                    if (elem.textContent) {
                        // Apply visual effect
                        elem.classList.add('fading-out');

                        const promise = new Promise(resolve => {
                            setTimeout(resolve, 800); // Match animation time
                        });
                        animationPromises.push(promise);
                    }
                });

                // Delete memos after animation completes
                Promise.all(animationPromises).then(() => {
                    delete memos[key];
                    // Call updateMemos to update DOM
                    updateMemos();

                    // Maintain selection state
                    refreshHighlights();
                });
            } else {
                // Delete immediately if DOM element doesn't exist
                delete memos[key];
            }
        }

        // Explicitly maintain selection state
        clearHighlights();
        highlightCell(row, col);
        selectedCell = { row, col };
        updateUrlWithGameState();
    }

    // Update number counter function
    function updateNumberCounters() {
        // Count each number 1-9
        const counts = Array(10).fill(0); // Index 0 is not used

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const value = sudoku.puzzle[row][col];
                if (value !== 0) {
                    counts[value]++;
                }
            }
        }

        // Update each number button counter
        for (let num = 1; num <= 9; num++) {
            const counter = document.querySelector(`.number-counter[data-number="${num}"]`);
            if (counter) {
                counter.textContent = counts[num];

                // Mark numbers used 9 times with a different color
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

    // Get cell element
    function getCellElement(row, col) {
        return document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
    }

    // Get cell value
    function getValue(row, col) {
        return sudoku.puzzle[row][col];
    }

    // Check for game completion
    function isGameComplete() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (sudoku.puzzle[row][col] === 0) return false;
            }
        }
        return true;
    }

    // Game completion handling
    function gameComplete() {
        // Stop timer
        clearInterval(timer);

        // Display results
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        elements.finalDifficulty.textContent = difficultyNames[currentDifficulty] || currentDifficulty;
        elements.finalTime.textContent = `${mins}:${secs}`;
        elements.finalMistakes.textContent = mistakeCount;
        elements.finalHints.textContent = hintsUsed;

        // Update URL with victory state
        updateUrlWithGameState(true);

        // Show victory screen
        showScreen('victory');

        // Reset game state
        sudoku = null;
        selectedCell = null;
        isMemoMode = false;
        seconds = 0;
        mistakeCount = 0;
        hintsUsed = 0;
        memos = {};
        originalPuzzle = null;
        currentDifficulty = null;

        // Remove game state from URL (remove hash)
        window.history.replaceState(null, null, window.location.pathname);
    }

    // Function to apply highlighting effects when there's no selected cell and a number button is clicked
    function highlightNumberWithoutSelection(num) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const value = getValue(row, col);
                const cell = getCellElement(row, col);

                if (!cell) continue;

                // Highlight same numbers
                if (value === num) {
                    cell.classList.add('same-number');
                }

                // Light shading for cells where the number cannot be placed
                if (value !== num && !sudokuSolver.isCellValid(sudoku.puzzle, row, col, num)) {
                    cell.classList.add('invalid-position');
                }
            }
        }
    }

    // Keyboard input handling event listener
    document.addEventListener('keydown', (event) => {
        // Ignore when focus is on an input field or other input element
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        // Arrow key handling
        if (event.key.startsWith('Arrow')) {
            event.preventDefault(); // Prevent page scrolling
            moveSelectionWithArrowKey(event.key);
            return;
        }

        // Number keys 1-9 handling
        if (/^[1-9]$/.test(event.key)) {
            const num = parseInt(event.key);
            inputNumber(num);

            // Visual click effect for corresponding button
            const button = document.querySelector(`button[data-number="${num}"]`);
            if (button) {
                button.classList.add('button-active');
                setTimeout(() => {
                    button.classList.remove('button-active');
                }, 200);
            }
        }
        // Other key handling (optional features)
        else if (event.key === 'Delete' || event.key === 'Backspace') {
            // Same functionality as delete button
            deleteNumber();

            // Visual click effect for delete button
            const deleteButton = elements.deleteButton;
            if (deleteButton) {
                deleteButton.classList.add('button-active');
                setTimeout(() => {
                    deleteButton.classList.remove('button-active');
                }, 200);
            }
        } else if (event.key === 'h' || event.key === 'H') {
            // Same functionality as hint button
            useHint();

            // Visual click effect for hint button
            const hintButton = elements.hintButton;
            if (hintButton) {
                hintButton.classList.add('button-active');
                setTimeout(() => {
                    hintButton.classList.remove('button-active');
                }, 200);
            }
        } else if (event.key === 'm' || event.key === 'M') {
            // Same functionality as memo button
            toggleMemoMode();

            // Visual click effect for memo button
            const memoButton = elements.memoButton;
            if (memoButton) {
                memoButton.classList.add('button-active');
                setTimeout(() => {
                    memoButton.classList.remove('button-active');
                }, 200);
            }
        }
    });

    // Function to move selected cell with arrow keys
    function moveSelectionWithArrowKey(arrowKey) {
        // If no cell is selected, start from default position (0,0)
        if (!selectedCell) {
            selectCell(0, 0);
            return;
        }

        let { row, col } = selectedCell;
        
        switch (arrowKey) {
            case 'ArrowUp':
                row = Math.max(0, row - 1);
                break;
            case 'ArrowDown':
                row = Math.min(8, row + 1);
                break;
            case 'ArrowLeft':
                col = Math.max(0, col - 1);
                break;
            case 'ArrowRight':
                col = Math.min(8, col + 1);
                break;
        }

        // Only select cell if the new position is different from current
        if (row !== selectedCell.row || col !== selectedCell.col) {
            selectCell(row, col);
        }
    }

    // Back button event listener
    elements.backButton.addEventListener('click', () => {
        // Confirmation message when clicking back button during game
        if (confirm('Are you sure you want to exit the game and return to the start screen?')) {
            // Stop timer
            if (timer) {
                clearInterval(timer);
                timer = null;
            }

            // Reset game state
            sudoku = null;
            selectedCell = null;
            isMemoMode = false;
            seconds = 0;
            mistakeCount = 0;
            hintsUsed = 0;
            memos = {};
            originalPuzzle = null;
            currentDifficulty = null;

            // Remove game state from URL (remove hash)
            window.history.replaceState(null, null, window.location.pathname);

            // Go to start screen
            showScreen('start');
        }
    });

    // Check and restore game state from URL on page load
    if (!loadGameStateFromUrl()) {
        // Show start screen if no state in URL
        showScreen('start');
    }
});
