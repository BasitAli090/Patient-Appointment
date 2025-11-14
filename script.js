// Frozen appointment numbers
const FROZEN_NUMBERS = {
    umar: [1, 2, 3, 10, 15, 20],
    samreen: [1, 2, 3, 8, 9, 12, 13, 16, 17, 21, 22, 25, 26, 29, 30, 34, 35, 39, 40]
};

// Track last generated appointment numbers for today
let lastAppointmentToday = {
    umar: 0,
    samreen: 0
};

// Track last generated appointment numbers for yesterday
let lastAppointmentYesterday = {
    umar: 0,
    samreen: 0
};

// Track used appointment numbers for today to prevent duplicates
let usedAppointmentNumbersToday = {
    umar: new Set(),
    samreen: new Set()
};

// Track used appointment numbers for yesterday to prevent duplicates
let usedAppointmentNumbersYesterday = {
    umar: new Set(),
    samreen: new Set()
};

// Get today's date string for comparison
function getTodayDateString() {
    const today = new Date();
    return today.toDateString();
}

// Get yesterday's date string for comparison
function getYesterdayDateString() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toDateString();
}

// Check if date is today
function isToday(dateString) {
    try {
        const appointmentDate = new Date(dateString);
        return appointmentDate.toDateString() === getTodayDateString();
    } catch (e) {
        return false;
    }
}

// Check if date is yesterday
function isYesterdayDate(dateString) {
    try {
        const appointmentDate = new Date(dateString);
        return appointmentDate.toDateString() === getYesterdayDateString();
    } catch (e) {
        return false;
    }
}

// Initialize today's used numbers from existing appointments
function initializeTodayNumbers() {
    const today = getTodayDateString();
    
    ['umar', 'samreen'].forEach(doctorKey => {
        const todayAppointments = appointmentHistory[doctorKey].filter(item => {
            try {
                const appointmentDate = new Date(item.time);
                return appointmentDate.toDateString() === today;
            } catch (e) {
                return false;
            }
        });
        
        usedAppointmentNumbersToday[doctorKey].clear();
        todayAppointments.forEach(item => {
            usedAppointmentNumbersToday[doctorKey].add(item.number);
            if (item.number > lastAppointmentToday[doctorKey]) {
                lastAppointmentToday[doctorKey] = item.number;
            }
        });
    });
}

// Initialize yesterday's used numbers from existing appointments
function initializeYesterdayNumbers() {
    const yesterday = getYesterdayDateString();
    
    ['umar', 'samreen'].forEach(doctorKey => {
        const yesterdayAppointments = appointmentHistory[doctorKey].filter(item => {
            try {
                const appointmentDate = new Date(item.time);
                return appointmentDate.toDateString() === yesterday;
            } catch (e) {
                return false;
            }
        });
        
        usedAppointmentNumbersYesterday[doctorKey].clear();
        yesterdayAppointments.forEach(item => {
            usedAppointmentNumbersYesterday[doctorKey].add(item.number);
            if (item.number > lastAppointmentYesterday[doctorKey]) {
                lastAppointmentYesterday[doctorKey] = item.number;
            }
        });
    });
}

// Track appointment history
let appointmentHistory = {
    umar: [],
    samreen: []
};

// Track patient availability status
let patientAvailability = {
    umar: {},
    samreen: {}
};

// Load availability from localStorage
function loadAvailability() {
    try {
        const umarAvail = localStorage.getItem('availability_umar');
        const samreenAvail = localStorage.getItem('availability_samreen');
        if (umarAvail) patientAvailability.umar = JSON.parse(umarAvail);
        if (samreenAvail) patientAvailability.samreen = JSON.parse(samreenAvail);
    } catch (e) {
        console.error('Error loading availability:', e);
    }
}

// Save availability to localStorage and database
function saveAvailability() {
    localStorage.setItem('availability_umar', JSON.stringify(patientAvailability.umar));
    localStorage.setItem('availability_samreen', JSON.stringify(patientAvailability.samreen));
    // Also trigger database save
    saveToDatabase();
}

// Password for clearing appointments
const CLEAR_PASSWORD = 'admin123';

// Store which doctor to clear after password confirmation
let pendingClearDoctor = null;

