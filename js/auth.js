// Authentication Functions
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication state
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in
            console.log('User signed in:', user.email);
            updateUIForUser(user);
        } else {
            // User is signed out
            console.log('User signed out');
            updateUIForGuest();
        }
    });
    
    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            firebase.auth().signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // Signed in
                    alert('Login successful!');
                    document.getElementById('loginModal').style.display = 'none';
                })
                .catch((error) => {
                    alert('Login error: ' + error.message);
                });
        });
    }
    
    // Register form submission
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const name = document.getElementById('registerName').value;
            
            firebase.auth().createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // User created
                    const user = userCredential.user;
                    
                    // Save additional user data
                    return db.collection('users').doc(user.uid).set({
                        name: name,
                        email: email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        phone: '',
                        address: ''
                    });
                })
                .then(() => {
                    alert('Registration successful!');
                    window.location.href = 'index.html';
                })
                .catch((error) => {
                    alert('Registration error: ' + error.message);
                });
        });
    }
});

function updateUIForUser(user) {
    const userProfileElements = document.querySelectorAll('.user-profile');
    userProfileElements.forEach(element => {
        const avatar = element.querySelector('.user-avatar');
        const nameSpan = element.querySelector('span');
        
        if (avatar) {
            avatar.textContent = user.email.charAt(0).toUpperCase();
        }
        if (nameSpan) {
            nameSpan.textContent = user.email.split('@')[0];
        }
    });
}

function updateUIForGuest() {
    const userProfileElements = document.querySelectorAll('.user-profile');
    userProfileElements.forEach(element => {
        const avatar = element.querySelector('.user-avatar');
        const nameSpan = element.querySelector('span');
        
        if (avatar) {
            avatar.textContent = 'G';
        }
        if (nameSpan) {
            nameSpan.textContent = 'Guest';
        }
    });
}

function logout() {
    firebase.auth().signOut()
        .then(() => {
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error('Logout error:', error);
        });
}