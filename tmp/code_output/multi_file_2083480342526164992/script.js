/**
 * TaskFlow - 任务记录网站
 * 使用原生 JavaScript 实现，数据存储在 localStorage
 */

(function() {
    'use strict';

    // ============================
    // 数据管理
    // ============================
    const STORAGE_KEY = 'taskflow_tasks';

    /** 从 localStorage 加载任务 */
    function loadTasks() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('加载任务失败:', e);
            return [];
        }
    }

    /** 保存任务到 localStorage */
    function saveTasks(tasks) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        } catch (e) {
            console.error('保存任务失败:', e);
        }
    }

    /** 生成唯一 ID */
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    // ============================
    // 状态管理
    // ============================
    let tasks = loadTasks();
    let currentView = 'board';
    let editingTaskId = null;
    let deletingTaskId = null;

    // 如果没有任务，添加一些示例数据
    if (tasks.length === 0) {
        tasks = [
            {
                id: generateId(),
                name: '完成项目报告',
                description: '撰写本季度的项目进展报告，包含数据分析和总结。',
                category: 'work',
                priority: 'high',
                status: 'inprogress',
                dueDate: getFutureDate(3),
                createdAt: new Date().toISOString()
            },
            {
                id: generateId(),
                name: '学习 JavaScript 高级特性',
                description: '深入学习 Promise、Async/Await 和模块化开发。',
                category: 'study',
                priority: 'medium',
                status: 'todo',
                dueDate: getFutureDate(7),
                createdAt: new Date().toISOString()
            },
            {
                id: generateId(),
                name: '整理书桌',
                description: '清理桌面，归档文件，保持工作环境整洁。',
                category: 'personal',
                priority: 'low',
                status: 'done',
                dueDate: getFutureDate(-1),
                createdAt: new Date().toISOString()
            },
            {
                id: generateId(),
                name: '团队周会准备',
                description: '准备本周的团队会议议程和演示材料。',
                category: 'work',
                priority: 'high',
                status: 'todo',
                dueDate: getFutureDate(1),
                createdAt: new Date().toISOString()
            },
            {
                id: generateId(),
                name: '阅读《代码整洁之道》',
                description: '每周阅读两章并做好笔记。',
                category: 'study',
                priority: 'medium',
                status: 'inprogress',
                dueDate: getFutureDate(14),
                createdAt: new Date().toISOString()
            },
            {
                id: generateId(),
                name: '购买生活用品',
                description: '采购日常生活所需的物品。',
                category: 'personal',
                priority: 'low',
                status: 'todo',
                dueDate: getFutureDate(5),
                createdAt: new Date().toISOString()
            }
        ];
        saveTasks(tasks);
    }

    function getFutureDate(days) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
    }

    // ============================
    // DOM 元素引用
    // ============================
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const addTaskBtn = $('#addTaskBtn');
    const searchInput = $('#searchInput');
    const filterPriority = $('#filterPriority');
    const filterCategory = $('#filterCategory');

    // 视图
    const boardView = $('#boardView');
    const listView = $('#listView');
    const statsView = $('#statsView');

    // 看板列
    const todoList = $('#todoList');
    const inprogressList = $('#inprogressList');
    const doneList = $('#doneList');
    const countTodo = $('#countTodo');
    const countInprogress = $('#countInprogress');
    const countDone = $('#countDone');

    // 列表
    const listBody = $('#listBody');

    // 统计
    const statTotal = $('#statTotal');
    const statTodo = $('#statTodo');
    const statInprogress = $('#statInprogress');
    const statDone = $('#statDone');
    const completionBar = $('#completionBar');
    const completionPercent = $('#completionPercent');
    const categoryBars = $('#categoryBars');

    // 模态框
    const modalOverlay = $('#modalOverlay');
    const modalTitle = $('#modalTitle');
    const modalClose = $('#modalClose');
    const taskForm = $('#taskForm');
    const taskIdField = $('#taskId');
    const taskName = $('#taskName');
    const taskDesc = $('#taskDesc');
    const taskCategory = $('#taskCategory');
    const taskPriority = $('#taskPriority');
    const taskStatus = $('#taskStatus');
    const taskDueDate = $('#taskDueDate');
    const cancelBtn = $('#cancelBtn');

    // 删除模态框
    const deleteOverlay = $('#deleteOverlay');
    const deleteClose = $('#deleteClose');
    const deleteCancelBtn = $('#deleteCancelBtn');
    const deleteConfirmBtn = $('#deleteConfirmBtn');

    // ============================
    // 类别和状态映射
    // ============================
    const categoryLabels = {
        work: '工作',
        personal: '个人',
        study: '学习',
        other: '其他'
    };

    const priorityLabels = {
        high: '高',
        medium: '中',
        low: '低'
    };

    const statusLabels = {
        todo: '待办',
        inprogress: '进行中',
        done: '已完成'
    };

    // ============================
    // 筛选逻辑
    // ============================
    function getFilteredTasks() {
        const search = searchInput.value.trim().toLowerCase();
        const priority = filterPriority.value;
        const category = filterCategory.value;

        return tasks.filter(task => {
            const matchSearch = !search || 
                task.name.toLowerCase().includes(search) || 
                (task.description && task.description.toLowerCase().includes(search));
            const matchPriority = priority === 'all' || task.priority === priority;
            const matchCategory = category === 'all' || task.category === category;
            return matchSearch && matchPriority && matchCategory;
        });
    }

    // ============================
    // 渲染 - 看板视图
    // ============================
    function renderBoard() {
        const filtered = getFilteredTasks();
        const todoTasks = filtered.filter(t => t.status === 'todo');
        const inprogressTasks = filtered.filter(t => t.status === 'inprogress');
        const doneTasks = filtered.filter(t => t.status === 'done');

        countTodo.textContent = todoTasks.length;
        countInprogress.textContent = inprogressTasks.length;
        countDone.textContent = doneTasks.length;

        todoList.innerHTML = todoTasks.length 
            ? todoTasks.map(createTaskCard).join('') 
            : createEmptyState('暂无待办任务');
        inprogressList.innerHTML = inprogressTasks.length 
            ? inprogressTasks.map(createTaskCard).join('') 
            : createEmptyState('暂无进行中任务');
        doneList.innerHTML = doneTasks.length 
            ? doneTasks.map(createTaskCard).join('') 
            : createEmptyState('暂无已完成任务');
    }

    function createTaskCard(task) {
        const dueDateHtml = task.dueDate ? 
            `<span class="task-due ${isOverdue(task) ? 'overdue' : ''}">&#128197; ${formatDate(task.dueDate)}</span>` : '';
        
        return `
            <div class="task-card" data-id="${task.id}">
                <div class="task-card-header">
                    <span class="task-card-title">${escapeHtml(task.name)}</span>
                    <div class="task-card-actions">
                        <button class="btn-icon edit-btn" data-id="${task.id}" title="编辑">&#9998;</button>
                        <button class="btn-icon delete-btn" data-id="${task.id}" title="删除">&#128465;</button>
                    </div>
                </div>
                ${task.description ? `<p class="task-card-desc">${escapeHtml(task.description)}</p>` : ''}
                <div class="task-card-footer">
                    <div class="task-tags">
                        <span class="tag tag-priority-${task.priority}">${priorityLabels[task.priority]}</span>
                        <span class="tag tag-category">${categoryLabels[task.category]}</span>
                    </div>
                    ${dueDateHtml}
                </div>
            </div>
        `;
    }

    function createEmptyState(text) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">&#128203;</div>
                <div class="empty-state-text">${text}</div>
            </div>
        `;
    }

    // ============================
    // 渲染 - 列表视图
    // ============================
    function renderList() {
        const filtered = getFilteredTasks();
        
        if (filtered.length === 0) {
            listBody.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">&#128203;</div>
                    <div class="empty-state-text">没有找到匹配的任务</div>
                </div>
            `;
            return;
        }

        listBody.innerHTML = filtered.map(task => {
            const isDone = task.status === 'done';
            return `
                <div class="list-row" data-id="${task.id}">
                    <span class="col-check">
                        <div class="list-check ${isDone ? 'checked' : ''}" data-id="${task.id}">
                            ${isDone ? '&#10003;' : ''}
                        </div>
                    </span>
                    <span class="list-col col-name task-name-cell ${isDone ? 'done-task' : ''}">${escapeHtml(task.name)}</span>
                    <span class="list-col col-category"><span class="tag tag-category">${categoryLabels[task.category]}</span></span>
                    <span class="list-col col-priority"><span class="tag tag-priority-${task.priority}">${priorityLabels[task.priority]}</span></span>
                    <span class="list-col col-status"><span class="status-badge status-${task.status}">${statusLabels[task.status]}</span></span>
                    <span class="list-col col-date task-due ${isOverdue(task) ? 'overdue' : ''}">${task.dueDate ? formatDate(task.dueDate) : '-'}</span>
                    <span class="list-col col-actions">
                        <div class="list-actions">
                            <button class="btn-icon edit-btn" data-id="${task.id}" title="编辑">&#9998;</button>
                            <button class="btn-icon delete-btn" data-id="${task.id}" title="删除">&#128465;</button>
                        </div>
                    </span>
                </div>
            `;
        }).join('');
    }

    // ============================
    // 渲染 - 统计视图
    // ============================
    function renderStats() {
        const total = tasks.length;
        const todo = tasks.filter(t => t.status === 'todo').length;
        const inprog = tasks.filter(t => t.status === 'inprogress').length;
        const done = tasks.filter(t => t.status === 'done').length;

        statTotal.textContent = total;
        statTodo.textContent = todo;
        statInprogress.textContent = inprog;
        statDone.textContent = done;

        // 完成率
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;
        completionBar.style.width = percent + '%';
        completionPercent.textContent = percent + '%';

        // 类别分布
        const categories = ['work', 'personal', 'study', 'other'];
        const catCounts = {};
        categories.forEach(c => {
            catCounts[c] = tasks.filter(t => t.category === c).length;
        });
        const maxCat = Math.max(...Object.values(catCounts), 1);

        categoryBars.innerHTML = categories.map(cat => {
            const count = catCounts[cat];
            const width = total > 0 ? (count / maxCat) * 100 : 0;
            return `
                <div class="cat-bar-row">
                    <span class="cat-bar-label">${categoryLabels[cat]}</span>
                    <div class="cat-bar-track">
                        <div class="cat-bar-fill ${cat}" style="width: ${width}%"></div>
                    </div>
                    <span class="cat-bar-count">${count}</span>
                </div>
            `;
        }).join('');
    }

    // ============================
    // 渲染总入口
    // ============================
    function render() {
        renderBoard();
        renderList();
        renderStats();
    }

    // ============================
    // 视图切换
    // ============================
    function switchView(view) {
        currentView = view;
        $$('.nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
        boardView.classList.toggle('hidden', view !== 'board');
        listView.classList.toggle('hidden', view !== 'list');
        statsView.classList.toggle('hidden', view !== 'stats');
    }

    // ============================
    // 模态框控制
    // ============================
    function openModal(taskId) {
        editingTaskId = taskId || null;
        
        if (taskId) {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;
            modalTitle.textContent = '编辑任务';
            taskIdField.value = task.id;
            taskName.value = task.name;
            taskDesc.value = task.description || '';
            taskCategory.value = task.category;
            taskPriority.value = task.priority;
            taskStatus.value = task.status;
            taskDueDate.value = task.dueDate || '';
        } else {
            modalTitle.textContent = '新建任务';
            taskForm.reset();
            taskIdField.value = '';
        }
        
        modalOverlay.classList.remove('hidden');
        taskName.focus();
    }

    function closeModal() {
        modalOverlay.classList.add('hidden');
        editingTaskId = null;
    }

    function openDeleteModal(taskId) {
        deletingTaskId = taskId;
        deleteOverlay.classList.remove('hidden');
    }

    function closeDeleteModal() {
        deleteOverlay.classList.add('hidden');
        deletingTaskId = null;
    }

    // ============================
    // 任务 CRUD
    // ============================
    function saveTask() {
        const name = taskName.value.trim();
        if (!name) {
            taskName.focus();
            taskName.style.borderColor = 'var(--danger)';
            setTimeout(() => { taskName.style.borderColor = ''; }, 2000);
            return;
        }

        const taskData = {
            name: name,
            description: taskDesc.value.trim(),
            category: taskCategory.value,
            priority: taskPriority.value,
            status: taskStatus.value,
            dueDate: taskDueDate.value || null
        };

        if (editingTaskId) {
            // 编辑
            const index = tasks.findIndex(t => t.id === editingTaskId);
            if (index !== -1) {
                tasks[index] = { ...tasks[index], ...taskData };
            }
        } else {
            // 新建
            tasks.unshift({
                id: generateId(),
                ...taskData,
                createdAt: new Date().toISOString()
            });
        }

        saveTasks(tasks);
        closeModal();
        render();
    }

    function deleteTask(taskId) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks(tasks);
        closeDeleteModal();
        render();
    }

    function toggleTaskStatus(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        
        if (task.status === 'done') {
            task.status = 'todo';
        } else {
            task.status = 'done';
        }
        
        saveTasks(tasks);
        render();
    }

    // ============================
    // 工具函数
    // ============================
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr + 'T00:00:00');
        const month = d.getMonth() + 1;
        const day = d.getDate();
        return `${month}月${day}日`;
    }

    function isOverdue(task) {
        if (!task.dueDate || task.status === 'done') return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(task.dueDate + 'T00:00:00');
        return due < today;
    }

    // ============================
    // 事件绑定
    // ============================
    function initEvents() {
        // 导航切换
        $$('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => switchView(btn.dataset.view));
        });

        // 新建任务
        addTaskBtn.addEventListener('click', () => openModal(null));

        // 搜索和筛选
        searchInput.addEventListener('input', render);
        filterPriority.addEventListener('change', render);
        filterCategory.addEventListener('change', render);

        // 模态框关闭
        modalClose.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });

        // 表单提交
        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveTask();
        });

        // 删除模态框
        deleteClose.addEventListener('click', closeDeleteModal);
        deleteCancelBtn.addEventListener('click', closeDeleteModal);
        deleteConfirmBtn.addEventListener('click', () => {
            if (deletingTaskId) deleteTask(deletingTaskId);
        });
        deleteOverlay.addEventListener('click', (e) => {
            if (e.target === deleteOverlay) closeDeleteModal();
        });

        // 看板卡片点击（编辑/删除）- 事件委托
        document.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-btn');
            const deleteBtn = e.target.closest('.delete-btn');
            const checkEl = e.target.closest('.list-check');

            if (editBtn) {
                e.stopPropagation();
                openModal(editBtn.dataset.id);
            } else if (deleteBtn) {
                e.stopPropagation();
                openDeleteModal(deleteBtn.dataset.id);
            } else if (checkEl) {
                e.stopPropagation();
                toggleTaskStatus(checkEl.dataset.id);
            }
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (!deleteOverlay.classList.contains('hidden')) {
                    closeDeleteModal();
                } else if (!modalOverlay.classList.contains('hidden')) {
                    closeModal();
                }
            }
            // Ctrl+N 新建任务
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                openModal(null);
            }
        });
    }

    // ============================
    // 初始化
    // ============================
    function init() {
        initEvents();
        render();
    }

    // DOM 加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();