// Generate next available appointment number for today
function generateAppointmentNumberToday(doctor) {
    const frozen = FROZEN_NUMBERS[doctor];
    const used = usedAppointmentNumbersToday[doctor];
    let nextNumber = lastAppointmentToday[doctor] + 1;
    
    // Start from 1 if no appointments today
    if (lastAppointmentToday[doctor] === 0) {
        nextNumber = 1;
    }
    
    // Find next available number that is not frozen and not already used
    while (frozen.includes(nextNumber) || used.has(nextNumber)) {
        nextNumber++;
    }
    
    // Mark this number as used
    used.add(nextNumber);
    lastAppointmentToday[doctor] = nextNumber;
    return nextNumber;
}

// Generate next available appointment number for yesterday
function generateAppointmentNumberYesterday(doctor) {
    const frozen = FROZEN_NUMBERS[doctor];
    const used = usedAppointmentNumbersYesterday[doctor];
    let nextNumber = lastAppointmentYesterday[doctor] + 1;
    
    // Start from 1 if no appointments yesterday
    if (lastAppointmentYesterday[doctor] === 0) {
        nextNumber = 1;
    }
    
    // Find next available number that is not frozen and not already used
    while (frozen.includes(nextNumber) || used.has(nextNumber)) {
        nextNumber++;
    }
    
    // Mark this number as used
    used.add(nextNumber);
    lastAppointmentYesterday[doctor] = nextNumber;
    return nextNumber;
}

// Update display for a doctor
function updateDisplay(doctor, appointmentNumber, patientName) {
    const doctorKey = doctor === 'umar' ? 'umar' : 'samreen';
    const appointmentElement = document.getElementById(`${doctorKey}Appointment`);
    const historyElement = document.getElementById(`${doctorKey}History`);
    const patientNameElement = document.getElementById(`${doctorKey}PatientName`);
    const nameInput = document.getElementById(`${doctorKey}Name`);
    
    // Update current appointment with animation
    appointmentElement.textContent = `#${appointmentNumber}`;
    appointmentElement.style.animation = 'pulse 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    
    // Add success notification effect
    appointmentElement.parentElement.style.transform = 'scale(1.02)';
    setTimeout(() => {
        appointmentElement.parentElement.style.transform = 'scale(1)';
    }, 200);
    
    // Update patient name display
    patientNameElement.textContent = `Patient: ${patientName}`;
    patientNameElement.style.display = 'block';
    
    // Clear name input
    nameInput.value = '';
    
    // Add to history
    const timestamp = new Date().toLocaleString();
    appointmentHistory[doctorKey].unshift({
        number: appointmentNumber,
        name: patientName,
        time: timestamp
    });
    
    // Save to database and localStorage
    saveToLocalStorage().then(() => {
        // Update history display after save completes
        updateHistoryDisplay(doctorKey, historyElement);
    });
}

// Update statistics
function updateStatistics() {
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();
    
    let umarToday = 0;
    let samreenToday = 0;
    let yesterdayTotal = 0;
    
    // Count today's appointments
    appointmentHistory.umar.forEach(item => {
        try {
            const appointmentDate = new Date(item.time);
            if (appointmentDate.toDateString() === today) {
                umarToday++;
            }
        } catch (e) {}
    });
    
    appointmentHistory.samreen.forEach(item => {
        try {
            const appointmentDate = new Date(item.time);
            if (appointmentDate.toDateString() === today) {
                samreenToday++;
            }
        } catch (e) {}
    });
    
    // Count yesterday's appointments
    appointmentHistory.umar.forEach(item => {
        try {
            const appointmentDate = new Date(item.time);
            if (appointmentDate.toDateString() === yesterday) {
                yesterdayTotal++;
            }
        } catch (e) {}
    });
    
    appointmentHistory.samreen.forEach(item => {
        try {
            const appointmentDate = new Date(item.time);
            if (appointmentDate.toDateString() === yesterday) {
                yesterdayTotal++;
            }
        } catch (e) {}
    });
    
    const totalToday = umarToday + samreenToday;
    
    // Update stat cards
    document.getElementById('totalTodayStat').textContent = totalToday;
    document.getElementById('umarTodayStat').textContent = umarToday;
    document.getElementById('samreenTodayStat').textContent = samreenToday;
    document.getElementById('yesterdayStat').textContent = yesterdayTotal;
}

// Update history display
function updateHistoryDisplay(doctorKey, historyElement) {
    const history = appointmentHistory[doctorKey];
    
    if (history.length === 0) {
        historyElement.innerHTML = '<div class="history-item">No appointments yet</div>';
        return;
    }
    
    // Show last 10 in dashboard
    const recentHistory = history.slice(0, 10);
    historyElement.innerHTML = recentHistory.map((item, index) => 
        `<div class="history-item">
            Appointment #${item.number} - ${item.name} - ${item.time}
        </div>`
    ).join('');
    
    // Update statistics
    updateStatistics();
}

