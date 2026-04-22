let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || [
    { id: 'c1', title: 'Algemeen', color: '#4A90E2' }
];

// --- NAVIGATIE ---
function showView(viewId) {
    document.querySelectorAll('.app-view').forEach(v => v.style.display = 'none');
    document.getElementById('view-' + viewId).style.display = 'block';
    
    const titles = { 'planning': 'Planning', 'manage': 'Takenbeheer', 'categories': 'Categorieën', 'completed': 'Voltooid' };
    document.getElementById('view-title').innerText = titles[viewId];
    if (document.getElementById('side-menu').classList.contains('open')) toggleMenu();
    renderAll();
}

function toggleMenu() { document.getElementById('side-menu').classList.toggle('open'); }

// --- DATA & RENDER ---
function saveAndRender() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('categories', JSON.stringify(categories));
    renderAll();
}

function renderAll() {
    const activeView = Array.from(document.querySelectorAll('.app-view')).find(v => v.style.display !== 'none')?.id;
    if (activeView === 'view-planning') renderPlanning();
    if (activeView === 'view-manage') renderManage();
    if (activeView === 'view-completed') renderCompleted();
    if (activeView === 'view-categories') renderCategoryList();
}

function renderPlanning() {
    const list = document.getElementById('task-list');
    const sortVal = document.getElementById('sort-select').value;
    list.innerHTML = '';
    
    let planned = tasks.filter(t => t.date && !t.completed);

    if (sortVal === 'alpha') planned.sort((a,b) => a.title.localeCompare(b.title));
    else if (sortVal === 'cat') planned.sort((a,b) => a.categoryId.localeCompare(b.categoryId));
    else planned.sort((a,b) => new Date(a.date) - new Date(b.date));

    planned.forEach(t => list.appendChild(createTaskCard(t, 'planning')));
}

function renderManage() {
    const list = document.getElementById('manage-all-list');
    list.innerHTML = '<h2 style="font-size:1rem; color:var(--grey); margin-bottom:15px;">Alle taken (Backlog)</h2>';
    // HIER: Geen filter meer op 'completed', zodat alles zichtbaar blijft
    const all = [...tasks].sort((a,b) => b.id.localeCompare(a.id));
    all.forEach(t => list.appendChild(createTaskCard(t, 'manage')));
}

function renderCompleted() {
    const list = document.getElementById('completed-list');
    list.innerHTML = '';
    tasks.filter(t => t.completed).forEach(t => list.appendChild(createTaskCard(t, 'completed')));
}

function createTaskCard(task, context) {
    const cat = categories.find(c => c.id === task.categoryId) || categories[0];
    const div = document.createElement('div');
    div.className = `task-card ${task.expanded ? 'expanded' : ''}`;
    div.style.borderLeft = `6px solid ${cat.color}`;
    
    const isPlanning = context === 'planning' || context === 'completed';
    const isManage = context === 'manage';

    let headerHTML = `<div class="task-header" onclick="toggleExpand('${task.id}')">`;
    if (isPlanning) {
        headerHTML += `
            <div class="check-container">
                <input type="checkbox" ${task.completed ? 'checked' : ''} onclick="toggleComplete(event, '${task.id}')">
                <span class="${task.completed ? 'completed' : ''}">${task.title}</span>
            </div>`;
    } else {
        headerHTML += `<strong class="${task.completed ? 'completed' : ''}">${task.title}</strong>`;
    }
    
    headerHTML += `
        <div style="display:flex; align-items:center; gap:8px;">
            ${isManage ? `<button class="icon-btn" style="color:var(--primary)" onclick="event.stopPropagation(); openEditTaskModal('${task.id}')"><span class="material-icons">edit</span></button>` : ''}
            <span class="material-icons" style="color:#ccc">${task.expanded ? 'expand_more' : 'chevron_right'}</span>
        </div>
    </div>`;

    let contentHTML = `<div class="task-content">`;
    contentHTML += `<div style="font-size:0.8rem; color:#888; margin-bottom:10px;">
        <span class="material-icons" style="font-size:0.9rem">category</span> ${cat.title}
        ${task.date ? ` | <span class="material-icons" style="font-size:0.9rem">schedule</span> ` + new Date(task.date).toLocaleString('nl-NL') : ''}
    </div>`;

    contentHTML += `<div class="subtasks-container">${renderSubtasks(task.subtasks, task.id, context)}</div>`;

    contentHTML += `<div style="display:flex; gap:8px; margin-top:10px;">`;
    
    if (isManage) {
        contentHTML += `<button class="btn btn-secondary" style="width:auto; padding:6px 12px;" onclick="addSubTaskPrompt('${task.id}')">+ Subtaak</button>`;
        // Altijd optie tot (her)plannen in beheer
        contentHTML += `<button class="btn btn-primary" style="width:auto; padding:6px 12px;" onclick="openPlanningModal('${task.id}')">${task.date ? 'Herplannen' : 'Inplannen'}</button>`;
        contentHTML += `<button class="btn btn-secondary" style="width:auto; padding:6px 12px; color:red" onclick="deleteTask('${task.id}')"><span class="material-icons" style="font-size:1.2rem">delete</span></button>`;
    } else if (task.completed) {
        contentHTML += `<button class="btn btn-secondary" style="width:auto; padding:6px 12px;" onclick="rePlan('${task.id}')">Heractiveren</button>`;
        contentHTML += `<button class="btn btn-secondary" style="width:auto; padding:6px 12px; color:red" onclick="deleteTask('${task.id}')"><span class="material-icons" style="font-size:1.2rem">delete</span></button>`;
    }
    
    contentHTML += `</div></div>`;
    div.innerHTML = headerHTML + contentHTML;
    return div;
}

