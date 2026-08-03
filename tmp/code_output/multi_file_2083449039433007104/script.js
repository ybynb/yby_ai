/**
 * 任务记录网站核心逻辑
 * 包含：数据持久化(localStorage)、DOM渲染、事件委托、状态管理
 */

(function() {
    'use strict';

    // DOM 元素缓存
    const dom = {
        form: document.getElementById('taskForm'),
        inputs: {
            title: document.getElementById('taskTitle'),
            desc: document.getElementById('taskDesc'),
            date: document.getElementById('taskDate'),
            priority: document.getElementById('taskPriority')
        },
        container: document.getElementById('taskContainer'),
        emptyState: document.getElementById('emptyState'),
        countBadge: document.getElementById('taskCount'),
        filterBtns: document.querySelectorAll('.filter-btn')
    };

    // 应用状态
    let state = {
        tasks: [],
        currentFilter: 'all'
    };

    /**
     * 初始化应用
     */
    function init() {
        loadData();
        bindEvents();
        render();
    }

    /**
     * 从 localStorage 加载数据
     */
    function loadData() {
        try {
            const stored = localStorage.getItem('tasklog_data');
            state.tasks = stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('读取本地存储失败:', e);
            state.tasks = [];
        }
    }

    /**
     * 保存数据到 localStorage
     */
    function saveData() {
        try {
            localStorage.setItem('tasklog_data', JSON.stringify(state.tasks));
        } catch (e) {
            console.error('写入本地存储失败:', e);
        }
    }

    /**
     * 绑定全局事件监听
     */
    function bindEvents() {
        // 表单提交
        dom.form.addEventListener('submit', handleFormSubmit);
        
        // 设置默认日期为今天
        dom.inputs.date.valueAsDate = new Date();

        // 筛选按钮点击（事件委托）
        document.querySelector('.filter-nav').addEventListener('click', handleFilterClick);
        
        // 任务卡片操作（事件委托）
        dom.container.addEventListener('click', handleCardAction);
    }

    /**
     * 处理筛选切换
     */
    function handleFilterClick(e) {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;

        // 更新按钮激活状态
        dom.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // 更新状态并重新渲染
        state.currentFilter = btn.dataset.filter;
        render();
    }

    /**
     * 处理表单提交
     */
    function handleFormSubmit(e) {
        e.preventDefault();

        const titleVal = dom.inputs.title.value.trim();
        const descVal = dom.inputs.desc.value.trim();
        const dateVal = dom.inputs.date.value;
        const priorityVal = dom.inputs.priority.value;

        if (!titleVal || !dateVal) {
            alert('请填写完整的任务标题和截止日期');
            return;
        }

        const newTask = {
            id: Date.now().toString(),
            title: titleVal,
            desc: descVal,
            date: dateVal,
            priority: priorityVal,
            status: 'pending', // pending | in-progress | completed
            createdAt: new Date().toISOString()
        };

        state.tasks.unshift(newTask); // 新增的任务排在前面
        saveData();
        
        dom.form.reset();
        dom.inputs.date.valueAsDate = new Date(); // 重置日期
        
        render();
    }

    /**
     * 处理卡片内部按钮点击（删除/切换状态）
     */
    function handleCardAction(e) {
        const btn = e.target.closest('.action-btn');
        if (!btn) return;

        const taskId = btn.dataset.id;
        const action = btn.dataset.action;

        if (action === 'delete') {
            if (!confirm('确定要删除这条任务吗？此操作不可恢复。')) return;
            state.tasks = state.tasks.filter(t => t.id !== taskId);
            saveData();
            render();
        } else if (['complete', 'progress'].includes(action)) {
            const task = state.tasks.find(t => t.id === taskId);
            if (task) {
                task.status = action === 'complete' ? 'completed' : 'in-progress';
                saveData();
                render();
            }
        }
    }

    /**
     * 核心渲染函数
     */
    function render() {
        // 1. 过滤数据
        const filteredTasks = state.currentFilter === 'all' 
            ? state.tasks 
            : state.tasks.filter(t => t.status === state.currentFilter);

        // 2. 更新计数
        dom.countBadge.textContent = `共 ${filteredTasks.length} 项`;

        // 3. 处理空状态显示
        if (filteredTasks.length === 0) {
            dom.container.innerHTML = '';
            dom.emptyState.classList.remove('hidden');
            return;
        } else {
            dom.emptyState.classList.add('hidden');
        }

        // 4. 生成 HTML
        const htmlString = filteredTasks.map(task => createTaskCardHTML(task)).join('');
        dom.container.innerHTML = htmlString;
    }

    /**
     * 生成单个任务卡片的 HTML 模板字符串
     */
    function createTaskCardHTML(task) {
        const statusMap = {
            'pending': '<span class="badge badge-status-pending">待办</span>',
            'in-progress': '<span class="badge badge-status-in-progress">进行中</span>',
            'completed': '<span class="badge badge-status-completed">已完成</span>'
        };

        const priorityMap = {
            'low': '<span class="badge badge-priority-low">低</span>',
            'medium': '<span class="badge badge-priority-medium">中</span>',
            'high': '<span class="badge badge-priority-high">高</span>'
        };

        // 根据当前状态决定操作按钮的显示
        let actionButtons = '';
        if (task.status === 'pending') {
            actionButtons = `
                <button class="action-btn progress-btn" data-id="${task.id}" data-action="progress">▶ 进行中</button>
                <button class="action-btn complete-btn" data-id="${task.id}" data-action="complete">✓ 完成</button>
            `;
        } else if (task.status === 'in-progress') {
            actionButtons = `
                <button class="action-btn progress-btn" style="opacity:0.5; cursor:not-allowed;" disabled>进行中...</button>
                <button class="action-btn complete-btn" data-id="${task.id}" data-action="complete">✓ 完成</button>
            `;
        } else {
            actionButtons = `
                <button class="action-btn reset-btn" data-id="${task.id}" data-action="progress">↩ 重开</button>
            `;
        }

        actionButtons += `<button class="action-btn delete-btn" data-id="${task.id}" data-action="delete">🗑 删除</button>`;

        return `
            <article class="task-card">
                <div class="task-meta">
                    <span>${statusMap[task.status]}</span>
                    <span>${priorityMap[task.priority]}</span>
                </div>
                <h3 class="task-title">${escapeHtml(task.title)}</h3>
                ${task.desc ? `<p class="task-desc">${escapeHtml(task.desc)}</p>` : ''}
                <div class="task-date">⏰ 截止: ${task.date}</div>
                <div class="card-actions">
                    ${actionButtons}
                </div>
            </article>
        `;
    }

    /**
     * 防 XSS 简单转义
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    // 启动应用
    document.addEventListener('DOMContentLoaded', init);
})();