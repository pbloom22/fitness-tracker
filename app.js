// Fitness Tracker App
const nameSelect = document.getElementById('name');
const newNameInput = document.getElementById('new-name-input');
const monthSelect = document.getElementById('month');
const daySelect = document.getElementById('day');
const categorySelect = document.getElementById('category');
const exerciseSelect = document.getElementById('exercise');
const weightSelect = document.getElementById('weight');
const repsSelect = document.getElementById('reps');
const setsSelect = document.getElementById('sets');
const timeSelect = document.getElementById('time');
const notesInput = document.getElementById('notes');
const completedBtn = document.getElementById('completed-btn');
const resetBtn = document.getElementById('reset-btn');
const historyEntries = document.getElementById('history-entries');
const newExerciseInput = document.getElementById('new-exercise-input');
const timerContainer = document.getElementById('timer-container');
const timerDisplay = document.getElementById('timer-display');
const timerToggleBtn = document.getElementById('timer-toggle-btn');
const timerResetBtn = document.getElementById('timer-reset-btn');

// Default exercises per category (fallback if server is unreachable)
let defaultExercises = {
    Aerobics: ['Jump Rope', 'Rowing'],
    Balance: ['Balance Board'],
    Movements: ['Ab Brace', 'Back Extension', 'Hang', 'Inverted Pullup', 'Plank', 'Sit/Stand', 'Static Lunge', 'Walking Lunge'],
    Weights: ['Farmer Carry', 'Hack Squat']
};

// Store all entries
let entries = [];

// Load custom exercises from localStorage (keyed by category)
function loadCustomExercises() {
    const saved = localStorage.getItem('customExercises');
    if (saved) {
        const parsed = JSON.parse(saved);
        // Migrate from old flat array format to category-keyed object
        if (Array.isArray(parsed)) {
            localStorage.setItem('customExercises', JSON.stringify({}));
            return {};
        }
        return parsed;
    }
    return {};
}

function saveCustomExercises(customExercises) {
    localStorage.setItem('customExercises', JSON.stringify(customExercises));
}

// Populate exercise dropdown for a given category
function populateExercises(category) {
    const customExercises = loadCustomExercises();
    const defaults = defaultExercises[category] || [];
    const customs = customExercises[category] || [];

    // Merge and sort alphabetically, removing duplicates
    const allExercises = [...new Set([...defaults, ...customs])].sort((a, b) => a.localeCompare(b));

    // Clear and rebuild
    exerciseSelect.innerHTML = '';
    allExercises.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        exerciseSelect.appendChild(opt);
    });

    // Add "New Exercise..." at the end
    const newOpt = document.createElement('option');
    newOpt.value = '__new__';
    newOpt.textContent = 'New Exercise...';
    exerciseSelect.appendChild(newOpt);

    // Hide new exercise input when switching categories
    newExerciseInput.style.display = 'none';
    newExerciseInput.value = '';
}

// Name dropdown: load custom names from localStorage
function loadCustomNames() {
    const saved = localStorage.getItem('customNames');
    return saved ? JSON.parse(saved) : [];
}

function saveCustomNames(names) {
    localStorage.setItem('customNames', JSON.stringify(names));
}

function populateNames() {
    const customs = loadCustomNames();
    nameSelect.innerHTML = '<option value="Peter">Peter</option>';
    customs.forEach(name => {
        if (name !== 'Peter') {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            nameSelect.appendChild(opt);
        }
    });
    const newOpt = document.createElement('option');
    newOpt.value = '__new__';
    newOpt.textContent = 'New Name...';
    nameSelect.appendChild(newOpt);
    nameSelect.value = 'Peter';
}

nameSelect.addEventListener('change', () => {
    newNameInput.style.display = nameSelect.value === '__new__' ? '' : 'none';
    if (nameSelect.value !== '__new__') newNameInput.value = '';
});

// Timer state
let timerInterval = null;
let timerSeconds = 0;
let timerRunning = false;

function formatTime(s) {
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

function resetTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    timerSeconds = 0;
    timerDisplay.textContent = '00:00';
    timerToggleBtn.textContent = 'START';
    timerToggleBtn.classList.remove('timer-running');
}

timerToggleBtn.addEventListener('click', () => {
    if (timerRunning) {
        clearInterval(timerInterval);
        timerRunning = false;
        timerToggleBtn.textContent = 'START';
        timerToggleBtn.classList.remove('timer-running');
    } else {
        timerInterval = setInterval(() => {
            timerSeconds++;
            timerDisplay.textContent = formatTime(timerSeconds);
        }, 1000);
        timerRunning = true;
        timerToggleBtn.textContent = 'STOP';
        timerToggleBtn.classList.add('timer-running');
    }
});

timerResetBtn.addEventListener('click', resetTimer);

function updateTimerVisibility() {
    const show = categorySelect.value === 'Aerobics' && exerciseSelect.value && exerciseSelect.value !== '__new__';
    timerContainer.style.display = show ? '' : 'none';
    if (!show) resetTimer();
}

// Category change handler
categorySelect.addEventListener('change', () => {
    populateExercises(categorySelect.value);
    updateTimerVisibility();
});

