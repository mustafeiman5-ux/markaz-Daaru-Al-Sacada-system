// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCh4xfuPwFf-b8apo2wCgr_KKg4Vms1CgA",
    authDomain: "daru-al-sacaada.firebaseapp.com",
    projectId: "daru-al-sacaada",
    storageBucket: "daru-al-sacaada.firebasestorage.app",
    messagingSenderId: "657609777903",
    appId: "1:657609777903:web:f60939115d48fb5331311a",
    measurementId: "G-N73LNF62LD"
};
const app = firebase.initializeApp(firebaseConfig);
const analytics = firebase.analytics();

// ==================== GLOBAL STATE ====================
let currentUser = null;
let allStudents = [];
let allUsers = [];
let allPayments = [];
let allExpenses = [];
let allAttendance = [];
let allGraduated = [];
let allArchives = [];
let settings = { schoolName: 'مركز دار السعادة', monthlyFee: 0, darkMode: false };
let attendanceData = {};

// ==================== UTILITY FUNCTIONS ====================
function generateUniqueId(prefix) {
    return prefix + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Simple Password Hash (For client-side demo. Use bcrypt on server for production)
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'hashed_' + Math.abs(hash).toString(16);
}

function showMessage(msg, type, id) {
    const box = document.getElementById(id);
    if (box) {
        box.textContent = msg;
        box.className = 'message-box ' + type;
        box.style.display = 'block';
        if (box.timeoutId) clearTimeout(box.timeoutId);
        box.timeoutId = setTimeout(() => { box.style.display = 'none'; }, 4000);
    }
}

function toggleLoading(btnId, textId, spinnerId, isLoading) {
    const btn = document.getElementById(btnId);
    const text = document.getElementById(textId);
    const spinner = document.getElementById(spinnerId);
    if (btn) btn.disabled = isLoading;
    if (text) text.style.display = isLoading ? 'none' : 'inline';
    if (spinner) spinner.style.display = isLoading ? 'inline-block' : 'none';
}

// ==================== INITIALIZATION ====================
window.addEventListener('DOMContentLoaded', () => {
    loadAllData();
    initializeDefaults();
    applySettings();
    setupEventListeners();
    updateOnlineStatus();
    updateDate();
    checkSessionRestore();
});

function loadAllData() {
    try {
        const savedUsers = localStorage.getItem('sms_users');
        const savedStudents = localStorage.getItem('sms_students');
        const savedPayments = localStorage.getItem('sms_payments');
        const savedExpenses = localStorage.getItem('sms_expenses');
        const savedAttendance = localStorage.getItem('sms_attendance');
        const savedGraduated = localStorage.getItem('sms_graduated');
        const savedArchives = localStorage.getItem('sms_archives');
        const savedSettings = localStorage.getItem('sms_settings');
        
        if (savedUsers) allUsers = JSON.parse(savedUsers);
        if (savedStudents) allStudents = JSON.parse(savedStudents);
        if (savedPayments) allPayments = JSON.parse(savedPayments);
        if (savedExpenses) allExpenses = JSON.parse(savedExpenses);
        if (savedAttendance) allAttendance = JSON.parse(savedAttendance);
        if (savedGraduated) allGraduated = JSON.parse(savedGraduated);
        if (savedArchives) allArchives = JSON.parse(savedArchives);
        if (savedSettings) settings = JSON.parse(savedSettings);
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function checkSessionRestore() {
    const savedUser = localStorage.getItem('sms_currentUser');
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            const userExists = allUsers.find(u => u.id === user.id);
            if (userExists) {
                currentUser = user;
                showDashboard();
                return;
            }
        } catch (error) {
            localStorage.removeItem('sms_currentUser');
        }
    }
    showLoginPage();
}

function showLoginPage() {
    const loginSec = document.getElementById('loginSection');
    const dashSec = document.getElementById('dashboardSection');
    if (loginSec) loginSec.style.display = 'flex';
    if (dashSec) dashSec.style.display = 'none';
    currentUser = null;
    document.body.classList.remove('teacher-view');
}

function initializeDefaults() {
    if (allUsers.length === 0) {
        allUsers.push({
            id: generateUniqueId('USR'),
            username: 'admin',
            password: hashPassword('admin123'),
            fullName: 'System Administrator',
            role: 'manager',
            salary: 0,
            phone: '',
            permissions: ['students', 'finance', 'attendance', 'reports', 'graduated', 'settings', 'archives'],
            createdAt: new Date().toISOString()
        });
        saveUsers();
    }
}

function applySettings() {
    const schoolNameEl = document.getElementById('settingSchoolName');
    const monthlyFeeEl = document.getElementById('settingMonthlyFee');
    if (schoolNameEl) schoolNameEl.value = settings.schoolName;
    if (monthlyFeeEl) monthlyFeeEl.value = settings.monthlyFee;
    document.title = settings.schoolName + ' - School Management';
    if (settings.darkMode) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
}