function renderSubtasks(subtasks, parentId, context) {
    if (!subtasks || subtasks.length === 0) return '';
    const isPlanning = context === 'planning' || context === 'completed';
    const isManage = context === 'manage';

    return `<ul class="subtask-list">` + subtasks.map(st => `
        <li class="subtask-item">
            <div class="check-container">
                ${isPlanning ? `<input type="checkbox" ${st.completed ? 'checked' : ''} onclick="toggleSubComplete(event, '${st.id}')">` : ''}
                <span class="${st.completed ? 'completed' : ''}">${st.title}</span>
            </div>
            ${isManage ? `<button class="icon-btn" style="color:var(--primary)" onclick="addSubTaskPrompt('${st.id}')"><span class="material-icons" style="font-size:1.1rem">add_circle</span></button>` : ''}
        </li>
        ${renderSubtasks(st.subtasks, st.id, context)}
    `).join('') + `</ul>`;
}

// --- SLIMME AFVINK LOGICA ---
function toggleComplete(e, id) {
    e.stopPropagation();
    const task = tasks.find(x => x.id === id);
    if(task) {
        task.completed = !task.completed;
        if (task.subtasks) setAllSubtasks(task.subtasks, task.completed);
        saveAndRender();
    }
}

function setAllSubtasks(subList, status) {
    subList.forEach(s => {
        s.completed = status;
        if (s.subtasks) setAllSubtasks(s.subtasks, status);
    });
}

function toggleSubComplete(e, subId) {
    e.stopPropagation();
    const sub = findTaskById(tasks, subId);
    if(!sub) return;
    sub.completed = !sub.completed;
    if (sub.subtasks) setAllSubtasks(sub.subtasks, sub.completed);
    checkParentStatus(tasks);
    saveAndRender();
}

function checkParentStatus(list) {
    list.forEach(parent => {
        if (parent.subtasks && parent.subtasks.length > 0) {
            checkParentStatus(parent.subtasks);
            const allDone = parent.subtasks.every(s => s.completed);
            parent.completed = allDone;
        }
    });
}

// --- LOGICA ACTIES ---
function findTaskById(list, id) {
    for (let t of list) {
        if (t.id === id) return t;
        if (t.subtasks) { let found = findTaskById(t.subtasks, id); if (found) return found; }
    }
    return null;
}

function toggleExpand(id) { const t = findTaskById(tasks, id); if(t) { t.expanded = !t.expanded; saveAndRender(); } }

function openNewTaskModal() {
    document.getElementById('modal-task-title').innerText = "Nieuwe Taak";
    document.getElementById('edit-task-id').value = "";
    document.getElementById('task-title-input').value = "";
    populateCatSelect();
    document.getElementById('task-modal').style.display = 'flex';
}

