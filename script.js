const firebaseConfig = {
    apiKey: "AIzaSyBjq2FvfW76fCF-pfZSAtvHUvQZkJ47RXI",
    authDomain: "noteshare-f6ea3.firebaseapp.com",
    databaseURL: "https://noteshare-f6ea3-default-rtdb.firebaseio.com",
    projectId: "noteshare-f6ea3",
    storageBucket: "noteshare-f6ea3.firebasestorage.app",
    messagingSenderId: "701972757970",
    appId: "1:701972757970:web:8a2296c96639c7b087dc0b",
    measurementId: "G-ZNXPHYRGR0"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

let currentUserProfile = null;
let publicNotesGrid = null;
let privateNotesGrid = null;
let domIsLoaded = false;

function getUrlParameter(name) {
    name = name.replace(/[\\[]/, '\\\\[').replace(/[\\]]/, '\\\\]');
    var regex = new RegExp('[\\\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Function to delete a note (MOVED TO GLOBAL SCOPE)
function deleteNote(noteId) {
    db.collection('notes').doc(noteId).delete()
        .then(() => {
            alert('Note deleted successfully!');
            const user = auth.currentUser;
            if (user) {
                fetchAndDisplayNotes(user);
            } else {
                // Refresh public notes if no user is logged in
                fetchAndDisplayNotes(null);
            }
        })
        .catch(error => {
            console.error('Error removing note: ', error);
            alert('Error deleting note: ' + error.message);
        });
}

function renderNotes(snapshot, gridElement, user) {
    gridElement.innerHTML = '';
    if (snapshot.empty) {
        const isPublicContext = gridElement.id === 'publicNotesGrid';
        gridElement.innerHTML = `<p>No ${isPublicContext ? 'public' : 'private'} notes available yet.</p>`;
    }
    snapshot.forEach(doc => {
        const note = doc.data();
        const noteId = doc.id;
        const noteElement = document.createElement('div');
        noteElement.classList.add('note-card');

        const isAnonymous = note.isAnonymous === true;
        const displayAuthor = isAnonymous ? 'Anonymous' : (note.authorUsername || note.authorEmail || 'Unknown User');

        const displayContent = note.content.length > 150 ? note.content.substring(0, 150) + '...' : note.content;

        // Check for 'user' and 'note.userId' before rendering edit/delete buttons
        noteElement.innerHTML = `
            <h3>${note.title}</h3>
            <p>${displayContent}</p>
            <p class="note-tags">Tags: ${note.tags ? note.tags.join(', ') : 'None'}</p>
            <p class="note-info">Last Updated: ${note.timestamp ? new Date(note.timestamp.toDate()).toLocaleString() : 'N/A'}</p>
            <p class="note-author">Author: ${displayAuthor}</p>
            <div class="note-actions">
                <a href="view_note.html?id=${noteId}" class="view-note-btn">View</a>
                ${!isAnonymous && user && note.userId === user.uid ? `<a href="edit_note.html?id=${noteId}" class="edit-note-btn">Edit</a>` : ''}
                ${!isAnonymous && user && note.userId === user.uid ? `<button class="delete-note-btn" data-id="${noteId}">Delete</button>` : ''}
            </div>
        `;
        gridElement.appendChild(noteElement);
    });

    gridElement.querySelectorAll('.delete-note-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const noteIdToDelete = event.target.dataset.id;
            if (confirm('Are you sure you want to delete this note?')) {
                deleteNote(noteIdToDelete);
            }
        });
    });
}