function updateDate() {
    const dateEl = document.getElementById('currentDate');
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function updateOnlineStatus() {
    const ind = document.getElementById('offlineIndicator');
    if (!ind) return;
    ind.style.display = navigator.onLine ? 'none' : 'block';
    window.addEventListener('online', () => { ind.style.display = 'none'; });
    window.addEventListener('offline', () => { ind.style.display = 'block'; });
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    
    const logoutBtn = document.getElementById('logoutBtn'); 
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    
    const regForm = document.getElementById('registrationForm'); 
    if (regForm) regForm.addEventListener('submit', handleManualRegister);
    
    const payForm = document.getElementById('paymentForm'); 
    if (payForm) payForm.addEventListener('submit', handlePayment);
    
    const expenseForm = document.getElementById('expenseForm');
    if (expenseForm) expenseForm.addEventListener('submit', handleExpense);
    
    const archiveForm = document.getElementById('archiveForm');
    if (archiveForm) archiveForm.addEventListener('submit', handleArchive);
    
    const staffForm = document.getElementById('staffForm'); 
    if (staffForm) staffForm.addEventListener('submit', handleStaffSubmit);
    
    const graduationForm = document.getElementById('graduationForm'); 
    if (graduationForm) graduationForm.addEventListener('submit', handleGraduation);
    
    const settingsForm = document.getElementById('settingsForm');  
    if (settingsForm) settingsForm.addEventListener('submit', handleSettingsSave);
    
    const searchStudents = document.getElementById('searchStudents'); 
    if (searchStudents) searchStudents.addEventListener('input', renderStudentsTable);
    
    const filterClass = document.getElementById('filterClass'); 
    if (filterClass) filterClass.addEventListener('change', renderStudentsTable);
    
    const filterFinStatus = document.getElementById('filterFinancialStatus'); 
    if (filterFinStatus) filterFinStatus.addEventListener('change', renderStudentsTable);
    
    const finSearch = document.getElementById('financeSearchStudent'); 
    if (finSearch) finSearch.addEventListener('input', searchStudentForPayment);
    
    const finFilterClass = document.getElementById('financeFilterClass'); 
    if (finFilterClass) finFilterClass.addEventListener('change', searchStudentForPayment);
    
    // Close autocomplete when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('financeAutocomplete');
        const searchInput = document.getElementById('financeSearchStudent');
        if (dropdown && searchInput && !searchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });

    const gradSearch = document.getElementById('gradSearchStudent'); 
    if (gradSearch) gradSearch.addEventListener('input', searchGradStudent);
    
    const gradFilterClass = document.getElementById('gradFilterClass'); 
    if (gradFilterClass) gradFilterClass.addEventListener('change', searchGradStudent);
    
    const loadAttBtn = document.getElementById('loadAttendanceBtn'); 
    if (loadAttBtn) loadAttBtn.addEventListener('click', loadAttendanceStudents);
    
    const saveAttBtn = document.getElementById('saveAttendanceBtn'); 
    if (saveAttBtn) saveAttBtn.addEventListener('click', handleSaveAttendance);
    
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            if (!section) return;
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            const targetSection = document.getElementById(section + 'Section');
            if (targetSection) targetSection.classList.add('active');
            if (section === 'home') updateDashboard();
            if (section === 'students') renderStudentsTable();
            if (section === 'finance') { renderPaymentsTable(); renderExpensesTable(); }
            if (section === 'staff') renderStaffTable();
            if (section === 'graduated') renderGraduatedTable();
            if (section === 'archives') renderArchivesTable();
        });
    });
    
    const today = new Date().toISOString().split('T')[0];
    const attDate = document.getElementById('attendanceDate'); 
    if (attDate) attDate.value = today;
    const enrollDate = document.getElementById('enrollmentDate'); 
    if (enrollDate) enrollDate.value = today;
    const gradDate = document.getElementById('graduationDate'); 
    if (gradDate) gradDate.value = today;
}

// ==================== AUTHENTICATION ====================
function handleLogin(e) {
    e.preventDefault();
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value;
    const r = document.getElementById('loginRole').value;
    
    if (!u || !p || !r) {
        showMessage('❌ Please fill in all fields!', 'error', 'errorMessage');
        return;
    }

    toggleLoading('loginBtn', 'loginBtnText', 'loginSpinner', true);
    
    const hashedP = hashPassword(p);
    const user = allUsers.find(x => x.username === u && x.password === hashedP && x.role === r);
    
    setTimeout(() => {
        toggleLoading('loginBtn', 'loginBtnText', 'loginSpinner', false);
        if (user) {
            currentUser = user;
            localStorage.setItem('sms_currentUser', JSON.stringify(user));
            const welcomeMsg = document.getElementById('welcomeMessage');
            if (welcomeMsg) {
                welcomeMsg.style.display = 'block';
                setTimeout(() => { showDashboard(); welcomeMsg.style.display = 'none'; }, 1000);
            } else {
                showDashboard();
            }
        } else {
            showMessage('❌ Invalid credentials! Check username, password, and role.', 'error', 'errorMessage');
        }
    }, 800);
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('sms_currentUser');
    document.getElementById('loginForm').reset();
    const welcomeMsg = document.getElementById('welcomeMessage');
    if (welcomeMsg) welcomeMsg.style.display = 'none';
    showLoginPage();
}

function showDashboard() {
    const loginSec = document.getElementById('loginSection');
    const dashSec = document.getElementById('dashboardSection');
    if (loginSec) loginSec.style.display = 'none';
    if (dashSec) dashSec.style.display = 'flex';
    
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    const welcomeEl = document.getElementById('dashboardWelcome');
    if (userNameEl) userNameEl.textContent = currentUser.fullName;
    if (userRoleEl) userRoleEl.textContent = getRoleName(currentUser.role);
    if (welcomeEl) welcomeEl.textContent = `Welcome back, ${currentUser.fullName}!`;
    
    applyRolePermissions();
    updateDashboard();
}

function getRoleName(role) {
    const roles = {
        'manager': 'Administrator', 'finance': 'المحاسب',
        'teacher_class_omar': 'معلم - فصل عمر', 'teacher_class_abubakar': 'معلم - فصل ابوبكر',
        'teacher_class_khadija': 'معلم - فصل خديجة', 'teacher_class_hijaa1': 'معلم - فصل الهجاء الأول',
        'teacher_class_hijaa2': 'معلم - فصل الهجاء الثاني', 'teacher_class_tasis': 'معلم - فصل التأسيس'
    };
    return roles[role] || role;
}

