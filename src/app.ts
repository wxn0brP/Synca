import "@wxn0brp/flanker-ui/html";

const EDIT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
const TRASH_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
const SAVE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>`;
const X_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

const todoForm = qs<HTMLFormElement>("#todo-form");
const todoInput = qs<HTMLInputElement>("#todo-input");
const todoList = qs<HTMLUListElement>("#todo-list");
const syncIndicator = qs<HTMLDivElement>("#sync-indicator");
const syncStatusText = syncIndicator.querySelector(".status-text") as HTMLElement;
const syncStatusDot = syncIndicator.querySelector(".status-dot") as HTMLElement;
const taskCount = qs<HTMLSpanElement>("#task-count");

interface Todo {
    _id: string;
    title: string;
    completed: boolean;
}

function setSyncStatus(status: "ready" | "syncing" | "error") {
    syncIndicator.className = "sync-badge"; // Reset classes
    if (status === "syncing") {
        syncStatusText.textContent = "Syncing...";
        syncIndicator.classList.add("syncing");
        syncStatusDot.style.backgroundColor = "#fbbf24"; // Amber
    } else if (status === "error") {
        syncStatusText.textContent = "Sync Failed";
        syncIndicator.classList.add("sync-error");
        syncStatusDot.style.backgroundColor = "#ef4444"; // Red
    } else {
        syncStatusText.textContent = "Ready";
        syncStatusDot.style.backgroundColor = "#10b981"; // Green
    }
}

async function _fetch(method: string, body?: any, url = "todo") {
    try {
        const response = await fetch("/" + url, {
            method,
            headers: {
                "Content-Type": "application/json",
            },
            body: body && JSON.stringify(body),
        });
        return response.json();
    } catch (e) {
        throw e;
    }
}

async function fetchTodos() {
    try {
        const response = await _fetch("GET");
        renderTodos(response.todo || []);
    } catch (error) {
        console.error("Error fetching todos:", error);
    }
}

function renderTodos(todos: Todo[]) {
    todoList.innerHTML = "";
    taskCount.textContent = `${todos.length} task${todos.length === 1 ? "" : "s"}`;

    todos.forEach(todo => {
        const li = document.createElement("li");
        li.dataset.id = todo._id;

        const titleSpan = document.createElement("span");
        titleSpan.className = "todo-content title";
        titleSpan.textContent = todo.title;
        li.appendChild(titleSpan);

        const actionsDiv = document.createElement("div");
        actionsDiv.className = "actions";

        const editButton = document.createElement("button");
        editButton.innerHTML = EDIT_ICON;
        editButton.className = "icon-btn edit-btn";
        editButton.title = "Edit";
        actionsDiv.appendChild(editButton);

        const deleteButton = document.createElement("button");
        deleteButton.innerHTML = TRASH_ICON;
        deleteButton.className = "icon-btn delete delete-btn";
        deleteButton.title = "Delete";
        actionsDiv.appendChild(deleteButton);

        li.appendChild(actionsDiv);
        todoList.appendChild(li);
    });
}

async function performSync() {
    setSyncStatus("syncing");
    try {
        const res = await _fetch("GET", null, "sync");
        if (res.ok) {
            setSyncStatus("ready");
            await fetchTodos();
        } else {
            setSyncStatus("error");
        }
    } catch (e) {
        setSyncStatus("error");
    }
}

async function addTodo(title: string) {
    try {
        await _fetch("POST", { title });
        await fetchTodos();
        performSync();
    } catch (e) {
        console.error("Error adding todo:", e);
    }
}

async function updateTodo(id: string, data: Partial<Omit<Todo, "_id">>) {
    try {
        await _fetch("PUT", { _id: id, ...data });
        await fetchTodos();
        performSync();
    } catch (e) {
        console.error("Error updating todo:", e);
    }
}

async function deleteTodo(id: string) {
    try {
        await _fetch("DELETE", { _id: id });
        await fetchTodos();
        performSync();
    } catch (e) {
        console.error("Error deleting todo:", e);
    }
}

todoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = todoInput.value.trim();
    if (!title) return;

    await addTodo(title);
    todoInput.value = "";
});

todoList.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const btn = target.closest("button");
    if (!btn) return;

    const li = btn.closest("li");
    if (!li) return;
    const id = li.dataset.id;
    if (!id) return;

    if (btn.classList.contains("delete-btn")) {
        deleteTodo(id);
    } else if (btn.classList.contains("edit-btn")) {
        const titleSpan = li.querySelector(".title");
        if (!titleSpan) return;

        const currentTitle = titleSpan.textContent || "";

        li.innerHTML = `
            <div class="edit-mode-group">
                <input type="text" class="edit-input" value="${currentTitle.replace(/"/g, "&quot;")}" />
                <button class="icon-btn save-btn" title="Save">${SAVE_ICON}</button>
                <button class="icon-btn cancel-btn" title="Cancel">${X_ICON}</button>
            </div>
        `;
        li.classList.add("editing");
        const input = li.querySelector<HTMLInputElement>(".edit-input");
        if (input) {
            input.focus();
            input.select();

            input.addEventListener("keydown", (ev) => {
                if (ev.key === "Enter") {
                    const newTitle = input.value.trim();
                    if (newTitle) updateTodo(id, { title: newTitle });
                } else if (ev.key === "Escape") {
                    fetchTodos();
                }
            });
        }
    } else if (btn.classList.contains("save-btn")) {
        const input = li.querySelector<HTMLInputElement>(".edit-input");
        if (!input) return;
        const newTitle = input.value.trim();
        if (newTitle) {
            updateTodo(id, { title: newTitle });
        } else {
            fetchTodos();
        }
    } else if (btn.classList.contains("cancel-btn")) {
        fetchTodos();
    }
});

syncIndicator.addEventListener("click", () => {
    performSync();
});

fetchTodos();
