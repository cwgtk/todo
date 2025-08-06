// 전역 변수
let todos = [];
let currentView = 'list';
let currentDate = new Date();
let editingTodoId = null;

// DOM 요소
const todoInput = document.getElementById('todoInput');
const todoDate = document.getElementById('todoDate');
const addTodoBtn = document.getElementById('addTodoBtn');
const todoList = document.getElementById('todoList');
const listView = document.getElementById('listView');
const calendarView = document.getElementById('calendarView');
const listViewBtn = document.getElementById('listViewBtn');
const calendarViewBtn = document.getElementById('calendarViewBtn');
const calendar = document.getElementById('calendar');
const currentMonthElement = document.getElementById('currentMonth');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const editModal = document.getElementById('editModal');
const editTodoInput = document.getElementById('editTodoInput');
const editTodoDate = document.getElementById('editTodoDate');
const saveEditBtn = document.getElementById('saveEdit');
const cancelEditBtn = document.getElementById('cancelEdit');
const closeModalBtn = document.getElementById('closeModal');

// 필터 버튼들
const filterBtns = document.querySelectorAll('.filter-btn');
let currentFilter = 'all';

// 통계 요소들
const totalTodosElement = document.getElementById('totalTodos');
const completedTodosElement = document.getElementById('completedTodos');
const pendingTodosElement = document.getElementById('pendingTodos');

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 오늘 날짜를 기본값으로 설정
    const today = new Date();
    todoDate.value = formatDateForInput(today);
    
    // 로컬 스토리지에서 데이터 로드
    loadTodosFromStorage();
    
    // 이벤트 리스너 등록
    addEventListeners();
    
    // 초기 렌더링
    renderTodos();
    renderCalendar();
    updateStats();
});

// 이벤트 리스너 등록
function addEventListeners() {
    // 할 일 추가
    addTodoBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTodo();
        }
    });

    // 뷰 전환
    listViewBtn.addEventListener('click', () => switchView('list'));
    calendarViewBtn.addEventListener('click', () => switchView('calendar'));

    // 달력 네비게이션
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // 필터 버튼들
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 기존 active 클래스 제거
            filterBtns.forEach(b => b.classList.remove('active'));
            // 현재 버튼에 active 클래스 추가
            this.classList.add('active');
            currentFilter = this.getAttribute('data-filter');
            renderTodos();
        });
    });

    // 모달 관련
    saveEditBtn.addEventListener('click', saveEditedTodo);
    cancelEditBtn.addEventListener('click', closeEditModal);
    closeModalBtn.addEventListener('click', closeEditModal);
    
    // 모달 외부 클릭 시 닫기
    editModal.addEventListener('click', function(e) {
        if (e.target === editModal) {
            closeEditModal();
        }
    });
}

// 날짜를 input[type="date"] 형식으로 변환
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 날짜를 표시용 형식으로 변환
function formatDateForDisplay(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

// 할 일 추가
function addTodo() {
    const text = todoInput.value.trim();
    const date = todoDate.value;

    if (!text) {
        alert('할 일을 입력해주세요!');
        return;
    }

    if (!date) {
        alert('날짜를 선택해주세요!');
        return;
    }

    const todo = {
        id: Date.now(),
        text: text,
        date: date,
        completed: false,
        createdAt: new Date().toLocaleString('ko-KR')
    };

    todos.push(todo);
    saveTodosToStorage();
    
    // 입력 필드 초기화
    todoInput.value = '';
    
    // 렌더링 업데이트
    renderTodos();
    renderCalendar();
    updateStats();

    // 성공 피드백
    showNotification('할 일이 추가되었습니다!', 'success');
}

// 할 일 완료 토글
function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodosToStorage();
        renderTodos();
        renderCalendar();
        updateStats();
    }
}

// 할 일 삭제
function deleteTodo(id) {
    if (confirm('정말로 이 할 일을 삭제하시겠습니까?')) {
        todos = todos.filter(t => t.id !== id);
        saveTodosToStorage();
        renderTodos();
        renderCalendar();
        updateStats();
        showNotification('할 일이 삭제되었습니다!', 'info');
    }
}

// 할 일 편집 모달 열기
function openEditModal(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        editingTodoId = id;
        editTodoInput.value = todo.text;
        editTodoDate.value = todo.date;
        editModal.classList.add('active');
        editTodoInput.focus();
    }
}

// 편집된 할 일 저장
function saveEditedTodo() {
    const text = editTodoInput.value.trim();
    const date = editTodoDate.value;

    if (!text) {
        alert('할 일을 입력해주세요!');
        return;
    }

    if (!date) {
        alert('날짜를 선택해주세요!');
        return;
    }

    const todo = todos.find(t => t.id === editingTodoId);
    if (todo) {
        todo.text = text;
        todo.date = date;
        saveTodosToStorage();
        closeEditModal();
        renderTodos();
        renderCalendar();
        showNotification('할 일이 수정되었습니다!', 'success');
    }
}

// 편집 모달 닫기
function closeEditModal() {
    editModal.classList.remove('active');
    editingTodoId = null;
    editTodoInput.value = '';
    editTodoDate.value = '';
}