function applyRolePermissions() {
    if (!currentUser) return;
    const role = currentUser.role;
    const permissions = currentUser.permissions || [];
    const menus = ['staffMenu', 'registrationMenu', 'studentsMenu', 'graduatedMenu', 'attendanceMenu', 'financeMenu', 'archivesMenu', 'reportsMenu', 'aboutMenu', 'settingsMenu'];
    menus.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
    document.body.classList.remove('teacher-view');
    
    if (role === 'manager') {
        menus.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'block'; });
    } else if (permissions.length > 0 && role !== 'finance' && !role.startsWith('teacher_')) {
        if (permissions.includes('students')) { document.getElementById('studentsMenu').style.display = 'block'; document.getElementById('registrationMenu').style.display = 'block'; }
        if (permissions.includes('finance')) document.getElementById('financeMenu').style.display = 'block';
        if (permissions.includes('attendance')) document.getElementById('attendanceMenu').style.display = 'block';
        if (permissions.includes('reports')) document.getElementById('reportsMenu').style.display = 'block';
        if (permissions.includes('graduated')) document.getElementById('graduatedMenu').style.display = 'block';
        if (permissions.includes('settings')) document.getElementById('settingsMenu').style.display = 'block';
        if (permissions.includes('archives')) document.getElementById('archivesMenu').style.display = 'block';
        document.getElementById('aboutMenu').style.display = 'block';
    } else if (role === 'finance') {
        ['studentsMenu', 'graduatedMenu', 'financeMenu', 'archivesMenu', 'reportsMenu', 'aboutMenu'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'block'; });
    } else if (role.startsWith('teacher_')) {
        document.body.classList.add('teacher-view');
        ['attendanceMenu', 'aboutMenu'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'block'; });
        const classMap = { 'teacher_class_omar': 'فصل عمر', 'teacher_class_abubakar': 'فصل ابوبكر', 'teacher_class_khadija': 'فصل خديجة', 'teacher_class_hijaa1': 'فصل الهجاء الأول', 'teacher_class_hijaa2': 'فصل الهجاء الثاني', 'teacher_class_tasis': 'فصل التأسيس' };
        const cls = classMap[role];
        const attClass = document.getElementById('attendanceClass');
        if (attClass && cls) { attClass.value = cls; attClass.disabled = true; }
    }
}

// ==================== STAFF MANAGEMENT ====================
function handleStaffSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('staffId').value;
    const fullName = document.getElementById('staffName').value.trim();
    const username = document.getElementById('staffUsername').value.trim();
    const password = document.getElementById('staffPassword').value;
    const role = document.getElementById('staffRole').value;
    
    if (!fullName || !username || !password || !role) {
        showMessage('❌ Please fill in all required fields!', 'error', 'staffMessage');
        return;
    }
    if (password.length < 4) {
        showMessage('❌ Password must be at least 4 characters!', 'error', 'staffMessage');
        return;
    }
    
    // Check duplicate username
    const duplicate = allUsers.find(u => u.username === username && u.id !== id);
    if (duplicate) {
        showMessage('❌ Username already exists!', 'error', 'staffMessage');
        return;
    }

    toggleLoading('saveStaffBtn', 'saveStaffText', 'saveStaffSpinner', true);

    const staffData = {
        fullName, username,
        password: hashPassword(password),
        role,
        salary: parseFloat(document.getElementById('staffSalary').value) || 0,
        phone: document.getElementById('staffPhone').value.trim(),
        permissions: [
            document.getElementById('perm_students').checked ? 'students' : null,
            document.getElementById('perm_finance').checked ? 'finance' : null,
            document.getElementById('perm_attendance').checked ? 'attendance' : null,
            document.getElementById('perm_reports').checked ? 'reports' : null,
            document.getElementById('perm_graduated').checked ? 'graduated' : null,
            document.getElementById('perm_settings').checked ? 'settings' : null,
            document.getElementById('perm_archives').checked ? 'archives' : null
        ].filter(p => p !== null)
    };

    setTimeout(() => {
        try {
            if (id) {
                const index = allUsers.findIndex(u => u.id === id);
                if (index !== -1) allUsers[index] = { ...allUsers[index], ...staffData };
                showMessage('✅ Staff updated successfully!', 'success', 'staffMessage');
            } else {
                staffData.id = generateUniqueId('USR');
                staffData.createdAt = new Date().toISOString();
                allUsers.push(staffData);
                showMessage('✅ Staff added successfully!', 'success', 'staffMessage');
            }
            saveUsers();
            renderStaffTable();
            document.getElementById('staffForm').reset();
            document.getElementById('staffId').value = '';
            document.getElementById('perm_students').checked = true;
        } catch (err) {
            showMessage('❌ Error saving staff!', 'error', 'staffMessage');
        }
        toggleLoading('saveStaffBtn', 'saveStaffText', 'saveStaffSpinner', false);
    }, 500);
}