async function fetchAndDisplayNotes(user, searchTerm = '') {
    // Ensure DOM elements are ready before trying to access them
    if (!domIsLoaded || !publicNotesGrid || !privateNotesGrid) {
        console.warn('DOM not fully loaded or grids not initialized yet. Deferring fetchAndDisplayNotes.');
        return;
    }

    if (publicNotesGrid) publicNotesGrid.innerHTML = '';
    if (privateNotesGrid) privateNotesGrid.innerHTML = '';
    const tagsList = document.querySelector('.tags-list');

    let publicNotesQuery = db.collection('notes')
        .where('visibility', '==', 'public');

    let privateNotesQuery; // Initialize only if user is logged in

    if (user) { // Only set up privateNotesQuery if a user is provided
        privateNotesQuery = db.collection('notes')
            .where('userId', '==', user.uid)
            .where('visibility', '==', 'private');
    }


    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    if (searchTerm) {
        publicNotesQuery = publicNotesQuery.where('tags', 'array-contains', lowerCaseSearchTerm)
                                         .orderBy('timestamp', 'desc');
        // Only apply search to private query if it exists
        if (privateNotesQuery) {
            privateNotesQuery = privateNotesQuery.where('tags', 'array-contains', lowerCaseSearchTerm)
                                                .orderBy('timestamp', 'desc');
        }
    } else {
        publicNotesQuery = publicNotesQuery.orderBy('timestamp', 'desc');
        // Only apply ordering to private query if it exists
        if (privateNotesQuery) {
            privateNotesQuery = privateNotesQuery.orderBy('timestamp', 'desc');
        }
    }

    try {
        const publicSnapshot = await publicNotesQuery.get();
        let filteredPublicNotes = [];
        publicSnapshot.forEach(doc => {
            const note = doc.data();
            const matchesSearch = searchTerm ?
                (note.title && note.title.toLowerCase().includes(lowerCaseSearchTerm)) ||
                (note.tags && note.tags.some(tag => tag.toLowerCase().includes(lowerCaseSearchTerm))) :
                true;
            if (matchesSearch) {
                filteredPublicNotes.push(doc);
            }
        });
        renderNotes({ forEach: callback => filteredPublicNotes.forEach(callback), empty: filteredPublicNotes.length === 0 }, publicNotesGrid, user);


        if (user && privateNotesQuery) { // Only fetch private notes if 'user' is not null AND privateNotesQuery was set up
            const privateSnapshot = await privateNotesQuery.get();
            let filteredPrivateNotes = [];
            privateSnapshot.forEach(doc => {
                const note = doc.data();
                const matchesSearch = searchTerm ?
                    (note.title && note.title.toLowerCase().includes(lowerCaseSearchTerm)) ||
                    (note.tags && note.tags.some(tag => tag.toLowerCase().includes(lowerCaseSearchTerm))) :
                    true;
                if (matchesSearch) {
                    filteredPrivateNotes.push(doc);
                }
            });
            renderNotes({ forEach: callback => filteredPrivateNotes.forEach(callback), empty: filteredPrivateNotes.length === 0 }, privateNotesGrid, user);
        } else if (privateNotesGrid) {
            // If no user or privateNotesQuery was not set, clear private notes grid
            privateNotesGrid.innerHTML = '<p>Please log in to view your private notes.</p>';
        }


        const allTags = new Set();
        publicSnapshot.forEach(doc => {
            const note = doc.data();
            if (note.tags && Array.isArray(note.tags)) {
                note.tags.forEach(tag => allTags.add(tag.trim()));
            }
        });

        if (user) {
            // Re-fetch private notes specifically for tags, as the main query might be filtered.
            // Or ideally, get tags from filteredPrivateNotes if you have them.
            // For simplicity and correctness with current logic, re-query.
            const privateTagsSnapshot = await db.collection('notes')
                .where('userId', '==', user.uid)
                .where('visibility', '==', 'private')
                .get();
            privateTagsSnapshot.forEach(doc => {
                const note = doc.data();
                if (note.tags && Array.isArray(note.tags)) {
                    note.tags.forEach(tag => allTags.add(tag.trim()));
                }
            });
        }

        if (tagsList) {
            tagsList.innerHTML = '';
            allTags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.classList.add('tag-btn');
                tagElement.textContent = tag;
                tagElement.addEventListener('click', () => {
                    document.getElementById('noteSearchInput').value = tag;
                    fetchAndDisplayNotes(user, tag);
                });
                tagsList.appendChild(tagElement);
            });
        }


    } catch (error) {
        console.error("Error fetching notes:", error);
        alert("Error loading notes: " + error.message);
    }
}


