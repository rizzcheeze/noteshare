function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

document.addEventListener('DOMContentLoaded', function() {
    const dashboardBtn = document.querySelector('.back-to-dashboard-btn');
    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', function(event) {
            event.preventDefault();
            window.location.href = 'dashboard.html';
        });
    }

    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(event) {
            event.preventDefault();
            alert("Logged out! (Demo)");
            window.location.href = 'index.html';
        });
    }

    // START: Login Form Logic (from index.html)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const username = loginForm.querySelector('input[name="username"]').value;
            const password = loginForm.querySelector('input[name="password"]').value;

            if (username && password) {
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 500);
            } else {
                alert("Please enter both username/email and password.");
            }
        });
    }


    // START: Signup Form Logic (from signup.html)
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const password = signupForm.querySelector('input[name="password"]').value;
            const confirmPassword = signupForm.querySelector('input[name="confirmPassword"]').value;

            if (password !== confirmPassword) {
                alert("Passwords do not match!");
                return;
            }

            alert("Account created successfully! Please sign in. (This is a demo)");
            window.location.href = 'index.html';
        });
    }
    // END: Signup Form Logic


    // START: Dashboard Page Logic
    // Dummy Note Data (representing notes from a backend)
    const allNotes = [
        { id: 'brownie-recipe', title: 'Brownie recipe', content: `The ultimate fudgy brownie recipe!\n\n**Ingredients:**\n1 cup unsalted butter, melted\n2 cups granulated sugar\n4 large eggs\n1 teaspoon vanilla extract\n1 cup all-purpose flour\n¾ cup unsweetened cocoa powder\n½ teaspoon baking powder\n¼ teaspoon salt\n\n**Instructions:**\n1.) Preheat oven to 350°F (175°C). Grease and flour a 9x13 inch baking pan.\n2.) In a large bowl, combine melted butter and sugar. Beat in the eggs one at a time, then stir in the vanilla.\n3.) In a separate bowl, whisk together flour, cocoa powder, baking powder, and salt. Gradually stir into the wet ingredients until just combined.\n4.) Spread batter evenly into the prepared pan.\n5.) Bake for 20-25 minutes, or until a toothpick inserted into the center comes out with moist crumbs. Do not overbake!\n6.) Let cool completely before cutting into squares. Enjoy!`, views: 24, visibility: 'private', tags: ['recipe', 'food', 'dessert', 'baking'] },
        { id: 'random-memos', title: 'Random memos', content: 'Remember to buy groceries. Call mom. Project deadline next week.', views: 0, visibility: 'private', tags: ['memos', 'personal', 'reminders'] },
        { id: 'schedule', title: 'Weekly Schedule', content: 'Monday: Meeting at 9 AM. Tuesday: Gym. Wednesday: Study session. Thursday: Work on project. Friday: Relax!', views: 0, visibility: 'private', tags: ['schedule', 'planning', 'work'] },
        { id: 'money-saving-tips', title: 'Money Saving Tips', content: `Here are some fantastic tips to save money:\n\n1.) Track your spending religiously. Knowledge is power!\n2.) Create a budget and stick to it. Give every dollar a job.\n3.) Cut unnecessary expenses like subscriptions you don't use.\n4.) Cook at home more often instead of eating out.\n5.) Plan your meals and grocery lists to avoid impulse buys.\n6.) Use cash for discretionary spending to feel the "pain" of parting with money.\n7.) Find cheaper alternatives for your hobbies or entertainment.\n8.) Automate savings transfers to build your emergency fund.\n9.) Review your bills regularly for potential savings.\n10.) Avoid debt as much as possible; interest costs you money.`, views: 150, visibility: 'public', tags: ['money', 'finance', 'life hacks'] },
        { id: 'ice-cream-recipe', title: 'Delicious Ice Cream Recipe', content: "A simple yet delicious homemade vanilla ice cream recipe. You'll need milk, cream, sugar, and vanilla. No-churn methods also exist!", views: 80, visibility: 'public', tags: ['recipe', 'food', 'dessert', 'cooking'] },
        { id: 'how-to-parent', title: 'How to be a Parent', content: "Parenting is a journey of learning. Key tips include consistent boundaries, active listening, and showing unconditional love. Every child is different!", views: 200, visibility: 'public', tags: ['parenting', 'life hacks', 'advice', 'family'] },
        { id: 'study-tips', title: 'Effective Study Tips', content: 'Improve your grades with these simple study techniques: active recall, spaced repetition, and interleaving!', views: 50, visibility: 'public', tags: ['school', 'study', 'education', 'learning'] },
        { id: 'gardening-basics', title: 'Gardening Basics', content: 'Start your own garden with these beginner tips: choose the right plants, prepare your soil, and water consistently.', views: 30, visibility: 'private', tags: ['hobby', 'garden', 'home'] }
    ];

    const publicNotesGrid = document.getElementById('publicNotesGrid');
    const privateNotesGrid = document.getElementById('privateNotesGrid');

    // Function to render notes into the respective grids
    function renderNotes(notesToRender) {
        if (!publicNotesGrid || !privateNotesGrid) return;

        publicNotesGrid.innerHTML = '';
        privateNotesGrid.innerHTML = '';

        notesToRender.forEach(note => {
            const noteCard = document.createElement('div');
            noteCard.classList.add('note-card');
            noteCard.dataset.noteId = note.id;

            if (note.tags && note.tags.length > 0) {
                noteCard.dataset.tags = note.tags.map(tag => tag.toLowerCase()).join(' ');
            } else {
                noteCard.dataset.tags = '';
            }

            const viewsHtml = note.views > 0 ? `<span class="views">${note.views}</span>` : '';
            const lockIconHtml = note.visibility === 'private' ? `<span class="lock-icon"></span>` : '';

            noteCard.innerHTML = `
                ${viewsHtml}
                ${lockIconHtml}
                <p><a href="view_note.html?noteId=${note.id}">${note.title}</a></p>
                <div class="note-actions">
                    <button class="edit-note-btn" onclick="window.location.href='edit_note.html?noteId=${note.id}'">Edit</button>
                    <button class="delete-note-btn" data-note-id="${note.id}">Delete</button>
                </div>
            `;

            if (note.visibility === 'public') {
                publicNotesGrid.appendChild(noteCard);
            } else {
                privateNotesGrid.appendChild(noteCard);
            }
        });
    }

    // Initial render of all notes when dashboard loads
    if (publicNotesGrid && privateNotesGrid) {
        renderNotes(allNotes);
    }

    // Handle delete note button clicks (on dashboard)
    document.body.addEventListener('click', function(event) {
        if (event.target.classList.contains('delete-note-btn')) {
            const noteIdToDelete = event.target.dataset.noteId;
            const confirmDelete = confirm(`Are you sure you want to delete note "${noteIdToDelete}"?`);
            if (confirmDelete) {
                const index = allNotes.findIndex(note => note.id === noteIdToDelete);
                if (index !== -1) {
                    allNotes.splice(index, 1);
                    renderNotes(allNotes);
                    alert(`Note "${noteIdToDelete}" deleted! (Demo)`);
                }
            }
        }
    });

    // START: Tag Management and Note Filtering
    const noteSearchInput = document.getElementById('noteSearchInput');
    const newTagInput = document.getElementById('newTagInput');
    const addTagBtn = document.getElementById('addTagBtn');
    const userTagsGrid = document.getElementById('userTagsGrid');

    let activeTag = null;

    function filterAndRenderNotes() {
        const searchTerm = noteSearchInput ? noteSearchInput.value.toLowerCase() : '';
        const filteredNotes = allNotes.filter(note => {
            const noteTitle = note.title.toLowerCase();
            const noteTags = note.tags.map(tag => tag.toLowerCase());

            let matchesSearch = true;
            if (searchTerm) {
                matchesSearch = noteTitle.includes(searchTerm) || noteTags.some(tag => tag.includes(searchTerm));
            }

            let matchesTagFilter = true;
            if (activeTag) {
                matchesTagFilter = noteTags.includes(activeTag);
            }

            return matchesSearch && matchesTagFilter;
        });
        renderNotes(filteredNotes);
    }

    if (noteSearchInput) {
        noteSearchInput.addEventListener('keyup', filterAndRenderNotes);
    }

    if (addTagBtn && newTagInput && userTagsGrid) {
        addTagBtn.addEventListener('click', function() {
            const newTagText = newTagInput.value.trim();
            if (newTagText) {
                const tagButton = document.createElement('button');
                tagButton.classList.add('tag-btn');
                tagButton.textContent = newTagText;
                tagButton.dataset.tag = newTagText.toLowerCase();
                userTagsGrid.appendChild(tagButton);
                newTagInput.value = '';

                tagButton.addEventListener('click', function() {
                    if (activeTag === tagButton.dataset.tag) {
                        activeTag = null;
                        tagButton.classList.remove('active');
                    } else {
                        document.querySelectorAll('.tag-btn.active').forEach(btn => btn.classList.remove('active'));
                        activeTag = tagButton.dataset.tag;
                        tagButton.classList.add('active');
                    }
                    filterAndRenderNotes();
                });
            } else {
                alert("Please enter a tag name.");
            }
        });
    }

    if (userTagsGrid) {
        userTagsGrid.addEventListener('click', function(event) {
            if (event.target.classList.contains('tag-btn')) {
                const clickedTag = event.target.dataset.tag;
                if (activeTag === clickedTag) {
                    activeTag = null;
                    event.target.classList.remove('active');
                } else {
                    document.querySelectorAll('.tag-btn.active').forEach(btn => btn.classList.remove('active'));
                    activeTag = clickedTag;
                    event.target.classList.add('active');
                }
                filterAndRenderNotes();
            }
        });
    }
    // END: Tag Management and Note Filtering
    // END: Dashboard Page Logic


    // START: Create Note Form Logic (from create_note.html)
    const createNoteForm = document.getElementById('createNoteForm');
    if (createNoteForm) {
        createNoteForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const title = document.getElementById('noteTitle').value;
            const content = document.getElementById('noteContent').value;
            const tagsInput = document.getElementById('noteTags').value;
            const visibility = document.getElementById('noteVisibility').value;

            const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

            const newNoteId = `note-${Date.now()}`;
            const newNote = {
                id: newNoteId,
                title: title,
                content: content,
                views: 0,
                visibility: visibility,
                tags: tags
            };
            allNotes.push(newNote);

            alert("Note created successfully! (This is a demo, not actually saved to a server)");
            window.location.href = 'dashboard.html';
        });
    }
    // END: Create Note Form Logic


    // START: View Note Page Logic (from view_note.html)
    const reportNoteBtn = document.getElementById('reportNoteBtn');
    const reportConfirmSection = document.getElementById('reportConfirmSection');
    const copyNoteBtn = document.getElementById('copyNoteBtn');

    if (reportNoteBtn && reportConfirmSection) {
        reportNoteBtn.addEventListener('click', function() {
            reportConfirmSection.style.display = 'block';
            reportNoteBtn.style.display = 'none';
        });

        const confirmReportBtn = reportConfirmSection.querySelector('.confirm-btn');
        const blockUserBtn = reportConfirmSection.querySelector('.block-btn');
        const cancelReportBtn = reportConfirmSection.querySelector('.cancel-report-btn');

        if (confirmReportBtn) {
            confirmReportBtn.addEventListener('click', function() {
                alert("Note reported! (Demo)");
                reportConfirmSection.style.display = 'none';
                reportNoteBtn.style.display = 'block';
            });
        }
        if (blockUserBtn) {
            blockUserBtn.addEventListener('click', function() {
                alert("Note reported and user blocked! (Demo)");
                reportConfirmSection.style.display = 'none';
                reportNoteBtn.style.display = 'block';
            });
        }
        if (cancelReportBtn) {
            cancelReportBtn.addEventListener('click', function() {
                reportConfirmSection.style.display = 'none';
                reportNoteBtn.style.display = 'block';
            });
        }
    }

    if (copyNoteBtn) {
        copyNoteBtn.addEventListener('click', function() {
            alert("Note copied to your dashboard! (Demo)");
        });
    }

    const currentPage = window.location.pathname.split('/').pop();
    const noteId = getUrlParameter('noteId');

    if (noteId && currentPage === 'view_note.html') {
        const noteData = allNotes.find(note => note.id === noteId);

        const noteTitleDisplay = document.getElementById('noteTitleDisplay');
        const noteContentDisplay = document.getElementById('noteContentDisplay');
        const noteTagsDisplay = document.getElementById('noteTagsDisplay');

        if (noteData && noteTitleDisplay && noteContentDisplay) {
            noteTitleDisplay.textContent = noteData.title;
            noteContentDisplay.textContent = noteData.content;

            if (noteTagsDisplay && noteData.tags && noteData.tags.length > 0) {
                noteTagsDisplay.textContent = `Tags: ${noteData.tags.join(', ')}`;
            } else if (noteTagsDisplay) {
                noteTagsDisplay.textContent = 'No tags';
            }

            if (noteData.visibility === 'public' && copyNoteBtn) {
                copyNoteBtn.style.display = 'inline-block';
            }
        } else {
            if (noteTitleDisplay && noteContentDisplay) {
                noteTitleDisplay.textContent = "Note Not Found";
                noteContentDisplay.textContent = "The note you are looking for does not exist or has been deleted.";
            }
            if (noteTagsDisplay) {
                noteTagsDisplay.textContent = "";
            }
        }
    }
    // END: View Note Page Logic


    // START: Edit Note Page Logic (from edit_note.html)
    const editNoteForm = document.getElementById('editNoteForm');
    if (editNoteForm) {
        const editNoteTitle = document.getElementById('editNoteTitle');
        const editNoteContent = document.getElementById('editNoteContent');
        const editNoteTags = document.getElementById('editNoteTags');
        const editNoteVisibility = document.getElementById('editNoteVisibility');

        const noteIdToEdit = getUrlParameter('noteId');
        if (noteIdToEdit) {
            const noteData = allNotes.find(note => note.id === noteIdToEdit);
            if (noteData) {
                editNoteTitle.value = noteData.title;
                editNoteContent.value = noteData.content;
                editNoteTags.value = noteData.tags ? noteData.tags.join(', ') : '';
                editNoteVisibility.value = noteData.visibility;
            }
        }

        editNoteForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const updatedTitle = editNoteTitle.value;
            const updatedContent = editNoteContent.value;
            const updatedTagsInput = editNoteTags.value;
            const updatedVisibility = editNoteVisibility.value;
            const noteIdToEdit = getUrlParameter('noteId');

            const updatedTags = updatedTagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

            const noteToUpdate = allNotes.find(note => note.id === noteIdToEdit);
            if (noteToUpdate) {
                noteToUpdate.title = updatedTitle;
                noteToUpdate.content = updatedContent;
                noteToUpdate.tags = updatedTags;
                noteToUpdate.visibility = updatedVisibility;
            }

            alert(`Note "${updatedTitle}" saved successfully! (Demo)`);
            window.location.href = 'dashboard.html';
        });
    }
    
});
