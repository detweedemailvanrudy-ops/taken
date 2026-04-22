let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || [
    { id: 'c1', title: 'Algemeen', color: '#4A90E2' }
];

// --- NAVIGATIE ---
function showView(viewId) {
    document.querySelectorAll('.app-view').forEach(v => v.style.display = 'none');
    document.getElementById('view-' + viewId).style.display = 'block';
    
    const titles = { 'planning': 'Mijn Planning', 'manage': 'Takenbeheer', 'categories': 'Categorieën', 'completed': 'Voltooid' };
    document.getElementById('view-title').innerText = titles[viewId];
    if (document.getElementById('side-menu').classList.contains('open')) toggleMenu();
    renderAll();
}

function toggleMenu() { document.getElementById('side-menu').classList.toggle('open'); }

// --- DATA ---
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
    if (activeView === 'view-categories') renderCategories();
}

// --- VIEWS ---
function renderPlanning() {
    const list = document.getElementById('task-list');
    list.innerHTML = '<h2>Ingepland</h2>';
    const planned = tasks.filter(t => t.date && !t.completed).sort((a,b) => new Date(a.date) - new Date(b.date));
    planned.forEach(t => list.appendChild(createTaskCard(t, 'planning')));
}

function renderManage() {
    const list = document.getElementById('manage-all-list');
    const sortVal = document.getElementById('sort-select').value;
    list.innerHTML = '';

    let filtered = tasks.filter(t => !t.completed);

    if (sortVal === 'alpha') filtered.sort((a,b) => a.title.localeCompare(b.title));
    else if (sortVal === 'cat') filtered.sort((a,b) => a.categoryId.localeCompare(b.categoryId));
    else filtered.sort((a,b) => b.id.localeCompare(a.id));

    filtered.forEach(t => list.appendChild(createTaskCard(t, 'manage')));
}

function renderCompleted() {
    const list = document.getElementById('completed-list');
    list.innerHTML = '<h2>Geschiedenis</h2>';
    tasks.filter(t => t.completed).forEach(t => list.appendChild(createTaskCard(t, 'completed')));
}

function createTaskCard(task, context) {
    const cat = categories.find(c => c.id === task.categoryId) || categories[0];
    const div = document.createElement('div');
    div.className = `task-card ${task.expanded ? 'expanded' : ''}`;
    div.style.borderLeft = `6px solid ${cat.color}`;
    
    const isManage = context === 'manage';
    
    div.innerHTML = `
        <div class="task-header" onclick="toggleExpand('${task.id}')">
            <div class="check-container">
                <input type="checkbox" ${task.completed ? 'checked' : ''} onclick="toggleComplete(event, '${task.id}')">
                <span class="${task.completed ? 'completed' : ''}">${task.title}</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                ${isManage ? `<button class="icon-btn" style="color:var(--primary)" onclick="event.stopPropagation(); openEditTaskModal('${task.id}')"><span class="material-icons">edit</span></button>` : ''}
                <span class="material-icons" style="color:#ccc">${task.expanded ? 'expand_more' : 'chevron_right'}</span>
            </div>
        </div>
        <div class="task-content">
            <div style="font-size:0.8rem; color:#888; margin-bottom:10px;">
                <span class="material-icons" style="font-size:0.9rem">category</span> ${cat.title}
                ${task.date ? ` | <span class="material-icons" style="font-size:0.9rem">schedule</span> ` + new Date(task.date).toLocaleString('nl-NL') : ''}
            </div>
            <div class="subtasks-container">${renderSubtasks(task.subtasks, task.id)}</div>
            <div style="display:flex; gap:8px; margin-top:10px;">
                <button class="btn btn-secondary btn-small" onclick="addSubTaskPrompt('${task.id}')"><span class="material-icons">add</span> Sub</button>
                ${!task.date && !task.completed ? `<button class="btn btn-primary btn-small" onclick="openPlanningModal('${task.id}')">Plannen</button>` : ''}
                ${task.completed ? `<button class="btn btn-secondary btn-small" onclick="rePlan('${task.id}')">Herplan</button>` : ''}
                <button class="btn btn-secondary btn-small" style="color:red" onclick="deleteTask('${task.id}')"><span class="material-icons">delete</span></button>
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
            <button class="icon-btn" style="color:var(--primary)" onclick="addSubTaskPrompt('${st.id}')"><span class="material-icons" style="font-size:1.1rem">add_circle_outline</span></button>
        </li>
        ${renderSubtasks(st.subtasks, st.id)}
    `).join('') + `</ul>`;
}

// --- ACTIONS ---
function findTaskById(list, id) {
    for (let t of list) {
        if (t.id === id) return t;
        if (t.subtasks) { let found = findTaskById(t.subtasks, id); if (found) return found; }
    }
    return null;
}

function toggleExpand(id) { const t = findTaskById(tasks, id); if(t) { t.expanded = !t.expanded; saveAndRender(); } }
function toggleComplete(e, id) { e.stopPropagation(); const t = tasks.find(x => x.id === id); if(t) { t.completed = !t.completed; saveAndRender(); } }
function toggleSubComplete(e, id) { e.stopPropagation(); const s = findTaskById(tasks, id); if(s) { s.completed = !s.completed; saveAndRender(); } }

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

function addSubTaskPrompt(parentId) {
    const title = prompt("Naam subtaak:");
    const p = findTaskById(tasks, parentId);
    if(p && title) { p.subtasks.push({ id: 'st-'+Date.now(), title, completed: false, subtasks: [] }); p.expanded = true; saveAndRender(); }
}

function openPlanningModal(id) { document.getElementById('plan-task-id').value = id; document.getElementById('planning-modal').style.display = 'flex'; }
function confirmPlan() {
    const t = tasks.find(x => x.id === document.getElementById('plan-task-id').value);
    const d = document.getElementById('plan-date').value;
    if(t && d) { t.date = d; closePlanningModal(); saveAndRender(); showView('planning'); }
}

function rePlan(id) { const t = tasks.find(x => x.id === id); t.completed = false; t.date = null; saveAndRender(); showView('manage'); }
function deleteTask(id) { if(confirm("Verwijderen?")) { tasks = tasks.filter(x => x.id !== id); saveAndRender(); } }
function closeModal() { document.getElementById('task-modal').style.display = 'none'; }
function closePlanningModal() { document.getElementById('planning-modal').style.display = 'none'; }
function populateCatSelect() { document.getElementById('task-category-select').innerHTML = categories.map(c => `<option value="${c.id}">${c.title}</option>`).join(''); }

// --- CATEGORIES ---
function renderCategories() {
    document.getElementById('category-edit-list').innerHTML = categories.map(c => `
        <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee">
            <div style="display:flex; align-items:center; gap:10px"><div style="width:15px; height:15px; border-radius:50%; background:${c.color}"></div>${c.title}</div>
            <button class="icon-btn" style="color:red" onclick="deleteCategory('${c.id}')"><span class="material-icons">delete</span></button>
        </div>
    `).join('');
}
function addCategory() {
    const t = document.getElementById('new-cat-title').value;
    const c = document.getElementById('new-cat-color').value;
    if(t) { categories.push({ id: 'c-'+Date.now(), title: t, color: c }); document.getElementById('new-cat-title').value = ''; saveAndRender(); }
}
function deleteCategory(id) { if(categories.length > 1) { categories = categories.filter(x => x.id !== id); saveAndRender(); } }

window.onload = () => showView('planning');