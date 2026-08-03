/**
 * TaskFlow - 任务记录网站
 * 原生 JavaScript 实现
 */

(function () {
    'use strict';

    // ========== 数据管理 ==========
    const STORAGE_KEY = 'taskflow_tasks';

    /** 从 localStorage 加载任务 */
    function loadTasks() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    /** 保存任务到 localStorage */
    function saveTasks(tasks) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }

    /** 生成唯一 ID */
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    // ========== 状态 ==========
    let tasks = loadTasks();
    let currentView = 'board';
    let editingTaskId = null;
    let deletingTaskId = null;

    // 如果没有任何任务，添加示例数据
    if (tasks.length === 0) {
        tasks = [
            { id: generateId(), title: '完成项目报告', desc: '编写 Q4 季度项目总结报告，包含数据分析和下季度计划。', category: 'work', priority: 'high', dueDate: '2025-02-15', status: 'todo', createdAt: Date.now() },
            { id: generateId(), title: '学习 TypeScript', desc: '完成 TypeScript 高级类型章节的学习和练习。', category: 'study', priority: 'medium', dueDate: '2025-02-20', status: 'inprogress', createdAt: Date.now() },
            { id: generateId(), title: '购买生活用品', desc: '牙膏、洗衣液、厨房纸巾等。', category: 'personal', priority: 'low', dueDate: '2025-02-10', status: 'done', createdAt: Date.now() },
            { id: generateId(), title: '代码审查', desc: '审查前端团队提交的 PR，确保代码质量。', category: 'work', priority: 'high', dueDate: '2025-02-12', status: 'inprogress', createdAt: Date.now() },
            { id: generateId(), title: '阅读《设计模式》', desc: '阅读第 5-7 章，做好笔记。', category: 'study', priority: 'low', dueDate: '2025-03-01', status: 'todo', createdAt: Date.now() },
        ];
        saveTasks(tasks);
    }

    // ========== DOM 引用 ==========
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const addTaskBtn = $('#addTaskBtn');
    const taskModal = $('#taskModal');
    const modalClose = $('#modalClose');
    const taskForm = $('#taskForm');
    const modalTitle = $('#modalTitle');
    const submitBtn = $('#submitBtn');
    const cancelBtn = $('#cancelBtn');
    const searchInput = $('#searchInput');
    const filterPriority = $('#filterPriority');
    const filterCategory = $('#filterCategory');
    const deleteModal = $('#deleteModal');
    const deleteModalClose = $('#deleteModalClose');
    const cancelDeleteBtn = $('#cancelDeleteBtn');
    const confirmDeleteBtn = $('#confirmDeleteBtn');

    // 视图
    const boardView = $('#boardView');
    const listView = $('#listView');
    const statsView = $('#statsView');

    // ========== 分类与状态映射 ==========
    const categoryLabels = { work: '工作', personal: '个人', study: '学习', other: '其他' };
    const priorityLabels = { high: '高', medium: '中', low: '低' };
    const statusLabels = { todo: '待办', inprogress: '进行中', done: '已完成' };

    // ========== 视图切换 ==========
    $$('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);
        });
    });

    function switchView(view) {
        currentView = view;
        $$('.nav-btn').forEach(b => b.classList.remove('active'));
        $(`.nav-btn[data-view="${view}"]`).classList.add('active');

        boardView.classList.toggle('hidden', view !== 'board');
        listView.classList.toggle('hidden', view !== 'list');
        statsView.classList.toggle('hidden', view !== 'stats');

        renderAll();
    }

    // ========== 筛选逻辑 ==========
    function getFilteredTasks() {
        const keyword = searchInput.value.trim().toLowerCase();
        const priority = filterPriority.value;
        const category = filterCategory.value;

        return tasks.filter(t => {
            if (keyword && !t.title.toLowerCase().includes(keyword) && !(t.desc || '').toLowerCase().includes(keyword)) return false;
            if (priority !== 'all' && t.priority !== priority) return false;
            if (category !== 'all' && t.category !== category) return false;
            return true;
        });
    }

    searchInput.addEventListener('input', renderAll);
    filterPriority.addEventListener('change', renderAll);
    filterCategory.addEventListener('change', renderAll);

    // ========== 渲染 ==========
    function renderAll() {
        const filtered = getFilteredTasks();
        renderBoard(filtered);
        renderList(filtered);
        renderStats();
    }

    /** 渲染看板视图 */
    function renderBoard(filtered) {
        const groups = { todo: [], inprogress: [], done: [] };
        filtered.forEach(t => {
            if (groups[t.status]) groups[t.status].push(t);
        });

        ['todo', 'inprogress', 'done'].forEach(status => {
            const container = $(`#${status}Tasks`);
            const countEl = $(`#count${status.charAt(0).toUpperCase() + status.slice(1)}`);
            countEl.textContent = groups[status].length;

            if (groups[status].length === 0) {
                container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">&#128203;</div><div class="empty-state-text">暂无任务</div></div>`;
                return;
            }

            container.innerHTML = groups[status].map(t => createTaskCard(t)).join('');
        });

        // 绑定卡片事件
        bindCardEvents();
        // 绑定拖拽
        bindDragEvents();
    }

    /** 创建任务卡片 HTML */
    function createTaskCard(task) {
        const dueDateStr = task.dueDate ? formatDate(task.dueDate) : '';
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

        return `
            <div class="task-card priority-${task.priority}" draggable="true" data-id="${task.id}">
                <div class="task-card-header">
                    <div class="task-card-title">${escapeHtml(task.title)}</div>
                    <div class="task-card-actions">
                        <button class="edit-btn" title="编辑">&#9998;</button>
                        <button class="delete-btn" title="删除">&#128465;</button>
                    </div>
                </div>
                ${task.desc ? `<div class="task-card-desc">${escapeHtml(task.desc)}</div>` : ''}
                <div class="task-card-footer">
                    <span class="task-tag tag-${task.category}">${categoryLabels[task.category]}</span>
                    ${dueDateStr ? `<span class="task-due ${isOverdue ? 'overdue' : ''}">&#128197; ${dueDateStr}</span>` : ''}
                </div>
            </div>
        `;
    }

    /** 渲染列表视图 */
    function renderList(filtered) {
        const tbody = $('#listTableBody');

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">&#128203;</div><div class="empty-state-text">暂无任务</div></div></td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(t => {
            const dueDateStr = t.dueDate ? formatDate(t.dueDate) : '-';
            const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done';

            return `
                <tr>
                    <td><strong>${escapeHtml(t.title)}</strong></td>
                    <td><span class="task-tag tag-${t.category}">${categoryLabels[t.category]}</span></td>
                    <td>
                        <span class="priority-badge">
                            <span class="priority-dot ${t.priority}"></span>
                            ${priorityLabels[t.priority]}
                        </span>
                    </td>
                    <td class="${isOverdue ? 'task-due overdue' : ''}">${dueDateStr}</td>
                    <td><span class="status-badge status-${t.status}">${statusLabels[t.status]}</span></td>
                    <td>
                        <div class="list-actions">
                            <button class="edit-btn" data-id="${t.id}" title="编辑">&#9998;</button>
                            <button class="delete-btn" data-id="${t.id}" title="删除">&#128465;</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // 绑定列表中的按钮事件
        tbody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(btn.dataset.id));
        });
        tbody.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => openDeleteModal(btn.dataset.id));
        });
    }

    /** 渲染统计视图 */
    function renderStats() {
        const total = tasks.length;
        const todoCount = tasks.filter(t => t.status === 'todo').length;
        const inprogressCount = tasks.filter(t => t.status === 'inprogress').length;
        const doneCount = tasks.filter(t => t.status === 'done').length;

        $('#statTotal').textContent = total;
        $('#statTodo').textContent = todoCount;
        $('#statInprogress').textContent = inprogressCount;
        $('#statDone').textContent = doneCount;

        // 完成率
        const rate = total > 0 ? Math.round((doneCount / total) * 100) : 0;
        $('#completionBar').style.width = rate + '%';
        $('#completionText').textContent = rate + '% 已完成';

        // 分类分布
        const categories = ['work', 'personal', 'study', 'other'];
        const catBars = $('#categoryBars');
        catBars.innerHTML = categories.map(cat => {
            const count = tasks.filter(t => t.category === cat).length;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return `
                <div class="cat-bar-row">
                    <span class="cat-bar-label">${categoryLabels[cat]}</span>
                    <div class="cat-bar-track">
                        <div class="cat-bar-fill ${cat}" style="width: ${pct}%"></div>
                    </div>
                    <span class="cat-bar-count">${count}</span>
                </div>
            `;
        }).join('');
    }

    // ========== 卡片事件绑定 ==========
    function bindCardEvents() {
        $$('.task-card .edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = btn.closest('.task-card');
                openEditModal(card.dataset.id);
            });
        });

        $$('.task-card .delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = btn.closest('.task-card');
                openDeleteModal(card.dataset.id);
            });
        });
    }

    // ========== 拖拽功能 ==========
    function bindDragEvents() {
        const cards = $$('.task-card[draggable]');
        const columns = $$('.board-column');

        cards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                card.classList.add('dragging');
                e.dataTransfer.setData('text/plain', card.dataset.id);
                e.dataTransfer.effectAllowed = 'move';
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                columns.forEach(col => col.classList.remove('drag-over'));
            });
        });

        columns.forEach(col => {
            col.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                col.classList.add('drag-over');
            });

            col.addEventListener('dragleave', () => {
                col.classList.remove('drag-over');
            });

            col.addEventListener('drop', (e) => {
                e.preventDefault();
                col.classList.remove('drag-over');
                const taskId = e.dataTransfer.getData('text/plain');
                const newStatus = col.dataset.status;
                const task = tasks.find(t => t.id === taskId);
                if (task && task.status !== newStatus) {
                    task.status = newStatus;
                    saveTasks(tasks);
                    renderAll();
                }
            });
        });
    }

    // ========== 模态框控制 ==========
    function openCreateModal() {
        editingTaskId = null;
        modalTitle.textContent = '新建任务';
        submitBtn.textContent = '创建任务';
        taskForm.reset();
        taskModal.classList.remove('hidden');
    }

    function openEditModal(id) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        editingTaskId = id;
        modalTitle.textContent = '编辑任务';
        submitBtn.textContent = '保存修改';

        $('#taskTitle').value = task.title;
        $('#taskDesc').value = task.desc || '';
        $('#taskCategory').value = task.category;
        $('#taskPriority').value = task.priority;
        $('#taskDueDate').value = task.dueDate || '';
        $('#taskStatus').value = task.status;

        taskModal.classList.remove('hidden');
    }

    function closeTaskModal() {
        taskModal.classList.add('hidden');
        editingTaskId = null;
    }

    function openDeleteModal(id) {
        deletingTaskId = id;
        deleteModal.classList.remove('hidden');
    }

    function closeDeleteModal() {
        deleteModal.classList.add('hidden');
        deletingTaskId = null;
    }

    // 事件绑定
    addTaskBtn.addEventListener('click', openCreateModal);
    modalClose.addEventListener('click', closeTaskModal);
    cancelBtn.addEventListener('click', closeTaskModal);
    deleteModalClose.addEventListener('click', closeDeleteModal);
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);

    // 点击遮罩关闭
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) closeTaskModal();
    });
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) closeDeleteModal();
    });

    // ESC 关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeTaskModal();
            closeDeleteModal();
        }
    });

    // ========== 表单提交 ==========
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = $('#taskTitle').value.trim();
        if (!title) return;

        const taskData = {
            title: title,
            desc: $('#taskDesc').value.trim(),
            category: $('#taskCategory').value,
            priority: $('#taskPriority').value,
            dueDate: $('#taskDueDate').value,
            status: $('#taskStatus').value,
        };

        if (editingTaskId) {
            // 编辑模式
            const idx = tasks.findIndex(t => t.id === editingTaskId);
            if (idx !== -1) {
                tasks[idx] = { ...tasks[idx], ...taskData };
            }
        } else {
            // 新建模式
            tasks.unshift({
                id: generateId(),
                ...taskData,
                createdAt: Date.now()
            });
        }

        saveTasks(tasks);
        closeTaskModal();
        renderAll();
    });

    // ========== 删除任务 ==========
    confirmDeleteBtn.addEventListener('click', () => {
        if (deletingTaskId) {
            tasks = tasks.filter(t => t.id !== deletingTaskId);
            saveTasks(tasks);
            closeDeleteModal();
            renderAll();
        }
    });

    // ========== 工具函数 ==========
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function formatDate(dateStr) {
        const d = new Date(dateStr);
        const month = d.getMonth() + 1;
        const day = d.getDate();
        return `${month}月${day}日`;
    }

    // ========== 初始化 ==========
    renderAll();

})();