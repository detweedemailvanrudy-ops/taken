// --- DATA INITIALISATIE ---
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || [
    { id: 'c1', title: 'Werk', color: '#4A90E2' },
    { id: 'c2', title: 'Privé', color: '#50C878' }
];

// --- NAVIGATIE & VIEW CONTROLLER ---
function showView(viewId) {
    // Verberg alle views
    document.querySelectorAll('.app-view').forEach(v => v.style.display = 'none');
    
    // Toon gekozen view
    document.getElementById('view-' + viewId).style.display = 'block';
    
    // Update Header Titel
    const titles = {
        'planning': 'Mijn Planning',
        'add-task': 'Nieuwe Taak maken',
        'categories': 'Categorie Beheer',
        'completed': 'Voltooide Taken'
    };
    document.getElementById('view-title').innerText = titles[viewId] || 'TaskMaster';

    // Menu sluiten indien open
    const menu = document.getElementById('side-menu');
    if (menu.classList.contains('open')) toggleMenu();

    // Specifieke view logica
    if(viewId === 'add-task') populateCategorySelect();
    
    renderAll();
}

function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('open');
}

// --- OPSLAG & RENDERING ---
function saveAndRender() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('categories', JSON.stringify(categories));
    renderAll();
}

function renderAll() {
    const plannedList = document.getElementById('task-list');
    const backlogList = document.getElementById('backlog-list');
    const completedList = document.getElementById('completed-list');
    const catEditList = document.getElementById('category-edit-list');

    if (plannedList) plannedList.innerHTML = '';
    if (backlogList) backlogList.innerHTML = '';
    if (completedList) completedList.innerHTML = '';
    if (catEditList) catEditList.innerHTML = '';

    tasks.forEach(task => {
        const cat = categories.find(c => c.id === task.categoryId) || categories[0];
        const card = createTaskCard(task, cat);

        if (task.completed) {
            if (completedList) completedList.appendChild(card);
        } else if (task.date) {
            if (plannedList) plannedList.appendChild(card);
        } else {
            if (backlogList) backlogList.appendChild(card);
        }
    });

    if (catEditList) renderCategoryManager(catEditList);
}

function createTaskCard(task, cat) {
    const div = document.createElement('div');
    div.className = `task-card ${task.expanded ? 'expanded' : ''}`;
    div.style.borderLeft = `6px solid ${cat.color}`;
    
    div.innerHTML = `
        <div class="task-header" onclick="toggleExpand('${task.id}')">
            <div class="check-container">
                <input type="checkbox" ${task.completed ? 'checked' : ''} onclick="toggleComplete(event, '${task.id}')">
                <span class="${task.completed ? 'completed' : ''}">${task.title}</span>
            </div>
            <span class="material-icons" style="color:#ccc">${task.expanded ? 'expand_more' : 'chevron_right'}</span>
        </div>
        <div class="task-content">
            <div style="font-size:0.8rem; color:#888; margin-bottom:10px;">
                <span class="material-icons" style="font-size:0.9rem; vertical-align:middle">category</span> ${cat.title}
                ${task.date ? ` | <span class="material-icons" style="font-size:0.9rem; vertical-align:middle">schedule</span> ` + new Date(task.date).toLocaleString('nl-NL') : ''}
            </div>
            <div class="subtasks-container">${renderSubtasks(task.subtasks, task.id)}</div>
            
            <div style="display:flex; gap:8px; margin-top:15px;">
                <button class="btn btn-secondary btn-small" onclick="addSubTaskPrompt('${task.id}')">
                    <span class="material-icons" style="font-size:1rem">add</span> Sub
                </button>
                ${!task.date && !task.completed ? `
                    <button class="btn btn-primary btn-small" onclick="openPlanningModal('${task.id}')">
                        <span class="material-icons" style="font-size:1rem">event</span> Inplannen
                    </button>` : ''}
                ${task.completed ? `<button class="btn btn-secondary btn-small" onclick="rePlan('${task.id}')">Herplan</button>` : ''}
                <button class="btn btn-secondary btn-small" style="color:red" onclick="deleteTask('${task.id}')">
                    <span class="material-icons" style="font-size:1rem">delete</span>
                </button>
            </div>
        </div>
    `;
    return div;
}

