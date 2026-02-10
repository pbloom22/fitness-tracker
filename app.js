// Fitness Tracker App
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

// Default exercises per category
const defaultExercises = {
    Aerobics: ['Jump Rope', 'Rowing'],
    Balance: ['Balance Board', 'Hang'],
    Movements: ['Ab Brace', 'Back Extension', 'Plank', 'Sit/Stand', 'Static Lunge', 'Walking Lunge'],
    Weights: ['Farmer Carry', 'Inverted Pullup']
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

// Category change handler
categorySelect.addEventListener('change', () => {
    populateExercises(categorySelect.value);
});

// Exercise change handler - show/hide new exercise input
exerciseSelect.addEventListener('change', () => {
    newExerciseInput.style.display = exerciseSelect.value === '__new__' ? '' : 'none';
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
        ['MONTH', 'DAY', 'EXERCISE', 'WEIGHT', 'REPS', 'SETS', 'TIME', 'NOTES'],
        ...entries.map(e => [e.month, e.day, e.exercise, e.weight || '', e.reps, e.sets, e.time, e.notes || ''])
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
    let exerciseValue = exerciseSelect.value;
    const category = categorySelect.value;

    if (exerciseValue === '__new__') {
        const newName = newExerciseInput.value.trim();
        if (!newName) return;

        // Save custom exercise to this category
        const customExercises = loadCustomExercises();
        if (!customExercises[category]) {
            customExercises[category] = [];
        }
        if (!customExercises[category].includes(newName)) {
            customExercises[category].push(newName);
            customExercises[category].sort((a, b) => a.localeCompare(b));
            saveCustomExercises(customExercises);
        }

        // Repopulate and select the new exercise
        populateExercises(category);
        exerciseSelect.value = newName;
        exerciseValue = newName;
        newExerciseInput.value = '';
        newExerciseInput.style.display = 'none';
    }

    const entry = {
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

// Initialize: populate exercises for default category and load entries
populateExercises(categorySelect.value);
loadEntries();