auth.onAuthStateChanged(async (user) => {
    if (user) {
        console.log('User signed in:', user.email, user.uid);
        const userInfoElement = document.querySelector('.user-info');

        const userDocRef = db.collection('users').doc(user.uid);
        const userDoc = await userDocRef.get();
        let displayUserName = user.email;

        if (userDoc.exists) {
            currentUserProfile = userDoc.data();
            displayUserName = currentUserProfile.username || user.email;
        } else {
            console.warn("User profile not found in Firestore for UID:", user.uid);
            currentUserProfile = {
                email: user.email,
                username: user.email.split('@')[0],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            await userDocRef.set(currentUserProfile, { merge: true });
        }

        if (userInfoElement) {
            userInfoElement.textContent = `Welcome, ${displayUserName}!`;
        }
        // Call fetchAndDisplayNotes ONLY when auth state is known AND DOM is ready
        if (domIsLoaded) {
            fetchAndDisplayNotes(user);
        }
    } else {
        currentUserProfile = null;
        console.log('User signed out');
        if (window.location.pathname.includes('dashboard.html') ||
            window.location.pathname.includes('create_note.html') ||
            window.location.pathname.includes('edit_note.html') ||
            window.location.pathname.includes('view_note.html')) {
            window.location.href = 'index.html';
        }
        // Call fetchAndDisplayNotes with null user to display public notes ONLY when DOM is ready
        if (domIsLoaded) {
            fetchAndDisplayNotes(null);
        }
    }
});


document.addEventListener('DOMContentLoaded', function () {
    publicNotesGrid = document.getElementById('publicNotesGrid');
    privateNotesGrid = document.getElementById('privateNotesGrid');
    domIsLoaded = true;

    // IMPORTANT: Removed the direct call to fetchAndDisplayNotes from here.
    // It is now handled exclusively by auth.onAuthStateChanged
    // to ensure the user's authentication state is fully determined before fetching notes.

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const email = loginForm.elements.username.value;
            const password = loginForm.elements.password.value;

            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    alert('Logged in successfully!');
                    window.location.href = 'dashboard.html';
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    alert(`Login failed: ${errorMessage}`);
                    console.error("Login Error:", errorCode, errorMessage);
                });
        });
    }

    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const email = signupForm.elements.email.value;
            const username = signupForm.elements.username.value;
            const password = signupForm.elements.password.value;
            const confirmPassword = signupForm.elements.confirmPassword.value;

            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }

            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                await db.collection('users').doc(user.uid).set({
                    email: user.email,
                    username: username,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                alert('Account created successfully! Please log in.');
                window.location.href = 'index.html';
            } catch (error) {
                const errorCode = error.code;
                const errorMessage = error.message;
                alert(`Signup failed: ${errorMessage}`);
                console.error("Signup Error:", errorCode, errorMessage);
            }
        });
    }

    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (event) {
            event.preventDefault();
            auth.signOut().then(() => {
                alert("Logged out successfully!");
                window.location.href = 'index.html';
            }).catch((error) => {
                console.error("Logout Error:", error);
                alert("Error logging out: " + error.message);
            });
        });
    }

    const dashboardBtn = document.querySelector('.back-to-dashboard-btn');
    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', function (event) {
            event.preventDefault();
            window.location.href = 'dashboard.html';
        });
    }

    const noteSearchForm = document.getElementById('noteSearchForm');
    if (noteSearchForm) {
        noteSearchForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const searchTerm = document.getElementById('noteSearchInput').value.trim();
            const user = auth.currentUser; // auth.currentUser might still be null here, but fetchAndDisplayNotes handles it if DOM is loaded
            if (user) {
                fetchAndDisplayNotes(user, searchTerm);
            } else {
                fetchAndDisplayNotes(null, searchTerm);
            }
        });
    }


    const createNoteForm = document.getElementById('createNoteForm');
    if (createNoteForm) {
        createNoteForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const user = auth.currentUser;
            if (!user) {
                alert('You must be logged in to create a note.');
                return;
            }

            const authorUsername = currentUserProfile ? currentUserProfile.username : user.email.split('@')[0];

            const title = document.getElementById('noteTitle').value;
            const content = document.getElementById('noteContent').value;
            const tags = document.getElementById('noteTags').value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
            const visibility = document.getElementById('noteVisibility').value;
            const isAnonymous = document.getElementById('postAnonymouslyCheckbox')?.checked || false;

            db.collection('notes').add({
                title: title,
                content: content,
                tags: tags,
                visibility: visibility,
                userId: user.uid,
                authorEmail: user.email,
                authorUsername: authorUsername,
                isAnonymous: isAnonymous,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            })
                .then(() => {
                    alert('Note created successfully!');
                    window.location.href = 'dashboard.html';
                })
                .catch(error => {
                    console.error('Error adding document: ', error);
                    alert('Error creating note: ' + error.message);
                });
        });
    }

    const editNoteForm = document.getElementById('editNoteForm');
    if (editNoteForm) {
        const noteId = getUrlParameter('id');
        if (noteId) {
            db.collection('notes').doc(noteId).get()
                .then(doc => {
                    if (doc.exists) {
                        const note = doc.data();
                        document.getElementById('editNoteTitle').value = note.title;
                        document.getElementById('editNoteContent').value = note.content;
                        document.getElementById('editNoteTags').value = note.tags ? note.tags.join(', ') : '';
                        document.getElementById('editNoteVisibility').value = note.visibility;
                    } else {
                        alert('Note not found!');
                        window.location.href = 'dashboard.html';
                    }
                })
                .catch(error => {
                    console.error('Error getting note for editing: ', error);
                    alert('Error loading note: ' + error.message);
                });

            editNoteForm.addEventListener('submit', function (event) {
                event.preventDefault();
                const title = document.getElementById('editNoteTitle').value;
                const content = document.getElementById('editNoteContent').value;
                const tags = document.getElementById('editNoteTags').value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
                const visibility = document.getElementById('editNoteVisibility').value;

                db.collection('notes').doc(noteId).update({
                    title: title,
                    content: content,
                    tags: tags,
                    visibility: visibility,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                })
                    .then(() => {
                        alert('Note updated successfully!');
                        window.location.href = 'dashboard.html';
                    })
                    .catch(error => {
                        console.error('Error updating note: ', error);
                        alert('Error updating note: ' + error.message);
                    });
            });
        } else {
            alert('No note ID provided for editing.');
            window.location.href = 'dashboard.html';
        }
    }

    const viewNoteSection = document.querySelector('.view-note-section');
    if (viewNoteSection) {
        const noteId = getUrlParameter('id');
        if (noteId) {
            db.collection('notes').doc(noteId).get()
                .then(doc => {
                    if (doc.exists) {
                        const note = doc.data();
                        document.getElementById('noteTitleDisplay').textContent = note.title;
                        document.getElementById('noteContentDisplay').textContent = note.content;
                        document.getElementById('noteTagsDisplay').textContent = `Tags: ${note.tags ? note.tags.join(', ') : 'None'}`;
                        document.getElementById('noteTimestampDisplay').textContent = `Last Updated: ${note.timestamp ? new Date(note.timestamp.toDate()).toLocaleString() : 'N/A'}`;
                        const displayAuthor = note.isAnonymous ? 'Anonymous' : (note.authorUsername || note.authorEmail || 'Unknown User');
                        document.getElementById('noteAuthorDisplay').textContent = `Author: ${displayAuthor}`;
                    } else {
                        alert('Note not found!');
                        window.location.href = 'dashboard.html';
                    }
                })
                .catch(error => {
                    console.error('Error getting note for viewing: ', error);
                    alert('Error loading note: ' + error.message);
                });
        } else {
            alert('No note ID provided for viewing.');
            window.location.href = 'dashboard.html';
        }
    }
});
