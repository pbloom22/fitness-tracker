// Fitness Tracker App
const dateSelect = document.getElementById('date');
const exerciseSelect = document.getElementById('exercise');
const weightSelect = document.getElementById('weight');
const repsSelect = document.getElementById('reps');
const setsSelect = document.getElementById('sets');
const timeSelect = document.getElementById('time');
const completedBtn = document.getElementById('completed-btn');
const resetBtn = document.getElementById('reset-btn');
const historyEntries = document.getElementById('history-entries');

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
        <div class="history-cell">${entry.date}</div>
        <div class="history-cell">${entry.exercise}</div>
        <div class="history-cell">${entry.weight || '-'}</div>
        <div class="history-cell">${entry.reps}</div>
        <div class="history-cell">${entry.sets}</div>
        <div class="history-cell">${entry.time}</div>
    `;
    historyEntries.appendChild(row);
}

// Export to Excel
function exportToExcel() {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();

    // Prepare data with headers
    const data = [
        ['DATE', 'EXERCISE', 'WEIGHT', 'REPS', 'SETS', 'TIME'],
        ...entries.map(e => [e.date, e.exercise, e.weight || '', e.reps, e.sets, e.time])
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
        { wch: 12 },  // DATE
        { wch: 18 },  // EXERCISE
        { wch: 10 },  // WEIGHT
        { wch: 8 },   // REPS
        { wch: 8 },   // SETS
        { wch: 12 }   // TIME
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Fitness Log');

    // Save file
    XLSX.writeFile(wb, 'fitness_tracker.xlsx');
}

// Handle completed button click
completedBtn.addEventListener('click', () => {
    // Get current selections
    const entry = {
        date: dateSelect.value,
        exercise: exerciseSelect.value,
        weight: weightSelect.value,
        reps: repsSelect.value,
        sets: setsSelect.value,
        time: timeSelect.value
    };

    // Check if all fields are selected (weight is optional)
    if (!entry.date || !entry.exercise || !entry.reps || !entry.sets || !entry.time) {
        alert('Please select all fields before marking as completed.');
        return;
    }

    // Add to entries array
    entries.push(entry);
    saveEntries();

    // Append to display
    addEntryToDisplay(entry);

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

// Load entries on startup
loadEntries();