// Update availability status (global function for inline handlers)
window.updateAvailability = function(doctorKey, appointmentNumber, isAvailable) {
    patientAvailability[doctorKey][appointmentNumber] = isAvailable;
    saveAvailability();
    updateFullList(doctorKey, document.getElementById(`${doctorKey}FullList`));
    updateYesterdayList(doctorKey, document.getElementById(`${doctorKey}YesterdayList`));
    updatePatientList(doctorKey, document.getElementById(`${doctorKey}PatientList`));
};

// Edit appointment name
window.editAppointment = function(doctorKey, appointmentNumber) {
    const history = appointmentHistory[doctorKey];
    const appointment = history.find(item => item.number === appointmentNumber);
    
    if (!appointment) return;
    
    const newName = prompt('Edit Patient Name:', appointment.name);
    if (newName !== null && newName.trim() !== '') {
        appointment.name = newName.trim();
        saveToLocalStorage();
        updateFullList(doctorKey, document.getElementById(`${doctorKey}FullList`));
        updateYesterdayList(doctorKey, document.getElementById(`${doctorKey}YesterdayList`));
        updatePatientList(doctorKey, document.getElementById(`${doctorKey}PatientList`));
        updateHistoryDisplay(doctorKey, document.getElementById(`${doctorKey}History`));
        updateStatistics();
    }
};

// Delete appointment
window.deleteAppointment = function(doctorKey, appointmentNumber) {
    if (!confirm('Are you sure you want to delete this appointment?')) {
        return;
    }
    
    // Remove from history
    appointmentHistory[doctorKey] = appointmentHistory[doctorKey].filter(
        item => item.number !== appointmentNumber
    );
    
    // Remove from used numbers (check both today and yesterday)
    usedAppointmentNumbersToday[doctorKey].delete(appointmentNumber);
    usedAppointmentNumbersYesterday[doctorKey].delete(appointmentNumber);
    
    // Remove availability status
    delete patientAvailability[doctorKey][appointmentNumber];
    saveAvailability();
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Update displays
    updateFullList(doctorKey, document.getElementById(`${doctorKey}FullList`));
    updateYesterdayList(doctorKey, document.getElementById(`${doctorKey}YesterdayList`));
    updatePatientList(doctorKey, document.getElementById(`${doctorKey}PatientList`));
    updateHistoryDisplay(doctorKey, document.getElementById(`${doctorKey}History`));
    
    // Update statistics
    updateStatistics();
    
    // Update current appointment display if it was deleted
    const appointmentElement = document.getElementById(`${doctorKey}Appointment`);
    if (appointmentElement.textContent === `#${appointmentNumber}`) {
        appointmentElement.textContent = '-';
        document.getElementById(`${doctorKey}PatientName`).style.display = 'none';
    }
};

