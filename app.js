// Fitness Tracker App
const monthSelect = document.getElementById('month');
const daySelect = document.getElementById('day');
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

// Store all entries
let entries = [];

// Load existing entries from localStorage
function loadEntries() {
    const saved = localStorage.getItem('fitnessEntries');
    if (saved) {
        entries = JSON.parse(saved);
        // Display all saved entries
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
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();

    // Prepare data with headers
    const data = [
        ['MONTH', 'DAY', 'EXERCISE', 'WEIGHT', 'REPS', 'SETS', 'TIME', 'NOTES'],
        ...entries.map(e => [e.month, e.day, e.exercise, e.weight || '', e.reps, e.sets, e.time, e.notes || ''])
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
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

    // Save file
    XLSX.writeFile(wb, 'fitness_tracker.xlsx');
}

// Handle completed button click
completedBtn.addEventListener('click', () => {
    // Handle new exercise addition
    let exerciseValue = exerciseSelect.value;
    if (exerciseValue === '__new__') {
        const newName = newExerciseInput.value.trim();
        if (!newName) return;
        // Check if it already exists
        const exists = Array.from(exerciseSelect.options).some(o => o.value === newName);
        if (!exists) {
            insertExerciseOption(newName);
            saveCustomExercise(newName);
        }
        exerciseSelect.value = newName;
        exerciseValue = newName;
        newExerciseInput.value = '';
        newExerciseInput.style.display = 'none';
    }

    // Get current selections
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

    // Add to entries array
    entries.push(entry);
    saveEntries();

    // Append to display
    addEntryToDisplay(entry);

    // Clear notes after adding
    notesInput.value = '';

    // Export to Excel
    exportToExcel();
});

// Reset button - single tap removes last entry, double tap clears all
let lastResetTap = 0;
const doubleTapDelay = 300; // milliseconds

resetBtn.addEventListener('click', () => {
    const now = Date.now();

    if (now - lastResetTap < doubleTapDelay) {
        // Double tap - clear all entries
        entries = [];
        saveEntries();
        historyEntries.innerHTML = '';
        lastResetTap = 0;
    } else {
        // Single tap - remove last entry
        if (entries.length > 0) {
            entries.pop();
            saveEntries();
            // Remove last row from display
            const lastRow = historyEntries.lastElementChild;
            if (lastRow) {
                lastRow.remove();
            }
        }
        lastResetTap = now;
    }
});

// Custom exercise management
function loadCustomExercises() {
    const saved = localStorage.getItem('customExercises');
    if (saved) {
        const customs = JSON.parse(saved);
        customs.forEach(name => insertExerciseOption(name));
    }
}

function insertExerciseOption(name) {
    const newOption = document.createElement('option');
    newOption.value = name;
    newOption.textContent = name;
    // Insert in alphabetical order before "New Exercise..."
    const options = Array.from(exerciseSelect.options);
    const newExerciseOpt = options.find(o => o.value === '__new__');
    const insertBefore = options.find(o => o.value !== '__new__' && o.textContent.localeCompare(name) > 0);
    exerciseSelect.insertBefore(newOption, insertBefore || newExerciseOpt);
}

function saveCustomExercise(name) {
    const saved = localStorage.getItem('customExercises');
    const customs = saved ? JSON.parse(saved) : [];
    if (!customs.includes(name)) {
        customs.push(name);
        customs.sort((a, b) => a.localeCompare(b));
        localStorage.setItem('customExercises', JSON.stringify(customs));
    }
}

exerciseSelect.addEventListener('change', () => {
    newExerciseInput.style.display = exerciseSelect.value === '__new__' ? '' : 'none';
});

// Load custom exercises and entries on startup
loadCustomExercises();
loadEntries();