function renderStaffTable() {
    const tbody = document.getElementById('staffTableBody');
    if (!tbody) return;
    try {
        tbody.innerHTML = allUsers.map(u => `
            <tr>
                <td>${u.fullName || 'N/A'}</td>
                <td>${u.username || 'N/A'}</td>
                <td>${getRoleName(u.role)}</td>
                <td><small>${(u.permissions || []).join(', ') || 'None'}</small></td>
                <td>$${u.salary || 0}</td>
                <td>
                    <button class="btn-edit" onclick="editStaff('${u.id}')">Edit</button>
                    ${u.role !== 'manager' ? `<button class="btn-danger" onclick="deleteStaff('${u.id}')" style="padding: 6px 12px; font-size: 12px;">Delete</button>` : ''}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Error loading data</td></tr>';
    }
}

function editStaff(id) {
    const u = allUsers.find(x => x.id === id);
    if (!u) return;
    document.getElementById('staffId').value = u.id;
    document.getElementById('staffName').value = u.fullName || '';
    document.getElementById('staffUsername').value = u.username || '';
    document.getElementById('staffPassword').value = ''; // Don't show hashed password
    document.getElementById('staffRole').value = u.role || '';
    document.getElementById('staffSalary').value = u.salary || 0;
    document.getElementById('staffPhone').value = u.phone || '';
    const perms = u.permissions || [];
    document.getElementById('perm_students').checked = perms.includes('students');
    document.getElementById('perm_finance').checked = perms.includes('finance');
    document.getElementById('perm_attendance').checked = perms.includes('attendance');
    document.getElementById('perm_reports').checked = perms.includes('reports');
    document.getElementById('perm_graduated').checked = perms.includes('graduated');
    document.getElementById('perm_settings').checked = perms.includes('settings');
    document.getElementById('perm_archives').checked = perms.includes('archives');
}

function deleteStaff(id) {
    if (confirm('⚠️ Are you sure you want to delete this staff member?')) {
        allUsers = allUsers.filter(u => u.id !== id);
        saveUsers();
        renderStaffTable();
        showMessage('✅ Staff deleted!', 'success', 'staffMessage');
    }
}

function cancelStaffEdit() {
    document.getElementById('staffForm').reset();
    document.getElementById('staffId').value = '';
    document.getElementById('perm_students').checked = true;
}

function saveUsers() { localStorage.setItem('sms_users', JSON.stringify(allUsers)); }

// ==================== STUDENT MANAGEMENT ====================
function toggleFeeInput() {
    const type = document.getElementById('studentType').value;
    const feeGroup = document.getElementById('feeInputGroup');
    if (feeGroup) feeGroup.style.display = type === 'Scholarship' ? 'none' : 'block';
}

function handleManualRegister(e) {
    e.preventDefault();
    const id = document.getElementById('studentId').value;
    const name = document.getElementById('studentName').value.trim();
    const age = parseInt(document.getElementById('studentAge').value);
    const phone = document.getElementById('guardianPhone').value.trim();
    const type = document.getElementById('studentType').value;
    
    // Validation
    if (age < 3 || age > 100) { showMessage('❌ Age must be between 3 and 100!', 'error', 'regMessage'); return; }
    if (!/^[0-9+\s-]{7,15}$/.test(phone)) { showMessage('❌ Invalid phone number!', 'error', 'regMessage'); return; }

    toggleLoading('saveStudentBtn', 'saveStudentText', 'saveStudentSpinner', true);

    const studentData = {
        name, age,
        gender: document.getElementById('studentGender').value,
        class: document.getElementById('studentClass').value,
        shift: document.getElementById('studentShift').value,
        type,
        requiredFee: type === 'Scholarship' ? 0 : (parseFloat(document.getElementById('studentFee').value) || settings.monthlyFee || 0),
        guardianName: document.getElementById('guardianName').value.trim(),
        guardianPhone: phone,
        enrollmentDate: document.getElementById('enrollmentDate').value,
        address: document.getElementById('studentAddress').value.trim()
    };

    setTimeout(() => {
        try {
            if (id) {
                const index = allStudents.findIndex(s => s.id === id);
                if (index !== -1) allStudents[index] = { ...allStudents[index], ...studentData };
                showMessage('✅ Student updated successfully!', 'success', 'regMessage');
            } else {
                // Check duplicate name in same class
                const duplicate = allStudents.find(s => s.name.toLowerCase() === name.toLowerCase() && s.class === studentData.class);
                if (duplicate) {
                    showMessage('⚠️ A student with this name already exists in this class!', 'error', 'regMessage');
                    toggleLoading('saveStudentBtn', 'saveStudentText', 'saveStudentSpinner', false);
                    return;
                }
                studentData.id = generateUniqueId('STU');
                studentData.createdAt = new Date().toISOString();
                allStudents.push(studentData);
                showMessage('✅ Student registered successfully!', 'success', 'regMessage');
            }
            saveStudents();
            document.getElementById('registrationForm').reset();
            document.getElementById('studentId').value = '';
            document.getElementById('enrollmentDate').value = new Date().toISOString().split('T')[0];
            toggleFeeInput();
            updateDashboard();
        } catch (err) {
            showMessage('❌ Error saving student!', 'error', 'regMessage');
        }
        toggleLoading('saveStudentBtn', 'saveStudentText', 'saveStudentSpinner', false);
    }, 500);
}

function renderStudentsTable() {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;
    const search = document.getElementById('searchStudents')?.value.toLowerCase() || '';
    const classF = document.getElementById('filterClass')?.value || '';
    const statusF = document.getElementById('filterFinancialStatus')?.value || '';
    
    let filtered = allStudents;
    if (search) filtered = filtered.filter(s => s.name.toLowerCase().includes(search) || (s.guardianPhone && s.guardianPhone.includes(search)));
    if (classF) filtered = filtered.filter(s => s.class === classF);
    if (statusF) filtered = filtered.filter(s => getFinancialStatus(s.id).status === statusF);
    
    tbody.innerHTML = filtered.length === 0 ? '<tr><td colspan="7" style="text-align:center;">No students found</td></tr>' : filtered.map(s => {
        const fin = getFinancialStatus(s.id);
        return `<tr>
            <td><strong>${s.name}</strong></td><td>${s.class}</td><td>${s.shift}</td>
            <td>${s.guardianName}</td><td>${s.guardianPhone}</td>
            <td class="finance-only"><span class="status-badge ${fin.class}">${fin.label}</span></td>
            <td>
                <button class="btn-edit" onclick="editStudent('${s.id}')">Edit</button>
                <button class="btn-danger" onclick="deleteStudent('${s.id}')" style="padding: 6px 12px; font-size: 12px;">Delete</button>
            </td>
        </tr>`;
    }).join('');
}

function editStudent(id) {
    const s = allStudents.find(st => st.id === id);
    if (!s) return;
    document.getElementById('studentId').value = s.id;
    document.getElementById('studentName').value = s.name;
    document.getElementById('studentAge').value = s.age;
    document.getElementById('studentGender').value = s.gender;
    document.getElementById('studentClass').value = s.class;
    document.getElementById('studentShift').value = s.shift;
    document.getElementById('studentType').value = s.type;
    document.getElementById('studentFee').value = s.requiredFee || settings.monthlyFee;
    document.getElementById('guardianName').value = s.guardianName;
    document.getElementById('guardianPhone').value = s.guardianPhone;
    document.getElementById('enrollmentDate').value = s.enrollmentDate;
    document.getElementById('studentAddress').value = s.address || '';
    toggleFeeInput();
}

function deleteStudent(id) {
    if (confirm('️ Are you sure? This will delete all related records.')) {
        allStudents = allStudents.filter(s => s.id !== id);
        allPayments = allPayments.filter(p => p.studentId !== id);
        allAttendance = allAttendance.filter(a => a.studentId !== id);
        saveStudents(); savePayments(); saveAttendanceData();
        renderStudentsTable(); updateDashboard();
        showMessage('✅ Student deleted!', 'success', 'regMessage');
    }
}

function getFinancialStatus(studentId) {
    const student = allStudents.find(s => s.id === studentId);
    if (!student) return { status: 'unpaid', label: 'N/A', class: 'status-unpaid' };
    const fee = student.requiredFee || settings.monthlyFee;
    if (student.type === 'Scholarship' || fee === 0) return { status: 'free', label: 'Scholarship', class: 'status-free' };
    const totalPaid = allPayments.filter(p => p.studentId === studentId).reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid >= fee) return { status: 'paid', label: 'Paid', class: 'status-paid' };
    if (totalPaid > 0) return { status: 'pending', label: `Pending ($${(fee - totalPaid).toFixed(2)})`, class: 'status-pending' };
    return { status: 'unpaid', label: 'Unpaid', class: 'status-unpaid' };
}

function saveStudents() { localStorage.setItem('sms_students', JSON.stringify(allStudents)); }
function cancelStudentEdit() {
    document.getElementById('registrationForm').reset();
    document.getElementById('studentId').value = '';
    document.getElementById('enrollmentDate').value = new Date().toISOString().split('T')[0];
    toggleFeeInput();
}

// ==================== GRADUATION ====================
function searchGradStudent() {
    const search = document.getElementById('gradSearchStudent').value.toLowerCase();
    const classF = document.getElementById('gradFilterClass').value;
    if (search.length < 1 && !classF) {
        document.getElementById('selectedGradStudent').style.display = 'none';
        document.getElementById('graduationForm').style.display = 'none';
        return;
    }
    let filtered = allStudents;
    if (classF) filtered = filtered.filter(s => s.class === classF);
    if (search.length >= 1) filtered = filtered.filter(s => s.name.toLowerCase().includes(search));
    
    if (filtered.length === 1) {
        const s = filtered[0];
        document.getElementById('gradStudentName').textContent = s.name;
        document.getElementById('gradStudentClass').textContent = s.class;
        document.getElementById('gradEnrollmentDate').textContent = s.enrollmentDate;
        document.getElementById('gradStudentId').value = s.id;
        document.getElementById('selectedGradStudent').style.display = 'block';
        document.getElementById('graduationForm').style.display = 'block';
    } else {
        document.getElementById('selectedGradStudent').style.display = 'none';
        document.getElementById('graduationForm').style.display = 'none';
    }
}

function handleGraduation(e) {
    e.preventDefault();
    const studentId = document.getElementById('gradStudentId').value;
    const student = allStudents.find(s => s.id === studentId);
    if (!student) { showMessage('❌ Student not found!', 'error', 'gradMessage'); return; }
    
    allGraduated.push({
        id: generateUniqueId('GRAD'), studentId,
        studentName: student.name, studentClass: student.class,
        graduationDate: document.getElementById('graduationDate').value,
        graduationLevel: document.getElementById('graduationLevel').value,
        notes: document.getElementById('graduationNotes').value,
        graduatedAt: new Date().toISOString(), graduatedBy: currentUser.username
    });
    
    allStudents = allStudents.filter(s => s.id !== studentId);
    saveGraduated(); saveStudents();
    showMessage('✅ Student marked as graduated!', 'success', 'gradMessage');
    document.getElementById('graduationForm').reset();
    document.getElementById('selectedGradStudent').style.display = 'none';
    document.getElementById('graduationForm').style.display = 'none';
    document.getElementById('gradSearchStudent').value = '';
    renderGraduatedTable(); updateDashboard();
}

function renderGraduatedTable() {
    const tbody = document.getElementById('graduatedTableBody');
    const noDataMsg = document.getElementById('noGraduatedMessage');
    if (!tbody) return;
    if (allGraduated.length === 0) { tbody.innerHTML = ''; if (noDataMsg) noDataMsg.style.display = 'block'; return; }
    if (noDataMsg) noDataMsg.style.display = 'none';
    tbody.innerHTML = allGraduated.map(g => `<tr>
        <td><strong>${g.studentName}</strong></td><td>${g.studentClass}</td>
        <td>${new Date(g.graduationDate).toLocaleDateString()}</td><td>${g.graduationLevel}</td>
        <td><button class="btn-danger" onclick="deleteGraduate('${g.id}')" style="padding: 6px 12px; font-size: 12px;">Delete</button></td>
    </tr>`).join('');
}

function deleteGraduate(id) {
    if (confirm('⚠️ Delete this graduation record?')) {
        allGraduated = allGraduated.filter(g => g.id !== id);
        saveGraduated(); renderGraduatedTable(); updateDashboard();
    }
}

function cancelGraduation() {
    document.getElementById('graduationForm').reset();
    document.getElementById('selectedGradStudent').style.display = 'none';
    document.getElementById('graduationForm').style.display = 'none';
    document.getElementById('gradSearchStudent').value = '';
}

function saveGraduated() { localStorage.setItem('sms_graduated', JSON.stringify(allGraduated)); }

// ==================== ATTENDANCE ====================
function loadAttendanceStudents() {
    const cls = document.getElementById('attendanceClass').value;
    const date = document.getElementById('attendanceDate').value;
    const shift = document.getElementById('attendanceShift').value;
    if (!cls || !date || !shift) { showMessage('Please select class, date, and shift!', 'error', 'attMessage'); return; }
    
    const students = allStudents.filter(s => s.class === cls && (s.shift === shift || s.shift === 'Full Time'));
    if (students.length === 0) { showMessage('No students found for this class and shift!', 'error', 'attMessage'); return; }
    
    document.getElementById('attendanceCard').style.display = 'block';
    document.getElementById('saveAttendanceActions').style.display = 'flex';
    const tbody = document.getElementById('attendanceTableBody');
    tbody.innerHTML = students.map(s => {
        const existing = allAttendance.find(a => a.studentId === s.id && a.date === date && a.shift === shift);
        const status = existing ? existing.status : '';
        return `<tr>
            <td><strong>${s.name}</strong></td><td>${s.class} (${shift})</td>
            <td>
                <div class="attendance-status">
                    <button class="status-btn present ${status === 'present' ? 'active' : ''}" onclick="markAttendance('${s.id}', 'present', this)">✅ Present</button>
                    <button class="status-btn absent ${status === 'absent' ? 'active' : ''}" onclick="markAttendance('${s.id}', 'absent', this)">❌ Absent</button>
                    <button class="status-btn late ${status === 'late' ? 'active' : ''}" onclick="markAttendance('${s.id}', 'late', this)">⏰ Late</button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function markAttendance(studentId, status, btn) {
    btn.parentElement.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    attendanceData[studentId] = status;
}

function handleSaveAttendance() {
    const date = document.getElementById('attendanceDate').value;
    const cls = document.getElementById('attendanceClass').value;
    const shift = document.getElementById('attendanceShift').value;
    if (Object.keys(attendanceData).length === 0) { showMessage('Please mark attendance first!', 'error', 'attMessage'); return; }
    
    Object.entries(attendanceData).forEach(([studentId, status]) => {
        allAttendance = allAttendance.filter(a => !(a.studentId === studentId && a.date === date && a.shift === shift));
        allAttendance.push({ studentId, date, class: cls, shift, status, markedBy: currentUser.username, markedAt: new Date().toISOString() });
    });
    
    saveAttendanceData(); attendanceData = {};
    showMessage(`✅ Attendance saved for ${shift}!`, 'success', 'attMessage');
    updateDashboard(); loadAttendanceStudents();
}

function saveAttendanceData() { localStorage.setItem('sms_attendance', JSON.stringify(allAttendance)); }

// ==================== FINANCE (WITH AUTOCOMPLETE) ====================
function searchStudentForPayment() {
    const input = document.getElementById('financeSearchStudent');
    const dropdown = document.getElementById('financeAutocomplete');
    const classF = document.getElementById('financeFilterClass').value;
    const query = input.value.toLowerCase().trim();
    
    dropdown.innerHTML = '';
    dropdown.style.display = 'none';
    
    if (query.length < 1 && !classF) {
        document.getElementById('financeSummaryBoxes').style.display = 'none';
        document.getElementById('paymentForm').style.display = 'none';
        return;
    }
    
    let filtered = allStudents;
    if (classF) filtered = filtered.filter(s => s.class === classF);
    if (query.length >= 1) filtered = filtered.filter(s => s.name.toLowerCase().includes(query));
    
    if (filtered.length > 0) {
        filtered.forEach(s => {
            const div = document.createElement('div');
            div.className = 'autocomplete-item';
            div.textContent = `${s.name} - ${s.class} (${s.shift})`;
            div.onclick = () => selectStudentForFinance(s);
            dropdown.appendChild(div);
        });
        dropdown.style.display = 'block';
    } else if (filtered.length === 0 && query.length >= 1) {
        // No results
    }
}

function selectStudentForFinance(s) {
    document.getElementById('financeAutocomplete').style.display = 'none';
    document.getElementById('financeSearchStudent').value = s.name;
    
    const fee = s.requiredFee || settings.monthlyFee;
    const totalPaid = allPayments.filter(p => p.studentId === s.id).reduce((sum, p) => sum + p.amount, 0);
    const outstanding = Math.max(0, fee - totalPaid);
    
    document.getElementById('finReqDisplay').textContent = `$${fee.toFixed(2)}`;
    document.getElementById('finPaidDisplay').textContent = `$${totalPaid.toFixed(2)}`;
    document.getElementById('finBalDisplay').textContent = `$${outstanding.toFixed(2)}`;
    
    document.getElementById('financeSummaryBoxes').style.display = 'grid';
    document.getElementById('paymentForm').style.display = 'block';
    document.getElementById('paymentStudentId').value = s.id;
}

function handlePayment(e) {
    e.preventDefault();
    const studentId = document.getElementById('paymentStudentId').value;
    const student = allStudents.find(s => s.id === studentId);
    if (!student) { showMessage(' Student not found!', 'error', 'payMessage'); return; }
    
    toggleLoading('savePaymentBtn', 'savePaymentText', 'savePaymentSpinner', true);
    
    const payment = {
        id: document.getElementById('paymentId').value || generateUniqueId('PAY'),
        studentId, studentName: student.name, studentClass: student.class,
        amount: parseFloat(document.getElementById('paymentAmount').value),
        method: document.getElementById('paymentMethod').value,
        month: document.getElementById('paymentMonth').value,
        date: new Date().toISOString(), receivedBy: currentUser.username
    };

    setTimeout(() => {
        const existingIndex = allPayments.findIndex(p => p.id === payment.id);
        if (existingIndex !== -1) {
            allPayments[existingIndex] = payment;
            showMessage('✅ Payment updated!', 'success', 'payMessage');
        } else {
            allPayments.push(payment);
            showMessage('✅ Payment recorded!', 'success', 'payMessage');
        }
        savePayments();
        document.getElementById('paymentForm').reset();
        document.getElementById('financeSummaryBoxes').style.display = 'none';
        document.getElementById('paymentForm').style.display = 'none';
        document.getElementById('paymentId').value = '';
        document.getElementById('financeSearchStudent').value = '';
        renderPaymentsTable(); updateDashboard();
        toggleLoading('savePaymentBtn', 'savePaymentText', 'savePaymentSpinner', false);
    }, 500);
}

function renderPaymentsTable() {
    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;
    tbody.innerHTML = [...allPayments].reverse().map(p => `<tr>
        <td>${new Date(p.date).toLocaleDateString()}</td><td><strong>${p.studentName}</strong></td>
        <td>${p.studentClass}</td><td>${p.month}</td>
        <td style="color: var(--success); font-weight: 700;">$${p.amount.toFixed(2)}</td><td>${p.method}</td>
        <td><button class="btn-danger" onclick="deletePayment('${p.id}')" style="padding: 6px 12px; font-size: 12px;">Delete</button></td>
    </tr>`).join('');
}

function deletePayment(id) {
    if (confirm('️ Delete this payment?')) {
        allPayments = allPayments.filter(p => p.id !== id);
        savePayments(); renderPaymentsTable(); updateDashboard();
    }
}

function cancelPaymentEdit() {
    document.getElementById('paymentForm').reset();
    document.getElementById('financeSummaryBoxes').style.display = 'none';
    document.getElementById('paymentForm').style.display = 'none';
    document.getElementById('paymentId').value = '';
}

function savePayments() { localStorage.setItem('sms_payments', JSON.stringify(allPayments)); }

// ==================== EXPENSES ====================
function handleExpense(e) {
    e.preventDefault();
    allExpenses.push({
        id: generateUniqueId('EXP'),
        category: document.getElementById('expenseCategory').value,
        amount: parseFloat(document.getElementById('expenseAmount').value),
        month: document.getElementById('expenseMonth').value,
        description: document.getElementById('expenseDescription').value,
        date: new Date().toISOString(), addedBy: currentUser.username
    });
    saveExpenses(); document.getElementById('expenseForm').reset();
    renderExpensesTable(); updateDashboard();
    showMessage('✅ Expense saved!', 'success', 'expenseMessage');
}

function renderExpensesTable() {
    const tbody = document.getElementById('expensesTableBody');
    if (!tbody) return;
    tbody.innerHTML = [...allExpenses].reverse().map(ex => `<tr>
        <td>${new Date(ex.date).toLocaleDateString()}</td><td>${ex.category}</td><td>${ex.description || '-'}</td>
        <td>${ex.month}</td><td style="color: var(--danger); font-weight: 700;">$${ex.amount.toFixed(2)}</td>
        <td><button class="btn-danger" onclick="deleteExpense('${ex.id}')" style="padding: 6px 12px; font-size: 12px;">Delete</button></td>
    </tr>`).join('');
}

function deleteExpense(id) {
    if (confirm('⚠️ Delete this expense?')) {
        allExpenses = allExpenses.filter(ex => ex.id !== id);
        saveExpenses(); renderExpensesTable(); updateDashboard();
    }
}

function saveExpenses() { localStorage.setItem('sms_expenses', JSON.stringify(allExpenses)); }

// ==================== ARCHIVES ====================
function handleArchive(e) {
    e.preventDefault();
    allArchives.push({
        id: generateUniqueId('ARC'),
        name: document.getElementById('archiveName').value,
        month: document.getElementById('archiveMonth').value,
        year: document.getElementById('archiveYear').value,
        createdDate: new Date().toISOString(),
        students: [...allStudents], payments: [...allPayments], expenses: [...allExpenses],
        attendance: [...allAttendance], graduated: [...allGraduated]
    });
    saveArchives(); renderArchivesTable();
    showMessage('✅ Archive created!', 'success', 'archiveMessage');
    document.getElementById('archiveForm').reset();
}

function renderArchivesTable() {
    const tbody = document.getElementById('archivesTableBody');
    const noDataMsg = document.getElementById('noArchivesMessage');
    if (!tbody) return;
    if (allArchives.length === 0) { tbody.innerHTML = ''; if (noDataMsg) noDataMsg.style.display = 'block'; return; }
    if (noDataMsg) noDataMsg.style.display = 'none';
    tbody.innerHTML = allArchives.map(arc => `<tr>
        <td><strong>${arc.name}</strong></td><td>${arc.month}</td><td>${arc.year}</td>
        <td>${new Date(arc.createdDate).toLocaleDateString()}</td>
        <td><button class="btn-danger" onclick="deleteArchive('${arc.id}')" style="padding: 6px 12px; font-size: 12px;">Delete</button></td>
    </tr>`).join('');
}

function deleteArchive(id) {
    if (confirm('⚠️ Delete this archive?')) {
        allArchives = allArchives.filter(a => a.id !== id);
        saveArchives(); renderArchivesTable();
    }
}

function saveArchives() { localStorage.setItem('sms_archives', JSON.stringify(allArchives)); }

// ==================== REPORTS ====================
function generateReport() {
    const type = document.getElementById('reportType').value;
    const cls = document.getElementById('reportClass').value;
    const month = document.getElementById('reportMonth').value;
    let html = `<h3>${type.toUpperCase()} REPORT</h3>`;
    if (cls) html += `<p><strong>Class:</strong> ${cls}</p>`;
    if (month) html += `<p><strong>Month:</strong> ${month}</p>`;
    html += `<hr style="margin: 15px 0; border-color: var(--border);">`;
    
    if (type === 'students') {
        let students = cls ? allStudents.filter(s => s.class === cls) : allStudents;
        html += `<table><thead><tr><th>Name</th><th>Class</th><th>Shift</th><th>Type</th><th>Status</th></tr></thead><tbody>`;
        students.forEach(s => { const fin = getFinancialStatus(s.id); html += `<tr><td>${s.name}</td><td>${s.class}</td><td>${s.shift}</td><td>${s.type}</td><td><span class="status-badge ${fin.class}">${fin.label}</span></td></tr>`; });
        html += `</tbody></table>`;
    } else if (type === 'finance') {
        let payments = allPayments;
        if (cls) payments = payments.filter(p => p.studentClass === cls);
        if (month) payments = payments.filter(p => p.month === month);
        const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
        let studentsInScope = cls ? allStudents.filter(s => s.class === cls) : allStudents;
        let totalRequired = studentsInScope.reduce((sum, s) => sum + (parseFloat(s.requiredFee) || settings.monthlyFee), 0);
        html += `<div class="finance-summary-grid">
            <div class="summary-box box-required"><span class="box-label">Total Required</span><strong class="box-value">$${totalRequired.toFixed(2)}</strong></div>
            <div class="summary-box box-paid"><span class="box-label">Total Collected</span><strong class="box-value">$${totalCollected.toFixed(2)}</strong></div>
            <div class="summary-box box-balance"><span class="box-label">Total Balance</span><strong class="box-value">$${Math.max(0, totalRequired - totalCollected).toFixed(2)}</strong></div>
        </div>`;
    } else if (type === 'attendance') {
        let students = cls ? allStudents.filter(s => s.class === cls) : allStudents;
        html += `<table><thead><tr><th>Student</th><th>Present</th><th>Absent</th><th>Late</th><th>Rate</th></tr></thead><tbody>`;
        students.forEach(s => {
            let studentAtt = allAttendance.filter(a => a.studentId === s.id);
            if (month) studentAtt = studentAtt.filter(a => new Date(a.date).toLocaleString('en-US', { month: 'long' }) === month);
            const p = studentAtt.filter(a => a.status === 'present').length;
            const a = studentAtt.filter(a => a.status === 'absent').length;
            const l = studentAtt.filter(a => a.status === 'late').length;
            const t = studentAtt.length;
            const r = t > 0 ? Math.round(((p + l) / t) * 100) : 0;
            html += `<tr><td><strong>${s.name}</strong></td><td style="color:var(--success)">${p}</td><td style="color:var(--danger)">${a}</td><td style="color:var(--warning)">${l}</td><td><strong>${r}%</strong></td></tr>`;
        });
        html += `</tbody></table>`;
    } else if (type === 'graduated') {
        let graduated = cls ? allGraduated.filter(g => g.studentClass === cls) : allGraduated;
        html += `<table><thead><tr><th>Name</th><th>Class</th><th>Graduation Date</th><th>Level</th></tr></thead><tbody>`;
        graduated.forEach(g => { html += `<tr><td><strong>${g.studentName}</strong></td><td>${g.studentClass}</td><td>${new Date(g.graduationDate).toLocaleDateString()}</td><td>${g.graduationLevel}</td></tr>`; });
        html += `</tbody></table><p style="margin-top: 20px;"><strong>Total Graduated:</strong> ${graduated.length}</p>`;
    }
    
    const content = document.getElementById('reportContent');
    if (content) { content.innerHTML = html; content.style.display = 'block'; }
}

function exportReportCSV() {
    const type = document.getElementById('reportType').value;
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    if (type === 'students') {
        csvContent += "Name,Class,Shift,Type,Status\n";
        allStudents.forEach(s => { const fin = getFinancialStatus(s.id); csvContent += `"${s.name}","${s.class}","${s.shift}","${s.type}","${fin.label}"\n`; });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `report_${type}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

// ==================== SETTINGS & BACKUP ====================
function handleSettingsSave(e) {
    e.preventDefault();
    settings.schoolName = document.getElementById('settingSchoolName').value.trim();
    settings.monthlyFee = parseFloat(document.getElementById('settingMonthlyFee').value) || 0;
    localStorage.setItem('sms_settings', JSON.stringify(settings));
    applySettings();
    showMessage('✅ Settings saved!', 'success', 'settingsMessage');
}

function toggleDarkMode() {
    settings.darkMode = !settings.darkMode;
    localStorage.setItem('sms_settings', JSON.stringify(settings));
    applySettings();
}

function exportAllData() {
    const data = { students: allStudents, users: allUsers, payments: allPayments, expenses: allExpenses, attendance: allAttendance, graduated: allGraduated, archives: allArchives, settings: settings, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `school_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
    showMessage('✅ Backup downloaded!', 'success', 'settingsMessage');
}

function importAllData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!confirm('⚠️ This will replace all current data. Continue?')) return;
            if (data.students) allStudents = data.students;
            if (data.users) allUsers = data.users;
            if (data.payments) allPayments = data.payments;
            if (data.expenses) allExpenses = data.expenses;
            if (data.attendance) allAttendance = data.attendance;
            if (data.graduated) allGraduated = data.graduated;
            if (data.archives) allArchives = data.archives;
            if (data.settings) settings = data.settings;
            saveStudents(); saveUsers(); savePayments(); saveExpenses(); saveAttendanceData(); saveGraduated(); saveArchives();
            localStorage.setItem('sms_settings', JSON.stringify(settings));
            applySettings();
            alert('✅ Data restored successfully! Reloading...');
            location.reload();
        } catch (err) { alert('❌ Invalid backup file!'); }
    };
    reader.readAsText(file);
}