// Update full appointment list in modal
function updateFullList(doctorKey, listElement) {
    const history = appointmentHistory[doctorKey];
    const availability = patientAvailability[doctorKey] || {};
    
    if (history.length === 0) {
        listElement.innerHTML = '<div class="list-item-empty">No appointments yet</div>';
        return;
    }
    
    listElement.innerHTML = history.map((item, index) => {
        const isAvailable = availability[item.number] || false;
        return `
            <div class="list-item ${isAvailable ? 'available' : ''}">
                <span class="list-number">#${item.number}</span>
                <span class="list-name">${item.name}</span>
                <span class="list-time">${item.time}</span>
                <label class="checkbox-label">
                    <input 
                        type="checkbox" 
                        class="availability-checkbox" 
                        ${isAvailable ? 'checked' : ''}
                        onchange="updateAvailability('${doctorKey}', ${item.number}, this.checked)"
                    >
                    <span class="checkbox-text">Available</span>
                </label>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editAppointment('${doctorKey}', ${item.number})" title="Edit">
                        <span>✏️</span>
                    </button>
                    <button class="btn-delete" onclick="deleteAppointment('${doctorKey}', ${item.number})" title="Delete">
                        <span>🗑️</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// API Base URL (use relative path for Vercel)
const API_BASE = '/api';

// Load data from database
async function loadFromDatabase() {
    try {
        const response = await fetch(`${API_BASE}/appointments`);
        if (response.ok) {
            const data = await response.json();
            
            // Load appointment history
            if (data.appointments) {
                appointmentHistory.umar = data.appointments.umar || [];
                appointmentHistory.samreen = data.appointments.samreen || [];
            }
            
            // Load availability
            if (data.availability) {
                patientAvailability.umar = data.availability.umar || {};
                patientAvailability.samreen = data.availability.samreen || {};
            }
            
            // Load numbering state
            if (data.lastAppointmentToday) {
                lastAppointmentToday.umar = data.lastAppointmentToday.umar || 0;
                lastAppointmentToday.samreen = data.lastAppointmentToday.samreen || 0;
            }
            
            if (data.lastAppointmentYesterday) {
                lastAppointmentYesterday.umar = data.lastAppointmentYesterday.umar || 0;
                lastAppointmentYesterday.samreen = data.lastAppointmentYesterday.samreen || 0;
            }
            
            // Load used numbers
            if (data.usedNumbersToday) {
                usedAppointmentNumbersToday.umar = new Set(data.usedNumbersToday.umar || []);
                usedAppointmentNumbersToday.samreen = new Set(data.usedNumbersToday.samreen || []);
            }
            
            if (data.usedNumbersYesterday) {
                usedAppointmentNumbersYesterday.umar = new Set(data.usedNumbersYesterday.umar || []);
                usedAppointmentNumbersYesterday.samreen = new Set(data.usedNumbersYesterday.samreen || []);
            }
            
            // Update UI after loading
            refreshAllDisplays();
            return true;
        } else {
            throw new Error('Failed to load from database');
        }
    } catch (e) {
        console.error('Error loading from database:', e);
        // Fallback to localStorage
        loadAppointmentHistory();
        refreshAllDisplays();
        return false;
    }
}

// Save data to database
async function saveToDatabase() {
    try {
        const dataToSave = {
            appointments: appointmentHistory,
            availability: patientAvailability,
            lastAppointmentToday: lastAppointmentToday,
            lastAppointmentYesterday: lastAppointmentYesterday,
            usedNumbersToday: {
                umar: Array.from(usedAppointmentNumbersToday.umar),
                samreen: Array.from(usedAppointmentNumbersToday.samreen)
            },
            usedNumbersYesterday: {
                umar: Array.from(usedAppointmentNumbersYesterday.umar),
                samreen: Array.from(usedAppointmentNumbersYesterday.samreen)
            }
        };
        
        const response = await fetch(`${API_BASE}/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSave)
        });
        
        if (!response.ok) {
            throw new Error('Failed to save to database');
        }
        return true;
    } catch (e) {
        console.error('Error saving to database:', e);
        // Fallback to localStorage
        localStorage.setItem('appointmentHistory_umar', JSON.stringify(appointmentHistory.umar));
        localStorage.setItem('appointmentHistory_samreen', JSON.stringify(appointmentHistory.samreen));
        return false;
    }
}

// Load appointment history from localStorage (fallback)
function loadAppointmentHistory() {
    try {
        const umarHistory = localStorage.getItem('appointmentHistory_umar');
        const samreenHistory = localStorage.getItem('appointmentHistory_samreen');
        if (umarHistory) {
            appointmentHistory.umar = JSON.parse(umarHistory);
        }
        if (samreenHistory) {
            appointmentHistory.samreen = JSON.parse(samreenHistory);
        }
    } catch (e) {
        console.error('Error loading appointment history:', e);
    }
}

// Unified save function - saves to database and localStorage
async function saveToLocalStorage() {
    // Save to database (with localStorage fallback)
    await saveToDatabase();
    
    // Also save to localStorage as backup
    localStorage.setItem('appointmentHistory_umar', JSON.stringify(appointmentHistory.umar));
    localStorage.setItem('appointmentHistory_samreen', JSON.stringify(appointmentHistory.samreen));
}

// Refresh all displays after data load
function refreshAllDisplays() {
    // Update history displays
    updateHistoryDisplay('umar', document.getElementById('umarHistory'));
    updateHistoryDisplay('samreen', document.getElementById('samreenHistory'));
    
    // Update statistics
    updateStatistics();
    
    // Update full lists if modals are open
    const appointmentModal = document.getElementById('appointmentModal');
    if (appointmentModal && appointmentModal.style.display === 'block') {
        updateFullList('umar', document.getElementById('umarFullList'));
        updateFullList('samreen', document.getElementById('samreenFullList'));
    }
    
    const yesterdayModal = document.getElementById('yesterdayModal');
    if (yesterdayModal && yesterdayModal.style.display === 'block') {
        updateYesterdayList('umar', document.getElementById('umarYesterdayList'));
        updateYesterdayList('samreen', document.getElementById('samreenYesterdayList'));
        updatePatientList('umar', document.getElementById('umarPatientList'));
        updatePatientList('samreen', document.getElementById('samreenPatientList'));
    }
}

