// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const switchTabLinks = document.querySelectorAll('.switch-tab');
const authForms = document.querySelector('.auth-forms');
const profileSection = document.getElementById('profileSection');
const logoutBtn = document.getElementById('logoutBtn');
const editProfileBtn = document.getElementById('editProfileBtn');

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    setupEventListeners();
    initializeTabs();
});

// Check authentication status
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
        // User is logged in, show profile
        const user = JSON.parse(userData);
        showProfile(user);
    } else {
        // User is not logged in, show auth forms
        showAuthForms();
    }
}

// Show authentication forms
function showAuthForms() {
    authForms.style.display = 'block';
    profileSection.style.display = 'none';
}

// Show user profile
function showProfile(user) {
    authForms.style.display = 'none';
    profileSection.style.display = 'block';
    
    // Update profile information
    document.getElementById('userName').textContent = user.full_name || user.username;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('profileName').textContent = user.full_name || user.username;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('profilePhone').textContent = user.phone || 'Chưa cập nhật';
    
    // Set join date if available
    const joinDate = user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN');
    document.getElementById('joinDate').textContent = joinDate;
    
    // Update avatar if available
    if (user.avatar) {
        document.getElementById('userAvatar').src = user.avatar;
    }
}

// Password strength checker
function checkPasswordStrength(password) {
    let strength = 0;
    let feedback = '';
    let color = '#e74c3c'; // Red
    
    // Length check
    if (password.length >= 8) strength += 1;
    
    // Contains numbers
    if (/\d/.test(password)) strength += 1;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 1;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 1;
    
    // Contains special chars
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    // Determine feedback
    if (strength <= 1) {
        feedback = 'Rất yếu';
        color = '#e74c3c';
    } else if (strength <= 2) {
        feedback = 'Yếu';
        color = '#e67e22';
    } else if (strength <= 3) {
        feedback = 'Trung bình';
        color = '#f39c12';
    } else if (strength <= 4) {
        feedback = 'Mạnh';
        color = '#27ae60';
    } else {
        feedback = 'Rất mạnh';
        color = '#2ecc71';
    }
    
    return { strength, feedback, color };
}

// Toggle password visibility
function togglePasswordVisibility(input, button) {
    const icon = button.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        button.setAttribute('aria-label', 'Ẩn mật khẩu');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        button.setAttribute('aria-label', 'Hiển thị mật khẩu');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form submission
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Edit profile button
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', handleEditProfile);
    }
    
    // Forgot password link
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', handleForgotPassword);
    }
    
    // Toggle password visibility
    document.querySelectorAll('.toggle-password').forEach(button => {
        const input = button.previousElementSibling;
        button.addEventListener('click', () => togglePasswordVisibility(input, button));
    });
    
    // Password strength meter
    const passwordInput = document.getElementById('register-password');
    const confirmPasswordInput = document.getElementById('register-confirm-password');
    const passwordMatch = document.querySelector('.password-match');
    
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            const password = e.target.value;
            if (password.length > 0) {
                const { feedback, color } = checkPasswordStrength(password);
                const strengthIndicator = document.querySelector('.strength-indicator');
                if (strengthIndicator) {
                    strengthIndicator.textContent = feedback;
                    strengthIndicator.style.color = color;
                }
            } else {
                document.querySelector('.strength-indicator').textContent = 'Yếu';
                document.querySelector('.strength-indicator').style.color = '#e74c3c';
            }
            
            // Check if passwords match
            if (confirmPasswordInput && confirmPasswordInput.value) {
                if (password === confirmPasswordInput.value) {
                    passwordMatch.style.display = 'block';
                    confirmPasswordInput.setCustomValidity('');
                } else {
                    passwordMatch.style.display = 'none';
                    confirmPasswordInput.setCustomValidity('Mật khẩu không khớp');
                }
            }
        });
    }
    
    // Confirm password validation
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', (e) => {
            const password = passwordInput ? passwordInput.value : '';
            const confirmPassword = e.target.value;
            
            if (confirmPassword.length > 0) {
                if (password === confirmPassword) {
                    passwordMatch.style.display = 'block';
                    e.target.setCustomValidity('');
                } else {
                    passwordMatch.style.display = 'none';
                    e.target.setCustomValidity('Mật khẩu không khớp');
                }
            } else {
                passwordMatch.style.display = 'none';
                e.target.setCustomValidity('');
            }
        });
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Đăng nhập thất bại');
        }
        
        // Save token and user data to localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        // Show success message
        await Swal.fire({
            icon: 'success',
            title: 'Thành công',
            text: 'Đăng nhập thành công!',
            timer: 1500,
            showConfirmButton: false
        });
        
        // Show profile and update UI
        showProfile(data.user);
        
        // Update header if it exists on the page
        updateHeaderAuthState(true);
        
    } catch (error) {
        console.error('Login error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Lỗi',
            text: error.message || 'Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.'
        });
    }
}

