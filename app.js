// Initialiseer data
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || [
    { id: 'c1', title: 'Werk', color: '#4A90E2' },
    { id: 'c2', title: 'Persoonlijk', color: '#50C878' },
    { id: 'c3', title: 'Boodschappen', color: '#FFB347' }
];

// DOM Elementen
const taskList = document.getElementById('task-list');
const catList = document.getElementById('category-list');
const modal = document.getElementById('task-modal');
const addTaskBtn = document.getElementById('add-task-btn');

// --- Core Functies ---

function saveAndRender() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderCategories();
    renderTasks();
}

function renderCategories() {
    catList.innerHTML = categories.map(cat => `
        <div class="category-chip" style="border-color: ${cat.color}">
            ${cat.title}
        </div>
    `).join('');
}

function renderTasks() {
    taskList.innerHTML = '';
    
    // Sorteren op datum (leeg achteraan)
    const sortedTasks = [...tasks].sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(a.date) - new Date(b.date);
    });

    sortedTasks.forEach(task => {
        const cat = categories.find(c => c.id === task.categoryId);
        const card = document.createElement('div');
        card.className = 'task-card';
        card.style.borderLeft = `6px solid ${cat ? cat.color : '#ccc'}`;
        
        card.innerHTML = `
            <div class="task-header">
                <div>
                    <div class="task-title">${task.title}</div>
                    <div class="task-date">${task.date ? new Date(task.date).toLocaleString('nl-NL') : 'Geen datum'}</div>
                </div>
                <button class="btn-add-sub" onclick="deleteTask('${task.id}')">X</button>
            </div>
            <div class="subtasks-container">
                ${renderSubtasksRecursive(task.subtasks, task.id)}
            </div>
            <button class="btn-add-sub" onclick="addSubTaskPrompt('${task.id}')">+ Subtaak</button>
        `;
        taskList.appendChild(card);
    });
}

function renderSubtasksRecursive(subtasks, parentId) {
    if (!subtasks || subtasks.length === 0) return '';
    return `
        <ul class="subtask-list">
            ${subtasks.map(st => `
                <li class="subtask-item">
                    <div style="flex: 1;">
                        <span>${st.title}</span>
                        ${renderSubtasksRecursive(st.subtasks, st.id)}
                    </div>
                    <button class="btn-add-sub" onclick="addSubTaskPrompt('${st.id}')">+</button>
                </li>
            `).join('')}
        </ul>
    `;
}

// --- Acties ---

function openModal() {
    const catSelect = document.getElementById('task-category');
    catSelect.innerHTML = categories.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
}

function saveTask() {
    const title = document.getElementById('task-title').value;
    const date = document.getElementById('task-date').value;
    const catId = document.getElementById('task-category').value;

    if (!title) return alert("Vul een titel in");

    tasks.push({
        id: 'id-' + Date.now(),
        title: title,
        date: date,
        categoryId: catId,
        subtasks: []
    });

    saveAndRender();
    closeModal();
    document.getElementById('task-title').value = '';
}

function addSubTaskPrompt(parentId) {
    const title = prompt("Naam subtaak:");
    if (!title) return;

    const findAndAdd = (list) => {
        for (let t of list) {
            if (t.id === parentId) {
                t.subtasks.push({ id: 'id-' + Date.now(), title, subtasks: [] });
                return true;
            }
            if (t.subtasks && findAndAdd(t.subtasks)) return true;
        }
        return false;
    };

    findAndAdd(tasks);
    saveAndRender();
}

function deleteTask(id) {
    if(confirm("Taak verwijderen?")) {
        tasks = tasks.filter(t => t.id !== id);
        saveAndRender();
    }
}

// Event Listeners
addTaskBtn.addEventListener('click', openModal);
window.onclick = (event) => { if (event.target == modal) closeModal(); };

// Start de app
saveAndRender();