function renderSubtasks(subtasks, parentId) {
    if (!subtasks || subtasks.length === 0) return '';
    return `<ul class="subtask-list">` + subtasks.map(st => `
        <li class="subtask-item">
            <div class="check-container">
                <input type="checkbox" ${st.completed ? 'checked' : ''} onclick="toggleSubComplete(event, '${st.id}')">
                <span class="${st.completed ? 'completed' : ''}">${st.title}</span>
            </div>
            <button class="icon-btn" style="color:var(--primary)" onclick="addSubTaskPrompt('${st.id}')">
                <span class="material-icons" style="font-size:1.2rem">add_circle_outline</span>
            </button>
        </li>
        ${renderSubtasks(st.subtasks, st.id)}
    `).join('') + `</ul>`;
}

// --- LOGICA FUNCTIES ---
function toggleExpand(id) {
    const task = findTaskById(tasks, id);
    if(task) { task.expanded = !task.expanded; saveAndRender(); }
}

function toggleComplete(event, id) {
    event.stopPropagation();
    const task = tasks.find(t => t.id === id);
    if(task) { task.completed = !task.completed; saveAndRender(); }
}

function toggleSubComplete(event, subId) {
    event.stopPropagation();
    const sub = findTaskById(tasks, subId);
    if(sub) { sub.completed = !sub.completed; saveAndRender(); }
}

function findTaskById(list, id) {
    for (let t of list) {
        if (t.id === id) return t;
        if (t.subtasks) {
            let found = findTaskById(t.subtasks, id);
            if (found) return found;
        }
    }
    return null;
}

function saveTask() {
    const title = document.getElementById('task-title').value;
    const catId = document.getElementById('task-category').value;
    if(!title) return alert("Vul een titel in");

    tasks.push({
        id: 't-' + Date.now(),
        title,
        categoryId: catId,
        date: null,
        completed: false,
        expanded: false,
        subtasks: []
    });

    document.getElementById('task-title').value = '';
    saveAndRender();
    showView('planning');
}

function addSubTaskPrompt(parentId) {
    const title = prompt("Naam subtaak:");
    if (!title) return;
    const parent = findTaskById(tasks, parentId);
    if (parent) {
        parent.subtasks.push({ id: 'st-' + Date.now(), title, completed: false, subtasks: [] });
        parent.expanded = true;
        saveAndRender();
    }
}

function rePlan(id) {
    const task = tasks.find(t => t.id === id);
    if(task) { task.completed = false; task.date = null; saveAndRender(); showView('planning'); }
}

function deleteTask(id) {
    if(confirm("Zeker weten?")) {
        tasks = tasks.filter(t => t.id !== id);
        saveAndRender();
    }
}

// --- CATEGORIE BEHEER ---
function addCategory() {
    const title = document.getElementById('new-cat-title').value;
    const color = document.getElementById('new-cat-color').value;
    if(title) {
        categories.push({ id: 'c-' + Date.now(), title, color });
        document.getElementById('new-cat-title').value = '';
        saveAndRender();
    }
}

function renderCategoryManager(container) {
    container.innerHTML = categories.map(c => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #eee">
            <div style="display:flex; align-items:center; gap:10px;">
                <div style="width:20px; height:20px; border-radius:50%; background:${c.color}"></div>
                <span>${c.title}</span>
            </div>
            <button class="icon-btn" style="color:red" onclick="deleteCategory('${c.id}')"><span class="material-icons">delete</span></button>
        </div>
    `).join('');
}

function deleteCategory(id) {
    if(categories.length > 1) {
        categories = categories.filter(c => c.id !== id);
        saveAndRender();
    }
}

function populateCategorySelect() {
    const select = document.getElementById('task-category');
    if(select) select.innerHTML = categories.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
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
    if(task && date) {
        task.date = date;
        closePlanningModal();
        saveAndRender();
    }
}

// --- INIT ---
window.onload = () => showView('planning');