// Handle registration
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
        Swal.fire({
            icon: 'error',
            title: 'Lỗi',
            text: 'Mật khẩu xác nhận không khớp!'
        });
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: email.split('@')[0],
                email,
                password,
                full_name: name,
                phone
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Đăng ký thất bại');
        }
        
        // Auto login after successful registration
        const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const loginData = await loginResponse.json();
        
        if (!loginResponse.ok) {
            throw new Error(loginData.message || 'Đăng nhập tự động thất bại');
        }
        
        // Save token and user data to localStorage
        localStorage.setItem('token', loginData.token);
        localStorage.setItem('userData', JSON.stringify(loginData.user));
        
        // Show success message
        await Swal.fire({
            icon: 'success',
            title: 'Thành công',
            text: 'Đăng ký và đăng nhập thành công!',
            timer: 1500,
            showConfirmButton: false
        });
        
        // Show profile and update UI
        showProfile(loginData.user);
        
        // Update header if it exists on the page
        updateHeaderAuthState(true);
        
    } catch (error) {
        console.error('Registration error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Lỗi',
            text: error.message || 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.'
        });
    }
}

// Handle logout
function handleLogout() {
    // Remove token and user data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    
    // Show auth forms
    showAuthForms();
    
    // Show success message
    Swal.fire({
        icon: 'success',
        title: 'Đã đăng xuất',
        text: 'Bạn đã đăng xuất thành công!',
        timer: 1500,
        showConfirmButton: false
    });
    
    // Update header if it exists on the page
    updateHeaderAuthState(false);
    
    // Reset form fields
    if (loginForm) loginForm.reset();
    if (registerForm) registerForm.reset();
    
    // Switch to login tab
    switchTab('login');
}

// Handle edit profile
function handleEditProfile() {
    // In a real app, this would open an edit profile modal or redirect to an edit page
    Swal.fire({
        icon: 'info',
        title: 'Chức năng đang phát triển',
        text: 'Tính năng chỉnh sửa thông tin sẽ sớm có sẵn!',
        confirmButtonText: 'Đóng'
    });
}

// Handle forgot password
function handleForgotPassword(e) {
    e.preventDefault();
    
    Swal.fire({
        title: 'Đặt lại mật khẩu',
        html: 'Vui lòng nhập địa chỉ email của bạn để nhận liên kết đặt lại mật khẩu.',
        input: 'email',
        inputPlaceholder: 'Email của bạn',
        showCancelButton: true,
        confirmButtonText: 'Gửi yêu cầu',
        cancelButtonText: 'Hủy',
        showLoaderOnConfirm: true,
        preConfirm: async (email) => {
            try {
                // In a real app, this would call your backend API
                // For now, we'll simulate a successful request
                await new Promise(resolve => setTimeout(resolve, 1500));
                return { success: true };
            } catch (error) {
                Swal.showValidationMessage(`Yêu cầu thất bại: ${error}`);
                return null;
            }
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        if (result.isConfirmed && result.value && result.value.success) {
            Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Vui lòng kiểm tra email của bạn để đặt lại mật khẩu.',
                timer: 3000,
                showConfirmButton: false
            });
        }
    });
}

// Initialize tabs
function initializeTabs() {
    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Switch tab links
    switchTabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
}

// Switch between tabs
function switchTab(tabId) {
    // Update active tab button
    tabButtons.forEach(button => {
        if (button.getAttribute('data-tab') === tabId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // Show active tab content
    tabContents.forEach(content => {
        if (content.id === tabId) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
    
    // Scroll to top of forms
    authForms.scrollIntoView({ behavior: 'smooth' });
}

// Update header auth state (if header exists on the page)
function updateHeaderAuthState(isLoggedIn) {
    const authElements = document.querySelectorAll('.auth-element');
    const userElements = document.querySelectorAll('.user-element');
    
    authElements.forEach(el => {
        el.style.display = isLoggedIn ? 'none' : 'block';
    });
    
    userElements.forEach(el => {
        el.style.display = isLoggedIn ? 'block' : 'none';
    });
    
    // Update user info in header if available
    if (isLoggedIn) {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const userGreeting = document.getElementById('userGreeting');
        const userAvatar = document.getElementById('headerUserAvatar');
        
        if (userGreeting) {
            userGreeting.textContent = `Xin chào, ${userData.full_name || userData.username || 'Khách'}`;
        }
        
        if (userAvatar && userData.avatar) {
            userAvatar.src = userData.avatar;
        }
    }
}

// Initialize any other page-specific functionality
function initPage() {
    // Check if we should show a specific tab from URL hash
    const hash = window.location.hash.substring(1);
    if (hash === 'register') {
        switchTab('register');
    }
    
    // Add any other page initialization code here
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', initPage);

// Make functions available globally for debugging
window.auth = {
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    switchTab
};