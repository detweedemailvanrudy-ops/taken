let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || [
    { id: 'c1', title: 'Algemeen', color: '#4A90E2' }
];

function saveAndRender() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('categories', JSON.stringify(categories));
    renderAll();
}

function renderAll() {
    renderTaskList();
    renderBacklog();
    renderCategoryManager();
}

function renderTaskList() {
    const container = document.getElementById('task-list');
    container.innerHTML = '';
    const planned = tasks.filter(t => t.date).sort((a,b) => new Date(a.date) - new Date(b.date));
    planned.forEach(task => container.appendChild(createTaskCard(task, true)));
}

function renderBacklog() {
    const container = document.getElementById('backlog-list');
    container.innerHTML = '';
    const backlog = tasks.filter(t => !t.date);
    backlog.forEach(task => container.appendChild(createTaskCard(task, false)));
}

function createTaskCard(task, isPlanned) {
    const cat = categories.find(c => c.id === task.categoryId) || categories[0];
    const div = document.createElement('div');
    div.className = 'task-card';
    div.style.borderLeft = `6px solid ${cat.color}`;
    
    div.innerHTML = `
        <div class="task-header">
            <div>
                <div class="task-title">${task.title}</div>
                <div class="task-meta">${cat.title} ${task.date ? ' | ' + new Date(task.date).toLocaleString('nl-NL', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}) : ''}</div>
            </div>
            ${!isPlanned ? `<button class="btn-plan" onclick="openPlanningModal('${task.id}')">Plan</button>` : `<button class="btn-delete" onclick="deleteTask('${task.id}')">X</button>`}
        </div>
        <div class="subtasks-container">${renderSubtasksRecursive(task.subtasks, task.id)}</div>
        <button class="btn-add-sub" onclick="addSubTaskPrompt('${task.id}')">+ Subtaak</button>
    `;
    return div;
}

function renderSubtasksRecursive(subtasks, parentId) {
    if (!subtasks || subtasks.length === 0) return '';
    return `<ul class="subtask-list">` + subtasks.map(st => `
        <li class="subtask-item">
            <span>${st.title}</span>
            <button class="btn-add-sub" style="margin:0" onclick="addSubTaskPrompt('${st.id}')">+</button>
        </li>
        ${renderSubtasksRecursive(st.subtasks, st.id)}
    `).join('') + `</ul>`;
}

function renderCategoryManager() {
    const list = document.getElementById('category-edit-list');
    list.innerHTML = categories.map(c => `
        <div class="cat-edit-item" style="border-left: 4px solid ${c.color}">
            <span>${c.title}</span>
            <button class="btn-delete" onclick="deleteCategory('${c.id}')">wis</button>
        </div>
    `).join('');
}

function saveTask() {
    const title = document.getElementById('task-title').value;
    const catId = document.getElementById('task-category').value;
    if (!title) return;
    tasks.push({ id: 't-' + Date.now(), title, categoryId: catId, date: null, subtasks: [] });
    closeModal();
    saveAndRender();
    document.getElementById('task-title').value = '';
}

function addSubTaskPrompt(parentId) {
    const title = prompt("Naam subtaak:");
    if (!title) return;
    const findAndAdd = (list) => {
        for (let t of list) {
            if (t.id === parentId) {
                t.subtasks.push({ id: 'st-' + Date.now(), title, subtasks: [] });
                return true;
            }
            if (findAndAdd(t.subtasks)) return true;
        }
        return false;
    };
    findAndAdd(tasks);
    saveAndRender();
}

function openPlanningModal(taskId) {
    document.getElementById('plan-task-id').value = taskId;
    document.getElementById('planning-modal').style.display = 'flex';
}

function confirmPlan() {
    const id = document.getElementById('plan-task-id').value;
    const date = document.getElementById('plan-date').value;
    const task = tasks.find(t => t.id === id);
    if(task && date) task.date = date;
    document.getElementById('planning-modal').style.display = 'none';
    saveAndRender();
}

function addCategory() {
    const title = document.getElementById('new-cat-title').value;
    const color = document.getElementById('new-cat-color').value;
    if(title) categories.push({ id: 'c-' + Date.now(), title, color });
    saveAndRender();
}

function deleteCategory(id) {
    if(categories.length > 1) {
        categories = categories.filter(c => c.id !== id);
        saveAndRender();
    }
}

function deleteTask(id) {
    if(confirm("Taak verwijderen?")) {
        tasks = tasks.filter(t => t.id !== id);
        saveAndRender();
    }
}

const modal = document.getElementById('task-modal');
document.getElementById('add-task-btn').onclick = () => {
    document.getElementById('task-category').innerHTML = categories.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
    modal.style.display = 'flex';
};
function closeModal() { modal.style.display = 'none'; }
function closePlanningModal() { document.getElementById('planning-modal').style.display = 'none'; }

renderAll();