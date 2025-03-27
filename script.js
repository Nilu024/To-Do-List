document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const taskInput = document.getElementById('taskInput');
    const addButton = document.getElementById('addButton');
    const taskList = document.getElementById('taskList');
    const totalTasksSpan = document.getElementById('totalTasks');
    const completedTasksSpan = document.getElementById('completedTasks');
    const emptyState = document.querySelector('.empty-state');
    const resetTimer = document.getElementById('resetTimer');

    // State Management
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let lastResetTime = localStorage.getItem('lastResetTime') || new Date().getTime();

    // Add dustbin element to DOM
    const dustbin = document.createElement('div');
    dustbin.className = 'dustbin';
    dustbin.innerHTML = '<i class="fas fa-trash"></i>';
    document.body.appendChild(dustbin);

    // Initialization
    createBubbles();
    checkForReset();
    renderTasks();
    setupEventListeners();
    startIntervals();

    // Core Functions
    function createBubbles() {
        const bubblesCount = 8;
        for (let i = 0; i < bubblesCount; i++) {
            const bubble = document.createElement('div');
            bubble.className = 'bubble';
            const size = Math.random() * 100 + 50;
            const left = Math.random() * 100;
            const top = Math.random() * 100;
            const delay = Math.random() * 10;
            const duration = Math.random() * 10 + 10;

            bubble.style.width = `${size}px`;
            bubble.style.height = `${size}px`;
            bubble.style.left = `${left}%`;
            bubble.style.top = `${top}%`;
            bubble.style.animationDelay = `${delay}s`;
            bubble.style.animationDuration = `${duration}s`;
            bubble.style.opacity = Math.random() * 0.2 + 0.05;

            document.body.appendChild(bubble);
        }
    }

    function checkForReset() {
        const now = new Date();
        const lastReset = new Date(parseInt(lastResetTime));

        // Check if we've crossed midnight since last reset
        if (now.getDate() !== lastReset.getDate() ||
            now.getMonth() !== lastReset.getMonth() ||
            now.getFullYear() !== lastReset.getFullYear()) {

            // Reset uncompleted tasks
            tasks = tasks.filter(task => task.completed);
            lastResetTime = now.getTime();
            saveTasks();
        }

        // Calculate time until next midnight reset
        updateResetTimer();
    }

    function updateResetTimer() {
        const now = new Date();
        const midnight = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1,  // Next day
            0, 0, 0, 0          // 00:00:00.000
        );
        const timeRemaining = midnight - now;

        const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

        resetTimer.textContent = `Resets at midnight: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Change color when less than 1 hour remains
        if (hours < 1) {
            resetTimer.style.color = 'var(--warning)';
        } else {
            resetTimer.style.color = 'var(--text-light)';
        }
    }

    function renderTasks() {
        taskList.innerHTML = '';

        if (tasks.length === 0) {
            taskList.appendChild(emptyState);
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            tasks.forEach((task, index) => {
                const listItem = document.createElement('li');
                listItem.className = task.completed ? 'completed' : '';
                listItem.style.animationDelay = `${index * 0.1}s`;

                const taskDate = new Date(task.createdAt);
                const timeString = taskDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                listItem.innerHTML = `
                    <div class="task-content">
                        <button class="complete-btn" data-id="${index}">
                            <i class="fas fa-check"></i>
                        </button>
                        <div>
                            <span class="task-text">${task.text}</span>
                            <div class="task-time">Added at ${timeString}</div>
                        </div>
                    </div>
                    <div class="actions">
                        <button class="delete-btn" data-id="${index}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                taskList.appendChild(listItem);
            });
        }
        updateStats();
    }

    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;

        totalTasksSpan.textContent = `${total} ${total === 1 ? 'task' : 'tasks'}`;
        completedTasksSpan.textContent = `${completed} completed`;

        // Animate stats update
        totalTasksSpan.style.transform = 'scale(1.1)';
        completedTasksSpan.style.transform = 'scale(1.1)';
        setTimeout(() => {
            totalTasksSpan.style.transform = 'scale(1)';
            completedTasksSpan.style.transform = 'scale(1)';
        }, 200);
    }

    // Task Management
    function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText) {
            // Create temporary "adding" animation
            taskInput.style.transform = 'translateY(-2px)';
            addButton.style.transform = 'translateY(-2px) scale(0.95)';

            setTimeout(() => {
                tasks.push({
                    text: taskText,
                    completed: false,
                    createdAt: new Date().toISOString()
                });

                saveTasks();
                taskInput.value = '';
                taskInput.focus();

                // Reset button animation
                addButton.style.transform = '';
                taskInput.style.transform = '';
            }, 200);
        } else {
            // Shake animation for empty input
            taskInput.style.animation = 'shake 0.5s';
            setTimeout(() => {
                taskInput.style.animation = '';
            }, 500);
        }
    }

    function deleteTask(index) {
        const taskElement = document.querySelector(`li:nth-child(${index + 1})`);
        if (taskElement) {
            // Clone the task element for animation
            const animatedTask = taskElement.cloneNode(true);
            animatedTask.style.position = 'fixed';
            animatedTask.style.top = `${taskElement.offsetTop}px`;
            animatedTask.style.left = `${taskElement.offsetLeft}px`;
            animatedTask.style.width = `${taskElement.offsetWidth}px`;
            animatedTask.style.margin = '0';
            animatedTask.style.pointerEvents = 'none';
            document.body.appendChild(animatedTask);
            
            // Hide original task immediately
            taskElement.style.opacity = '0';
            
            // Animate the cloned task
            animatedTask.style.animation = 'throwToBin 0.6s forwards';
            
            // Shake the dustbin
            dustbin.classList.add('shake');
            
            // Clean up and remove task after animation
            setTimeout(() => {
                animatedTask.remove();
                dustbin.classList.remove('shake');
                tasks.splice(index, 1);
                saveTasks();
            }, 600);
        }
    }

    function toggleComplete(index) {
        const wasCompleted = tasks[index].completed;
        tasks[index].completed = !wasCompleted;

        if (!wasCompleted) {
            const taskElement = document.querySelector(`li:nth-child(${index + 1})`);
            if (taskElement) {
                createConfetti(taskElement.querySelector('.complete-btn'));
            }
        }
        saveTasks();
    }

    function createConfetti(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 20; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = `${centerX}px`;
            confetti.style.top = `${centerY}px`;
            confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
            confetti.style.width = `${Math.random() * 8 + 4}px`;
            confetti.style.height = `${Math.random() * 8 + 4}px`;
            confetti.style.animationDelay = `${Math.random() * 0.5}s`;

            document.body.appendChild(confetti);

            setTimeout(() => confetti.remove(), 2000);
        }
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        localStorage.setItem('lastResetTime', lastResetTime);
        renderTasks();
    }

    // Event Handling
    function setupEventListeners() {
        function handleAddTask() {
            addTask();
        }

        addButton.addEventListener('click', handleAddTask);
        taskInput.addEventListener('keypress', (e) => e.key === 'Enter' && handleAddTask());

        taskList.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const index = parseInt(target.dataset.id);
            if (target.classList.contains('delete-btn')) deleteTask(index);
            if (target.classList.contains('complete-btn')) toggleComplete(index);
        });
    }

    function startIntervals() {
        const timerInterval = setInterval(updateResetTimer, 1000);
        const resetInterval = setInterval(checkForReset, 60 * 60 * 1000);

        window.addEventListener('beforeunload', () => {
            clearInterval(timerInterval);
            clearInterval(resetInterval);
        });
    }
});