// Open appointment list modal
function openAppointmentList() {
    const modal = document.getElementById('appointmentModal');
    loadAvailability();
    updateFullList('umar', document.getElementById('umarFullList'));
    updateFullList('samreen', document.getElementById('samreenFullList'));
    modal.style.display = 'block';
}

// Close appointment list modal
function closeAppointmentList() {
    const modal = document.getElementById('appointmentModal');
    modal.style.display = 'none';
}

// Check if appointment is from yesterday
function isYesterdayAppointment(timeString) {
    try {
        const appointmentDate = new Date(timeString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Compare year, month, and day
        return appointmentDate.getFullYear() === yesterday.getFullYear() &&
               appointmentDate.getMonth() === yesterday.getMonth() &&
               appointmentDate.getDate() === yesterday.getDate();
    } catch (e) {
        return false;
    }
}

// Update yesterday's appointment list
function updateYesterdayList(doctorKey, listElement) {
    const history = appointmentHistory[doctorKey];
    const availability = patientAvailability[doctorKey] || {};
    
    // Filter appointments from yesterday
    const yesterdayAppointments = history.filter(item => {
        return isYesterdayAppointment(item.time);
    });
    
    if (yesterdayAppointments.length === 0) {
        listElement.innerHTML = '<div class="list-item-empty">No appointments yesterday</div>';
        return;
    }
    
    listElement.innerHTML = yesterdayAppointments.map((item) => {
        const isAvailable = availability[item.number] || false;
        return `
            <div class="list-item ${isAvailable ? 'available' : ''}">
                <span class="list-number">#${item.number}</span>
                <span class="list-name">${item.name}</span>
                <span class="list-time">${item.time}</span>
                <label class="checkbox-label">
                    <input 
                        type="checkbox" 
                        class="availability-checkbox" 
                        ${isAvailable ? 'checked' : ''}
                        onchange="updateAvailability('${doctorKey}', ${item.number}, this.checked)"
                    >
                    <span class="checkbox-text">Available</span>
                </label>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editAppointment('${doctorKey}', ${item.number})" title="Edit">
                        <span>✏️</span>
                    </button>
                    <button class="btn-delete" onclick="deleteAppointment('${doctorKey}', ${item.number})" title="Delete">
                        <span>🗑️</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Generate appointment for yesterday
function generateYesterdayAppointment(doctor) {
    const doctorKey = doctor === 'umar' ? 'umar' : 'samreen';
    const nameInput = document.getElementById(`${doctorKey}YesterdayName`);
    const patientName = nameInput.value.trim();
    
    if (!patientName) {
        alert('Please enter patient name before generating appointment');
        nameInput.focus();
        return;
    }
    
    // Initialize yesterday numbers if needed
    initializeYesterdayNumbers();
    
    // Generate appointment number for yesterday
    const appointmentNumber = generateAppointmentNumberYesterday(doctorKey);
    
    // Create yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const timestamp = yesterday.toLocaleString();
    
    // Add to history
    appointmentHistory[doctorKey].unshift({
        number: appointmentNumber,
        name: patientName,
        time: timestamp
    });
    
    // Save to database and localStorage
    saveToLocalStorage().then(() => {
        // Clear name input
        nameInput.value = '';
        
        // Update displays after save completes
        updateYesterdayList(doctorKey, document.getElementById(`${doctorKey}YesterdayList`));
        updatePatientList(doctorKey, document.getElementById(`${doctorKey}PatientList`));
        updateHistoryDisplay(doctorKey, document.getElementById(`${doctorKey}History`));
    });
}

// Update patient list view
function updatePatientList(doctorKey, listElement) {
    const history = appointmentHistory[doctorKey];
    const availability = patientAvailability[doctorKey] || {};
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Filter yesterday's appointments
    const yesterdayAppointments = history.filter(item => {
        try {
            const appointmentDate = new Date(item.time);
            return appointmentDate.getFullYear() === yesterday.getFullYear() &&
                   appointmentDate.getMonth() === yesterday.getMonth() &&
                   appointmentDate.getDate() === yesterday.getDate();
        } catch (e) {
            return false;
        }
    });
    
    if (yesterdayAppointments.length === 0) {
        listElement.innerHTML = '<div class="patient-item-empty">No patients yesterday</div>';
        return;
    }
    
    listElement.innerHTML = yesterdayAppointments.map((item) => {
        const isAvailable = availability[item.number] || false;
        return `
            <div class="patient-item ${isAvailable ? 'available' : ''}">
                <span class="patient-name">${item.name}</span>
                <label class="checkbox-label">
                    <input 
                        type="checkbox" 
                        class="availability-checkbox" 
                        ${isAvailable ? 'checked' : ''}
                        onchange="updateAvailability('${doctorKey}', ${item.number}, this.checked)"
                    >
                </label>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editAppointment('${doctorKey}', ${item.number})" title="Edit">
                        <span>✏️</span>
                    </button>
                    <button class="btn-delete" onclick="deleteAppointment('${doctorKey}', ${item.number})" title="Delete">
                        <span>🗑️</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Show patient list view
function showPatientList() {
    const appointmentView = document.getElementById('yesterdayModalBody');
    const patientView = document.getElementById('patientListView');
    
    appointmentView.style.display = 'none';
    patientView.style.display = 'block';
    
    loadAvailability();
    updatePatientList('umar', document.getElementById('umarPatientList'));
    updatePatientList('samreen', document.getElementById('samreenPatientList'));
}

// Show appointment list view
function showAppointmentList() {
    const appointmentView = document.getElementById('yesterdayModalBody');
    const patientView = document.getElementById('patientListView');
    
    appointmentView.style.display = 'block';
    patientView.style.display = 'none';
    
    loadAvailability();
    updateYesterdayList('umar', document.getElementById('umarYesterdayList'));
    updateYesterdayList('samreen', document.getElementById('samreenYesterdayList'));
}

// Open yesterday's appointment modal
function openYesterdayAppointments() {
    const modal = document.getElementById('yesterdayModal');
    showAppointmentList();
    modal.style.display = 'block';
}

// Clear yesterday's appointments
function clearYesterdayList() {
    if (!confirm('Are you sure you want to clear all yesterday\'s appointments? This action requires password.')) {
        return;
    }
    
    // Show password modal for clearing yesterday's list
    pendingClearDoctor = 'yesterday';
    const passwordModal = document.getElementById('passwordModal');
    const passwordInput = document.getElementById('passwordInput');
    const errorDiv = document.getElementById('passwordError');
    
    passwordInput.value = '';
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
    passwordModal.style.display = 'block';
    passwordInput.focus();
}

// Actually clear yesterday's appointments after password verification
function performClearYesterdayList() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Filter out yesterday's appointments for both doctors
    ['umar', 'samreen'].forEach(doctorKey => {
        // Get yesterday's appointments before removing them
        const yesterdayAppointments = appointmentHistory[doctorKey].filter(item => {
            try {
                const appointmentDate = new Date(item.time);
                return appointmentDate.getFullYear() === yesterday.getFullYear() &&
                       appointmentDate.getMonth() === yesterday.getMonth() &&
                       appointmentDate.getDate() === yesterday.getDate();
            } catch (e) {
                return false;
            }
        });
        
        // Remove availability status and used numbers for yesterday's appointments
        yesterdayAppointments.forEach(item => {
            delete patientAvailability[doctorKey][item.number];
            usedAppointmentNumbersYesterday[doctorKey].delete(item.number);
        });
        
        // Reset yesterday numbering
        lastAppointmentYesterday[doctorKey] = 0;
        
        // Remove yesterday's appointments from history
        appointmentHistory[doctorKey] = appointmentHistory[doctorKey].filter(item => {
            try {
                const appointmentDate = new Date(item.time);
                return !(appointmentDate.getFullYear() === yesterday.getFullYear() &&
                        appointmentDate.getMonth() === yesterday.getMonth() &&
                        appointmentDate.getDate() === yesterday.getDate());
            } catch (e) {
                return true;
            }
        });
        
        saveAvailability();
    });
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Update all displays
    updateFullList('umar', document.getElementById('umarFullList'));
    updateFullList('samreen', document.getElementById('samreenFullList'));
    updateYesterdayList('umar', document.getElementById('umarYesterdayList'));
    updateYesterdayList('samreen', document.getElementById('samreenYesterdayList'));
    updatePatientList('umar', document.getElementById('umarPatientList'));
    updatePatientList('samreen', document.getElementById('samreenPatientList'));
    updateHistoryDisplay('umar', document.getElementById('umarHistory'));
    updateHistoryDisplay('samreen', document.getElementById('samreenHistory'));
    updateStatistics();
}

// Close yesterday's appointment modal
function closeYesterdayModal() {
    const modal = document.getElementById('yesterdayModal');
    modal.style.display = 'none';
}

// Show password modal
function showPasswordModal(doctor) {
    pendingClearDoctor = doctor;
    const modal = document.getElementById('passwordModal');
    const passwordInput = document.getElementById('passwordInput');
    const errorDiv = document.getElementById('passwordError');
    
    passwordInput.value = '';
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
    modal.style.display = 'block';
    passwordInput.focus();
}

// Close password modal
function closePasswordModal() {
    const modal = document.getElementById('passwordModal');
    const passwordInput = document.getElementById('passwordInput');
    const errorDiv = document.getElementById('passwordError');
    
    modal.style.display = 'none';
    passwordInput.value = '';
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
    pendingClearDoctor = null;
}

// Verify password and clear if correct
function verifyPasswordAndClear() {
    const passwordInput = document.getElementById('passwordInput');
    const errorDiv = document.getElementById('passwordError');
    const enteredPassword = passwordInput.value.trim();
    
    if (!enteredPassword) {
        errorDiv.textContent = 'Please enter password';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (enteredPassword !== CLEAR_PASSWORD) {
        errorDiv.textContent = 'Incorrect password';
        errorDiv.style.display = 'block';
        passwordInput.value = '';
        passwordInput.focus();
        return;
    }
    
    // Password correct, proceed with clearing
    if (pendingClearDoctor === 'yesterday') {
        performClearYesterdayList();
        closePasswordModal();
    } else if (pendingClearDoctor) {
        clearAppointments(pendingClearDoctor);
        closePasswordModal();
    }
}

// Clear appointments for a doctor (only today's appointments)
function clearAppointments(doctor) {
    const doctorKey = doctor === 'umar' ? 'umar' : 'samreen';
    const appointmentElement = document.getElementById(`${doctorKey}Appointment`);
    const historyElement = document.getElementById(`${doctorKey}History`);
    const patientNameElement = document.getElementById(`${doctorKey}PatientName`);
    const nameInput = document.getElementById(`${doctorKey}Name`);
    
    const today = getTodayDateString();
    
    // Get today's appointments to remove availability and used numbers
    const todayAppointments = appointmentHistory[doctorKey].filter(item => {
        try {
            const appointmentDate = new Date(item.time);
            return appointmentDate.toDateString() === today;
        } catch (e) {
            return false;
        }
    });
    
    // Remove availability status and used numbers for today's appointments only
    todayAppointments.forEach(item => {
        delete patientAvailability[doctorKey][item.number];
        usedAppointmentNumbersToday[doctorKey].delete(item.number);
    });
    
    // Remove only today's appointments from history (keep yesterday's)
    appointmentHistory[doctorKey] = appointmentHistory[doctorKey].filter(item => {
        try {
            const appointmentDate = new Date(item.time);
            return appointmentDate.toDateString() !== today;
        } catch (e) {
            return true; // Keep if date parsing fails
        }
    });
    
    // Reset today's numbering
    lastAppointmentToday[doctorKey] = 0;
    usedAppointmentNumbersToday[doctorKey].clear();
    
    // Save availability and history
    saveAvailability();
    saveToLocalStorage();
    
    // Update displays
    appointmentElement.textContent = '-';
    patientNameElement.textContent = '';
    patientNameElement.style.display = 'none';
    nameInput.value = '';
    
    // Update all displays
    updateHistoryDisplay(doctorKey, historyElement);
    updateFullList(doctorKey, document.getElementById(`${doctorKey}FullList`));
    updateYesterdayList(doctorKey, document.getElementById(`${doctorKey}YesterdayList`));
    updatePatientList(doctorKey, document.getElementById(`${doctorKey}PatientList`));
    updateStatistics();
}

// Event listeners
document.getElementById('generateUmar').addEventListener('click', () => {
    const nameInput = document.getElementById('umarName');
    const patientName = nameInput.value.trim();
    
    if (!patientName) {
        alert('Please enter patient name before generating appointment');
        nameInput.focus();
        return;
    }
    
    // Initialize today numbers if needed
    initializeTodayNumbers();
    
    const appointmentNumber = generateAppointmentNumberToday('umar');
    updateDisplay('umar', appointmentNumber, patientName);
});

document.getElementById('generateSamreen').addEventListener('click', () => {
    const nameInput = document.getElementById('samreenName');
    const patientName = nameInput.value.trim();
    
    if (!patientName) {
        alert('Please enter patient name before generating appointment');
        nameInput.focus();
        return;
    }
    
    // Initialize today numbers if needed
    initializeTodayNumbers();
    
    const appointmentNumber = generateAppointmentNumberToday('samreen');
    updateDisplay('samreen', appointmentNumber, patientName);
});

document.getElementById('clearUmar').addEventListener('click', () => {
    showPasswordModal('umar');
});

document.getElementById('clearSamreen').addEventListener('click', () => {
    showPasswordModal('samreen');
});

// Update date and time display
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    const dateTimeString = now.toLocaleDateString('en-US', options);
    const dateTimeElement = document.getElementById('dateTimeDisplay');
    if (dateTimeElement) {
        dateTimeElement.textContent = dateTimeString;
    }
}

// Initialize history displays
document.addEventListener('DOMContentLoaded', async () => {
    // Update date and time
    updateDateTime();
    setInterval(updateDateTime, 60000); // Update every minute
    
    // Load data from database first, fallback to localStorage
    await loadFromDatabase();
    
    // Load availability data (from database or localStorage)
    loadAvailability();
    
    // Initialize today and yesterday numbers from existing appointments
    initializeTodayNumbers();
    initializeYesterdayNumbers();
    
    // Update history displays
    updateHistoryDisplay('umar', document.getElementById('umarHistory'));
    updateHistoryDisplay('samreen', document.getElementById('samreenHistory'));
    
    // Update statistics
    updateStatistics();
    
    // Save initial data (don't await - just ensure it's saved)
    saveToLocalStorage().catch(err => console.error('Error saving initial data:', err));
    
    // Auto-refresh data every 3 seconds to sync across devices
    setInterval(async () => {
        await loadFromDatabase();
    }, 3000);
    
    // Also refresh when window gains focus (user switches back to tab)
    window.addEventListener('focus', async () => {
        await loadFromDatabase();
    });
    
    // Appointment List button event
    document.getElementById('appointmentListBtn').addEventListener('click', openAppointmentList);
    
    // Yesterday Appointment button event
    document.getElementById('yesterdayAppointmentBtn').addEventListener('click', openYesterdayAppointments);
    
    // Yesterday appointment generation buttons
    document.getElementById('generateUmarYesterday').addEventListener('click', () => {
        generateYesterdayAppointment('umar');
    });
    
    document.getElementById('generateSamreenYesterday').addEventListener('click', () => {
        generateYesterdayAppointment('samreen');
    });
    
    // Clear yesterday list button
    document.getElementById('clearYesterdayList').addEventListener('click', clearYesterdayList);
    
    // Patient list button - toggle between views
    document.getElementById('patientListBtn').addEventListener('click', () => {
        const appointmentView = document.getElementById('yesterdayModalBody');
        const isShowingAppointments = appointmentView.style.display !== 'none';
        
        if (isShowingAppointments) {
            showPatientList();
            document.getElementById('patientListBtn').textContent = 'Appointment List';
        } else {
            showAppointmentList();
            document.getElementById('patientListBtn').textContent = 'Patient List';
        }
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        const appointmentModal = document.getElementById('appointmentModal');
        if (event.target === appointmentModal) {
            closeAppointmentList();
        }
        
        const yesterdayModal = document.getElementById('yesterdayModal');
        if (event.target === yesterdayModal) {
            closeYesterdayModal();
        }
        
        const passwordModal = document.getElementById('passwordModal');
        if (event.target === passwordModal) {
            closePasswordModal();
        }
    });
    
    // Close appointment modal with X button
    document.querySelector('.close-modal').addEventListener('click', closeAppointmentList);
    
    // Close yesterday modal with X button
    document.querySelector('.close-yesterday-modal').addEventListener('click', closeYesterdayModal);
    
    // Password modal events
    document.getElementById('confirmPassword').addEventListener('click', verifyPasswordAndClear);
    document.getElementById('cancelPassword').addEventListener('click', closePasswordModal);
    document.querySelector('.close-password-modal').addEventListener('click', closePasswordModal);
    
    // Allow Enter key to submit password
    document.getElementById('passwordInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            verifyPasswordAndClear();
        }
    });
});

// Add pulse animation
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