// Exercise change handler - show/hide new exercise input and timer
exerciseSelect.addEventListener('change', () => {
    newExerciseInput.style.display = exerciseSelect.value === '__new__' ? '' : 'none';
    if (categorySelect.value === 'Aerobics' && exerciseSelect.value !== '__new__') {
        resetTimer();
    }
    updateTimerVisibility();
});

// Load existing entries from localStorage
function loadEntries() {
    const saved = localStorage.getItem('fitnessEntries');
    if (saved) {
        entries = JSON.parse(saved);
        entries.forEach(entry => addEntryToDisplay(entry));
    }
}

// Save entries to localStorage
function saveEntries() {
    localStorage.setItem('fitnessEntries', JSON.stringify(entries));
}

// Add entry to the display (append a new row)
function addEntryToDisplay(entry) {
    const row = document.createElement('div');
    row.className = 'history-row';
    row.innerHTML = `
        <div class="history-cell">${entry.name || '-'}</div>
        <div class="history-cell">${entry.month}</div>
        <div class="history-cell">${entry.day}</div>
        <div class="history-cell">${entry.exercise}</div>
        <div class="history-cell">${entry.weight || '-'}</div>
        <div class="history-cell">${entry.reps}</div>
        <div class="history-cell">${entry.sets}</div>
        <div class="history-cell">${entry.time}</div>
        <div class="history-cell">${entry.notes || '-'}</div>
    `;
    historyEntries.appendChild(row);
}

// Export to Excel
function exportToExcel() {
    const wb = XLSX.utils.book_new();
    const data = [
        ['NAME', 'MONTH', 'DAY', 'EXERCISE', 'WEIGHT', 'REPS', 'SETS', 'TIME', 'NOTES'],
        ...entries.map(e => [e.name || '', e.month, e.day, e.exercise, e.weight || '', e.reps, e.sets, e.time, e.notes || ''])
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
        { wch: 8 },   // MONTH
        { wch: 6 },   // DAY
        { wch: 18 },  // EXERCISE
        { wch: 10 },  // WEIGHT
        { wch: 8 },   // REPS
        { wch: 8 },   // SETS
        { wch: 12 },  // TIME
        { wch: 30 }   // NOTES
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Fitness Log');
    XLSX.writeFile(wb, 'fitness_tracker.xlsx');
}

// Handle completed button click
completedBtn.addEventListener('click', () => {
    let nameValue = nameSelect.value;
    if (nameValue === '__new__') {
        const newName = newNameInput.value.trim();
        if (!newName) return;
        const customs = loadCustomNames();
        if (!customs.includes(newName)) {
            customs.push(newName);
            saveCustomNames(customs);
        }
        populateNames();
        nameSelect.value = newName;
        nameValue = newName;
    }

    let exerciseValue = exerciseSelect.value;
    const category = categorySelect.value;

    if (exerciseValue === '__new__') {
        const newName = newExerciseInput.value.trim();
        if (!newName) return;

        // Save custom exercise to localStorage (immediate, for this session)
        const customExercises = loadCustomExercises();
        if (!customExercises[category]) {
            customExercises[category] = [];
        }
        if (!customExercises[category].includes(newName)) {
            customExercises[category].push(newName);
            customExercises[category].sort((a, b) => a.localeCompare(b));
            saveCustomExercises(customExercises);
        }

        // Permanently commit to GitHub so it redeploys as a default
        fetch('/api/add-exercise', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, exercise: newName })
        }).catch(() => {}); // fire-and-forget; localStorage covers the session gap

        // Repopulate and select the new exercise
        populateExercises(category);
        exerciseSelect.value = newName;
        exerciseValue = newName;
        newExerciseInput.value = '';
        newExerciseInput.style.display = 'none';
    }

    const entry = {
        name: nameValue,
        month: monthSelect.value,
        day: daySelect.value,
        exercise: exerciseValue,
        weight: weightSelect.value,
        reps: repsSelect.value,
        sets: setsSelect.value,
        time: timeSelect.value,
        notes: notesInput.value
    };

    entries.push(entry);
    saveEntries();
    addEntryToDisplay(entry);
    notesInput.value = '';
    exportToExcel();
});

// Reset button - single tap removes last entry, double tap clears all
let lastResetTap = 0;
const doubleTapDelay = 300;

resetBtn.addEventListener('click', () => {
    const now = Date.now();

    if (now - lastResetTap < doubleTapDelay) {
        entries = [];
        saveEntries();
        historyEntries.innerHTML = '';
        lastResetTap = 0;
    } else {
        if (entries.length > 0) {
            entries.pop();
            saveEntries();
            const lastRow = historyEntries.lastElementChild;
            if (lastRow) {
                lastRow.remove();
            }
        }
        lastResetTap = now;
    }
});

// Initialize
populateNames();
populateExercises(categorySelect.value);
updateTimerVisibility();
loadEntries();

// Fetch latest exercises from server, then repopulate (overrides hardcoded defaults)
fetch('/exercises.json')
    .then(r => r.json())
    .then(data => {
        defaultExercises = data;
        populateExercises(categorySelect.value);
    })
    .catch(() => {}); // silently fall back to hardcoded defaults if unreachable