function clearAllData() {
    if (confirm('️ WARNING: This will delete ALL data permanently. Are you sure?')) {
        if (confirm('This cannot be undone. Click OK to confirm.')) {
            localStorage.clear(); location.reload();
        }
    }
}

// ==================== DASHBOARD & CHARTS ====================
function updateDashboard() {
    const totalStudentsEl = document.getElementById('totalStudents');
    const todayAttendanceEl = document.getElementById('todayAttendance');
    const totalRequirementsEl = document.getElementById('totalRequirements');
    const totalCollectedEl = document.getElementById('totalCollected');
    const pendingFeesEl = document.getElementById('pendingFees');
    const totalGraduatedEl = document.getElementById('totalGraduated');
    
    if (totalStudentsEl) totalStudentsEl.textContent = allStudents.length;
    if (totalGraduatedEl) totalGraduatedEl.textContent = allGraduated.length;
    
    const today = new Date().toISOString().split('T')[0];
    const todayPresent = allAttendance.filter(a => a.date === today && a.status === 'present').length;
    if (todayAttendanceEl) todayAttendanceEl.textContent = todayPresent;
    
    const totalRequirements = allStudents.reduce((sum, s) => sum + (parseFloat(s.requiredFee) || 0), 0);
    const totalCollected = allPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const pendingFees = Math.max(0, totalRequirements - totalCollected);
    
    if (totalRequirementsEl) totalRequirementsEl.textContent = '$' + totalRequirements.toFixed(2);
    if (totalCollectedEl) totalCollectedEl.textContent = '$' + totalCollected.toFixed(2);
    if (pendingFeesEl) pendingFeesEl.textContent = '$' + pendingFees.toFixed(2);
    
    renderCharts();
}