function openEditTaskModal(id) {
    const t = findTaskById(tasks, id);
    document.getElementById('modal-task-title').innerText = "Bewerken";
    document.getElementById('edit-task-id').value = t.id;
    document.getElementById('task-title-input').value = t.title;
    populateCatSelect();
    document.getElementById('task-category-select').value = t.categoryId;
    document.getElementById('task-modal').style.display = 'flex';
}

function handleSaveTask() {
    const id = document.getElementById('edit-task-id').value;
    const title = document.getElementById('task-title-input').value;
    const cat = document.getElementById('task-category-select').value;
    if(!title) return;
    if(id) { const t = findTaskById(tasks, id); t.title = title; t.categoryId = cat; }
    else { tasks.push({ id: 't-'+Date.now(), title, categoryId: cat, date: null, completed: false, expanded: false, subtasks: [] }); }
    closeModal(); saveAndRender();
}

function closeModal() { document.getElementById('task-modal').style.display = 'none'; }
function openPlanningModal(id) { document.getElementById('plan-task-id').value = id; document.getElementById('planning-modal').style.display = 'flex'; }
function closePlanningModal() { document.getElementById('planning-modal').style.display = 'none'; }

function confirmPlan() {
    const t = tasks.find(x => x.id === document.getElementById('plan-task-id').value);
    const d = document.getElementById('plan-date').value;
    if(t && d) { t.date = d; t.completed = false; closePlanningModal(); saveAndRender(); showView('planning'); }
}

function addSubTaskPrompt(parentId) {
    const title = prompt("Naam subtaak:");
    const p = findTaskById(tasks, parentId);
    if(p && title) { p.subtasks.push({ id: 'st-'+Date.now(), title, completed: false, subtasks: [] }); p.expanded = true; saveAndRender(); }
}

function deleteTask(id) { if(confirm("Taak definitief verwijderen?")) { tasks = tasks.filter(x => x.id !== id); saveAndRender(); } }
function rePlan(id) { const t = tasks.find(x => x.id === id); t.completed = false; saveAndRender(); }

function populateCatSelect() { document.getElementById('task-category-select').innerHTML = categories.map(c => `<option value="${c.id}">${c.title}</option>`).join(''); }

// --- CATEGORIES RENDER ---
function renderCategoryList() {
    const container = document.getElementById('category-edit-list');
    container.innerHTML = `
        <div class="category-card">
            <h3 style="margin-top:0">Beheer Categorieën</h3>
            <div id="cat-list-items">
                ${categories.map(c => `
                    <div class="category-item">
                        <div style="display:flex; align-items:center; gap:12px">
                            <div style="width:20px; height:20px; border-radius:50%; background:${c.color}; box-shadow:0 2px 4px rgba(0,0,0,0.1)"></div>
                            <span style="font-weight:500">${c.title}</span>
                        </div>
                        <button class="icon-btn" style="color:#ff7675" onclick="deleteCategory('${c.id}')">
                            <span class="material-icons">delete_outline</span>
                        </button>
                    </div>
                `).join('')}
            </div>
            <div class="cat-input-group">
                <input type="text" id="new-cat-title" placeholder="Nieuwe categorie...">
                <div class="color-picker-wrapper">
                    <input type="color" id="new-cat-color" value="#4A90E2">
                </div>
                <button class="btn-icon-round" onclick="addCategory()">
                    <span class="material-icons">add</span>
                </button>
            </div>
        </div>
    `;
}

function addCategory() {
    const t = document.getElementById('new-cat-title').value;
    const c = document.getElementById('new-cat-color').value;
    if(t) { categories.push({ id: 'c-'+Date.now(), title: t, color: c }); saveAndRender(); }
}

function deleteCategory(id) { 
    if(categories.length > 1) { 
        if(confirm("Categorie verwijderen? Taken in deze categorie blijven bestaan.")) {
            categories = categories.filter(x => x.id !== id); 
            saveAndRender(); 
        }
    } else {
        alert("Je moet minimaal één categorie behouden.");
    }
}

window.onload = () => showView('planning');