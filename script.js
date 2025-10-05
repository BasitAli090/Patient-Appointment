// Patient Appointment Dashboard for Al Farooq Kidney Center
class PatientDashboard {
    constructor() {
        this.patients = [];
        this.umarCounter = 0;
        this.samreenCounter = 0;
        this.resetPassword = 'admin123'; // Default password for reset
        this.db = null;
        this.init();
    }

    async init() {
        // Wait for Firebase to be available
        await this.waitForFirebase();
        this.setupEventListeners();
        await this.loadDataFromFirestore();
        this.setupRealTimeListener();
        this.setupDailyRefresh();
    }

    async waitForFirebase() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (window.db) {
                    this.db = window.db;
                    resolve();
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    }

    setupEventListeners() {
        // Auto-generate appointment number when doctor is selected
        document.getElementById('doctorUmar').addEventListener('change', () => {
            if (document.getElementById('doctorUmar').checked) {
                this.selectDoctor('Dr. Umar Farooq');
            }
        });
        document.getElementById('doctorSamreen').addEventListener('change', () => {
            if (document.getElementById('doctorSamreen').checked) {
                this.selectDoctor('Dr. Samreen Malik');
            }
        });
        
        // Enter key support for patient name input
        document.getElementById('patientName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addPatient();
            }
        });
    }

    setupDailyRefresh() {
        // Check if we need to refresh daily data
        const lastRefresh = localStorage.getItem('lastDailyRefresh');
        const today = new Date().toDateString();
        
        if (lastRefresh !== today) {
            this.refreshDailyData();
            localStorage.setItem('lastDailyRefresh', today);
        }
        
        // Set up daily refresh at midnight
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const timeUntilMidnight = tomorrow.getTime() - now.getTime();
        
        setTimeout(() => {
            this.refreshDailyData();
            localStorage.setItem('lastDailyRefresh', new Date().toDateString());
            // Set up the next daily refresh
            this.setupDailyRefresh();
        }, timeUntilMidnight);
    }

    refreshDailyData() {
        // Reset appointment counters daily
        this.umarCounter = 0;
        this.samreenCounter = 0;
        this.saveDoctorCounter('umar', 0);
        this.saveDoctorCounter('samreen', 0);
        
        // Update the UI
        this.updateStats();
        this.displayPatients();
        
        console.log('Daily data refreshed - appointment counters reset');
    }

    async loadDataFromFirestore() {
        try {
            // Load patients
            const patientsQuery = query(collection(this.db, 'patients'), orderBy('dateAdded', 'desc'));
            const patientsSnapshot = await getDocs(patientsQuery);
            this.patients = patientsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Load counters
            const countersDoc = await getDocs(collection(this.db, 'counters'));
            if (!countersDoc.empty) {
                const countersData = countersDoc.docs[0].data();
                this.umarCounter = countersData.umarCounter || 0;
                this.samreenCounter = countersData.samreenCounter || 0;
            }

            this.updateStats();
            this.displayPatients();
        } catch (error) {
            console.error('Error loading data from Firestore:', error);
            this.showErrorMessage('Failed to load data from database');
        }
    }

    setupRealTimeListener() {
        // Listen for real-time updates
        const patientsQuery = query(collection(this.db, 'patients'), orderBy('dateAdded', 'desc'));
        onSnapshot(patientsQuery, (snapshot) => {
            this.patients = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            this.updateStats();
            this.displayPatients();
        });

        // Listen for counter updates
        const countersQuery = query(collection(this.db, 'counters'));
        onSnapshot(countersQuery, (snapshot) => {
            if (!snapshot.empty) {
                const countersData = snapshot.docs[0].data();
                this.umarCounter = countersData.umarCounter || 0;
                this.samreenCounter = countersData.samreenCounter || 0;
                this.updateStats();
            }
        });
    }

    async savePatients() {
        // This method is no longer needed as we use real-time listeners
        // But keeping it for compatibility
    }

    async saveDoctorCounter(doctor, counter) {
        try {
            const countersRef = collection(this.db, 'counters');
            const countersSnapshot = await getDocs(countersRef);
            
            if (countersSnapshot.empty) {
                // Create new counters document
                await addDoc(countersRef, {
                    umarCounter: doctor === 'umar' ? counter : 0,
                    samreenCounter: doctor === 'samreen' ? counter : 0,
                    lastUpdated: new Date().toISOString()
                });
            } else {
                // Update existing counters document
                const docId = countersSnapshot.docs[0].id;
                const updateData = {
                    lastUpdated: new Date().toISOString()
                };
                updateData[`${doctor}Counter`] = counter;
                
                await updateDoc(doc(this.db, 'counters', docId), updateData);
            }
        } catch (error) {
            console.error('Error saving counter:', error);
        }
    }

    generateAppointmentNumber(doctor) {
        if (doctor === 'Dr. Umar Farooq') {
            this.umarCounter++;
            this.saveDoctorCounter('umar', this.umarCounter);
            return `UMAR-#${this.umarCounter}`;
        } else if (doctor === 'Dr. Samreen Malik') {
            this.samreenCounter++;
            this.saveDoctorCounter('samreen', this.samreenCounter);
            return `SAMREEN-#${this.samreenCounter}`;
        }
        return '';
    }

    selectDoctor(doctor) {
        // Set the radio button
        if (doctor === 'Dr. Umar Farooq') {
            document.getElementById('doctorUmar').checked = true;
            document.getElementById('doctorSamreen').checked = false;
        } else if (doctor === 'Dr. Samreen Malik') {
            document.getElementById('doctorSamreen').checked = true;
            document.getElementById('doctorUmar').checked = false;
        }
        
        this.updateAppointmentNumber();
    }

    updateAppointmentNumber() {
        const umarChecked = document.getElementById('doctorUmar').checked;
        const samreenChecked = document.getElementById('doctorSamreen').checked;
        const display = document.getElementById('appointmentNumberDisplay');
        const text = document.getElementById('appointmentNumberText');
        
        let doctor = '';
        if (umarChecked) {
            doctor = 'Dr. Umar Farooq';
        } else if (samreenChecked) {
            doctor = 'Dr. Samreen Malik';
        }
        
        if (doctor) {
            // Generate preview number without incrementing counter
            const previewNumber = this.generatePreviewNumber(doctor);
            text.textContent = previewNumber;
            display.className = 'appointment-number-display generated';
        } else {
            text.textContent = 'Select Doctor to Generate Number';
            display.className = 'appointment-number-display placeholder';
        }
    }

    generatePreviewNumber(doctor) {
        if (doctor === 'Dr. Umar Farooq') {
            return `UMAR-#${this.umarCounter + 1}`;
        } else if (doctor === 'Dr. Samreen Malik') {
            return `SAMREEN-#${this.samreenCounter + 1}`;
        }
        return '';
    }

    async addPatient() {
        const patientName = document.getElementById('patientName').value.trim();
        const umarChecked = document.getElementById('doctorUmar').checked;
        const samreenChecked = document.getElementById('doctorSamreen').checked;
        
        if (!patientName) {
            alert('Please enter patient name');
            return;
        }
        
        let doctor = '';
        if (umarChecked) {
            doctor = 'Dr. Umar Farooq';
        } else if (samreenChecked) {
            doctor = 'Dr. Samreen Malik';
        }
        
        if (!doctor) {
            alert('Please select a doctor');
            return;
        }
        
        const appointmentNumber = this.generateAppointmentNumber(doctor);
        
        const patient = {
            name: patientName,
            doctor: doctor,
            appointmentNumber: appointmentNumber,
            dateAdded: new Date().toISOString(),
            status: 'Active'
        };
        
        try {
            // Add patient to Firestore
            await addDoc(collection(this.db, 'patients'), patient);
            
            // Reset form
            document.getElementById('patientName').value = '';
            document.getElementById('doctorUmar').checked = false;
            document.getElementById('doctorSamreen').checked = false;
            
            const display = document.getElementById('appointmentNumberDisplay');
            const text = document.getElementById('appointmentNumberText');
            text.textContent = 'Select Doctor to Generate Number';
            display.className = 'appointment-number-display placeholder';
            
            // Show success message
            this.showSuccessMessage(`Patient ${patientName} added successfully with appointment number ${appointmentNumber}`);
        } catch (error) {
            console.error('Error adding patient:', error);
            this.showErrorMessage('Failed to add patient. Please try again.');
        }
    }

    showSuccessMessage(message) {
        // Create a temporary success message
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(40, 167, 69, 0.3);
            z-index: 1000;
            font-weight: 600;
            animation: slideIn 0.3s ease;
        `;
        successDiv.textContent = message;
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    showErrorMessage(message) {
        // Create a temporary error message
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #dc3545 0%, #e83e8c 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(220, 53, 69, 0.3);
            z-index: 1000;
            font-weight: 600;
            animation: slideIn 0.3s ease;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    updateStats() {
        const total = this.patients.length;
        const umar = this.patients.filter(p => p.doctor === 'Dr. Umar Farooq').length;
        const samreen = this.patients.filter(p => p.doctor === 'Dr. Samreen Malik').length;
        const today = new Date().toISOString().split('T')[0];
        const todayCount = this.patients.filter(p => p.dateAdded.split('T')[0] === today).length;

        document.getElementById('totalPatients').textContent = total;
        document.getElementById('umarPatients').textContent = umar;
        document.getElementById('samreenPatients').textContent = samreen;
        document.getElementById('todayPatients').textContent = todayCount;
        document.getElementById('umarCount').textContent = `${umar} patients`;
        document.getElementById('samreenCount').textContent = `${samreen} patients`;
    }

    displayPatients() {
        const doctorFilter = document.getElementById('doctorFilter').value;
        let filteredPatients = this.patients;

        if (doctorFilter) {
            filteredPatients = this.patients.filter(p => p.doctor === doctorFilter);
        }

        this.displayDoctorPatients('umar', filteredPatients.filter(p => p.doctor === 'Dr. Umar Farooq'));
        this.displayDoctorPatients('samreen', filteredPatients.filter(p => p.doctor === 'Dr. Samreen Malik'));
    }

    displayDoctorPatients(doctorType, patients) {
        const listElement = document.getElementById(`${doctorType}PatientsList`);
        
        if (patients.length === 0) {
            listElement.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-plus"></i>
                    <h3>No Patients Yet</h3>
                    <p>Add patients to see them here</p>
                </div>
            `;
            return;
        }

        listElement.innerHTML = patients.map(patient => `
            <div class="patient-card">
                <div class="patient-info">
                    <div class="patient-avatar">
                        ${patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="patient-details">
                        <h4>${patient.name}</h4>
                        <p>Added: ${this.formatDate(patient.dateAdded)}</p>
                    </div>
                </div>
                <div class="appointment-number">${patient.appointmentNumber}</div>
            </div>
        `).join('');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    filterPatients() {
        this.displayPatients();
    }

    async resetAllData() {
        const password = document.getElementById('resetPassword').value;
        
        if (password !== this.resetPassword) {
            alert('Incorrect password!');
            return;
        }
        
        if (confirm('Are you sure you want to reset ALL data? This cannot be undone!')) {
            try {
                // Delete all patients
                const patientsSnapshot = await getDocs(collection(this.db, 'patients'));
                const deletePromises = patientsSnapshot.docs.map(doc => deleteDoc(doc.ref));
                await Promise.all(deletePromises);
                
                // Reset counters
                this.umarCounter = 0;
                this.samreenCounter = 0;
                await this.saveDoctorCounter('umar', 0);
                await this.saveDoctorCounter('samreen', 0);
                
                this.closeResetModal();
                this.showSuccessMessage('All data has been reset successfully!');
            } catch (error) {
                console.error('Error resetting data:', error);
                this.showErrorMessage('Failed to reset data. Please try again.');
            }
        }
    }

    showResetModal() {
        document.getElementById('resetModal').style.display = 'block';
        document.getElementById('resetPassword').value = '';
    }

    closeResetModal() {
        document.getElementById('resetModal').style.display = 'none';
    }
}

// Global functions for HTML event handlers
function selectDoctor(doctor) {
    patientDashboard.selectDoctor(doctor);
}

function addPatient() {
    patientDashboard.addPatient();
}

function refreshDashboard() {
    patientDashboard.updateStats();
    patientDashboard.displayPatients();
    patientDashboard.showSuccessMessage('Dashboard refreshed!');
}

function filterPatients() {
    patientDashboard.filterPatients();
}

function showResetModal() {
    patientDashboard.showResetModal();
}

function closeResetModal() {
    patientDashboard.closeResetModal();
}

function resetAllData() {
    patientDashboard.resetAllData();
}

function scrollToPatientList() {
    const patientListSection = document.querySelector('.patient-lists-section');
    patientListSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
    
    // Add a highlight effect
    patientListSection.style.boxShadow = '0 20px 50px rgba(102, 126, 234, 0.3)';
    setTimeout(() => {
        patientListSection.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.1)';
    }, 2000);
}

// Initialize the dashboard when the page loads
let patientDashboard;
document.addEventListener('DOMContentLoaded', function() {
    patientDashboard = new PatientDashboard();
});

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('resetModal');
    if (event.target === modal) {
        closeResetModal();
    }
}

// Add CSS animation for success messages
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