// 뷰 전환
function switchView(view) {
    currentView = view;
    
    // 버튼 상태 업데이트
    listViewBtn.classList.toggle('active', view === 'list');
    calendarViewBtn.classList.toggle('active', view === 'calendar');
    
    // 뷰 표시/숨김
    listView.classList.toggle('active', view === 'list');
    calendarView.classList.toggle('active', view === 'calendar');
    
    if (view === 'calendar') {
        renderCalendar();
    }
}

// 할 일 목록 렌더링
function renderTodos() {
    const filteredTodos = getFilteredTodos();
    
    if (filteredTodos.length === 0) {
        todoList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <i class="fas fa-clipboard-list" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.3;"></i>
                <p style="font-size: 1.1rem;">할 일이 없습니다.</p>
                <p style="font-size: 0.9rem; margin-top: 5px;">새로운 할 일을 추가해보세요!</p>
            </div>
        `;
        return;
    }

    todoList.innerHTML = filteredTodos.map(todo => `
        <div class="todo-item ${todo.completed ? 'completed' : ''}">
            <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" 
                 onclick="toggleTodo(${todo.id})"></div>
            <div class="todo-content">
                <div class="todo-text">${escapeHtml(todo.text)}</div>
                <div class="todo-date">
                    <i class="fas fa-calendar-alt"></i>
                    ${formatDateForDisplay(todo.date)}
                </div>
            </div>
            <div class="todo-actions">
                <button class="action-btn edit-btn" onclick="openEditModal(${todo.id})">
                    <i class="fas fa-edit"></i>
                    수정
                </button>
                <button class="action-btn delete-btn" onclick="deleteTodo(${todo.id})">
                    <i class="fas fa-trash"></i>
                    삭제
                </button>
            </div>
        </div>
    `).join('');
}

// 필터링된 할 일 목록 가져오기
function getFilteredTodos() {
    switch (currentFilter) {
        case 'completed':
            return todos.filter(todo => todo.completed);
        case 'pending':
            return todos.filter(todo => !todo.completed);
        default:
            return todos;
    }
}

// 달력 렌더링
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 월 표시 업데이트
    currentMonthElement.textContent = `${year}년 ${month + 1}월`;
    
    // 달력 생성
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const calendarHTML = [];
    
    // 요일 헤더
    const dayHeaders = ['일', '월', '화', '수', '목', '금', '토'];
    calendarHTML.push(`
        <div class="calendar-grid">
            ${dayHeaders.map(day => `<div class="calendar-header-cell">${day}</div>`).join('')}
    `);
    
    // 날짜 셀들
    const today = new Date();
    const currentDateStr = formatDateForInput(today);
    
    for (let i = 0; i < 42; i++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + i);
        
        const dateStr = formatDateForInput(cellDate);
        const isCurrentMonth = cellDate.getMonth() === month;
        const isToday = dateStr === currentDateStr;
        const dayTodos = todos.filter(todo => todo.date === dateStr);
        
        const cellClass = [
            'calendar-cell',
            !isCurrentMonth ? 'other-month' : '',
            isToday ? 'today' : ''
        ].filter(Boolean).join(' ');
        
        calendarHTML.push(`
            <div class="${cellClass}">
                <div class="calendar-date">${cellDate.getDate()}</div>
                <div class="calendar-todos">
                    ${dayTodos.slice(0, 3).map(todo => `
                        <div class="calendar-todo-item ${todo.completed ? 'completed' : ''}"
                             title="${escapeHtml(todo.text)}">
                            ${escapeHtml(todo.text)}
                        </div>
                    `).join('')}
                    ${dayTodos.length > 3 ? `<div class="calendar-todo-item" style="background: var(--text-secondary);">+${dayTodos.length - 3}</div>` : ''}
                </div>
            </div>
        `);
    }
    
    calendarHTML.push('</div>');
    calendar.innerHTML = calendarHTML.join('');
}

// 통계 업데이트
function updateStats() {
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const pending = total - completed;
    
    totalTodosElement.textContent = total;
    completedTodosElement.textContent = completed;
    pendingTodosElement.textContent = pending;
}

// HTML 이스케이프
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 알림 표시
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--success-color)' : 
                    type === 'error' ? '#ffb3b3' : 'var(--primary-color)'};
        color: ${type === 'success' || type === 'info' ? 'white' : 'var(--text-primary)'};
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: var(--shadow-hover);
        z-index: 10000;
        font-weight: 500;
        animation: slideInRight 0.3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // 3초 후 제거
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 로컬 스토리지에 저장
function saveTodosToStorage() {
    try {
        localStorage.setItem('todos', JSON.stringify(todos));
    } catch (error) {
        console.error('할 일 저장 중 오류 발생:', error);
        showNotification('저장 중 오류가 발생했습니다.', 'error');
    }
}

// 로컬 스토리지에서 로드
function loadTodosFromStorage() {
    try {
        const savedTodos = localStorage.getItem('todos');
        if (savedTodos) {
            todos = JSON.parse(savedTodos);
        }
    } catch (error) {
        console.error('할 일 로드 중 오류 발생:', error);
        todos = [];
        showNotification('데이터 로드 중 오류가 발생했습니다.', 'error');
    }
}

// CSS 애니메이션 추가 (동적으로)
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style); 