function renderCharts() {
    // Attendance Chart
    const attCtx = document.getElementById('attendanceChart');
    if (attCtx) {
        try {
            if (window.attChart) window.attChart.destroy();
            const labels = [], data = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(); d.setDate(d.getDate() - i);
                labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
                data.push(allAttendance.filter(a => a.date === d.toISOString().split('T')[0] && a.status === 'present').length);
            }
            window.attChart = new Chart(attCtx, {
                type: 'line', data: { labels, datasets: [{ label: 'Present', data, borderColor: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.1)', fill: true, tension: 0.4 }] },
                options: { responsive: true, maintainAspectRatio: false }
            });
        } catch (error) { console.error('Chart error:', error); }
    }
    
    // Finance Chart
    const finCtx = document.getElementById('financeChart');
    if (finCtx) {
        try {
            if (window.finChart) window.finChart.destroy();
            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            const data = months.map(m => allPayments.filter(p => p.month === m).reduce((sum, p) => sum + p.amount, 0));
            window.finChart = new Chart(finCtx, {
                type: 'bar', data: { labels: months, datasets: [{ label: 'Income ($)', data, backgroundColor: '#2563eb', borderRadius: 5 }] },
                options: { responsive: true, maintainAspectRatio: false }
            });
        } catch (error) { console.error('Chart error:', error); }
    }
}
