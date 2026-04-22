// --- DATA INITIALISATIE ---
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || [
    { id: 'c1', title: 'Algemeen', color: '#4A90E2' }
];

// --- SIDEBAR NAVIGATIE ---
function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('open');
}

// --- CORE OPSLAG & RENDER ---
function saveAndRender() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('categories', JSON.stringify(categories));
    renderAll();
}

function renderAll() {
    const lists = {
        planned: document.getElementById('task-list'),
        backlog: document.getElementById('backlog-list'),
        completed: document.getElementById('completed-list')
    };
    
    // Maak alle lijsten leeg
    Object.values(lists).forEach(l => l.innerHTML = '');

    // Sorteer geplande taken op datum
    const sortedTasks = [...tasks].sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(a.date) - new Date(b.date);
    });

    sortedTasks.forEach(task => {
        const cat = categories.find(c => c.id === task.categoryId) || categories[0];
        const card = document.createElement('div');
        card.className = `task-card ${task.expanded ? 'expanded' : ''}`;
        card.style.borderLeft = `6px solid ${cat.color}`;
        
        card.innerHTML = `
            <div class="task-header" onclick="toggleExpand('${task.id}')">
                <div class="check-container">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} 
                           onclick="toggleComplete(event, '${task.id}')">
                    <span class="${task.completed ? 'completed' : ''}">${task.title}</span>
                </div>
                <div class="header-actions">
                    ${!task.date && !task.completed ? `<button class="btn-plan" onclick="event.stopPropagation(); openPlanningModal('${task.id}')">Plan</button>` : ''}
                    <span class="arrow">${task.expanded ? '▼' : '▶'}</span>
                </div>
            </div>
            <div class="task-content">
                <small style="color:#888">${cat.title} ${task.date ? ' | ' + new Date(task.date).toLocaleString('nl-NL') : ''}</small>
                <div class="subtasks-container">${renderSubtasksRecursive(task.subtasks, task.id)}</div>
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <button class="btn-add-sub" onclick="addSubTaskPrompt('${task.id}')">+ Subtaak</button>
                    ${task.completed ? `<button class="btn-add-sub" onclick="rePlan('${task.id}')">🔄 Hergebruik</button>` : ''}
                    <button class="btn-add-sub" style="color:red" onclick="deleteTask('${task.id}')">Wis</button>
                </div>
            </div>
        `;

        if (task.completed) {
            lists.completed.appendChild(card);
        } else if (task.date) {
            lists.planned.appendChild(card);
        } else {
            lists.backlog.appendChild(card);
        }
    });

    renderCategoryManager();
}

// --- RECURSIEVE SUBTAAK LOGICA ---
function renderSubtasksRecursive(subtasks, parentTaskId) {
    if (!subtasks || subtasks.length === 0) return '';
    return `<ul class="subtask-list">` + subtasks.map(st => `
        <li class="subtask-item">
            <div class="check-container">
                <input type="checkbox" ${st.completed ? 'checked' : ''} 
                       onclick="toggleSubComplete(event, '${st.id}')">
                <span class="${st.completed ? 'completed' : ''}">${st.title}</span>
            </div>
            <button class="btn-add-sub" style="margin:0; padding:2px 6px;" onclick="addSubTaskPrompt('${st.id}')">+</button>
        </li>
        ${renderSubtasksRecursive(st.subtasks, parentTaskId)}
    `).join('') + `</ul>`;
}

// --- EVENT HANDLERS ---
function toggleExpand(id) {
    const task = findTaskInTree(tasks, id);
    if (task) {
        task.expanded = !task.expanded;
        saveAndRender();
    }
}

function toggleComplete(event, id) {
    event.stopPropagation();
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveAndRender();
    }
}

function toggleSubComplete(event, subId) {
    event.stopPropagation();
    const subtask = findTaskInTree(tasks, subId);
    if (subtask) {
        subtask.completed = !subtask.completed;
        saveAndRender();
    }
}

function rePlan(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = false;
        task.date = null; // Gaat terug naar backlog
        task.expanded = false;
        saveAndRender();
    }
}

// --- HELPER: VIND TAAK IN BOOM ---
function findTaskInTree(list, id) {
    for (let item of list) {
        if (item.id === id) return item;
        if (item.subtasks) {
            let found = findTaskInTree(item.subtasks, id);
            if (found) return found;
        }
    }
    return null;
}

// --- TAAK ACTIES ---
function saveTask() {
    const titleInput = document.getElementById('task-title');
    const catSelect = document.getElementById('task-category');
    
    if (!titleInput.value) return;

    tasks.push({
        id: 't-' + Date.now(),
        title: titleInput.value,
        categoryId: catSelect.value,
        date: null,
        completed: false,
        expanded: false,
        subtasks: []
    });

    titleInput.value = '';
    closeModal();
    saveAndRender();
}

function addSubTaskPrompt(parentId) {
    const title = prompt("Naam subtaak:");
    if (!title) return;

    const parent = findTaskInTree(tasks, parentId);
    if (parent) {
        parent.subtasks.push({
            id: 'st-' + Date.now(),
            title: title,
            completed: false,
            subtasks: []
        });
        parent.expanded = true; // Zorg dat je ziet dat er iets is toegevoegd
        saveAndRender();
    }
}

function deleteTask(id) {
    if (confirm("Taak definitief verwijderen?")) {
        tasks = tasks.filter(t => t.id !== id);
        saveAndRender();
    }
}

// --- PLANNING MODAL ---
function openPlanningModal(taskId) {
    document.getElementById('plan-task-id').value = taskId;
    document.getElementById('planning-modal').style.display = 'flex';
}

function closePlanningModal() {
    document.getElementById('planning-modal').style.display = 'none';
}

function confirmPlan() {
    const id = document.getElementById('plan-task-id').value;
    const date = document.getElementById('plan-date').value;
    const task = tasks.find(t => t.id === id);
    if (task && date) {
        task.date = date;
        closePlanningModal();
        saveAndRender();
    }
}

// --- CATEGORIE BEHEER ---
function addCategory() {
    const title = document.getElementById('new-cat-title').value;
    const color = document.getElementById('new-cat-color').value;
    if (title) {
        categories.push({ id: 'c-' + Date.now(), title, color });
        document.getElementById('new-cat-title').value = '';
        saveAndRender();
    }
}

function deleteCategory(id) {
    if (categories.length > 1) {
        categories = categories.filter(c => c.id !== id);
        saveAndRender();
    } else {
        alert("Je moet minimaal één categorie behouden.");
    }
}

function renderCategoryManager() {
    const list = document.getElementById('category-edit-list');
    list.innerHTML = categories.map(c => `
        <div class="cat-edit-item" style="border-left: 4px solid ${c.color}; margin-top:10px; display:flex; justify-content:space-between; align-items:center; background:#f9f9f9; padding:8px; border-radius:5px;">
            <span>${c.title}</span>
            <button onclick="deleteCategory('${c.id}')" style="background:none; border:none; color:red; font-weight:bold;">×</button>
        </div>
    `).join('');
}

// --- MODAL UTILS ---
function openModal() {
    const select = document.getElementById('task-category');
    select.innerHTML = categories.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
    document.getElementById('task-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('task-modal').style.display = 'none';
}

document.getElementById('add-task-btn').onclick = openModal;

// --- INITIALISEER ---
renderAll();