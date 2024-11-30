const apiUrl = "http://127.0.0.1:5000/tasks";
let editingTaskId = null; // Global variable to hold the ID of the task being edited

// Fetch and display all tasks, including filters
async function fetchTasks() {
    const statusFilter = document.getElementById('status-filter').value; // Get selected filter
    let url = apiUrl;

    // If a specific status filter is selected, update the URL
    if (statusFilter !== 'All') {
        url += `?status=${statusFilter}`; // Add filter to the URL
    }

    try {
        const response = await fetch(url);
        const data = await response.json();
        displayTasks(data);
    } catch (error) {
        console.error("Error fetching tasks:", error);
    }
}

// Display tasks
function displayTasks(tasks) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = "<h3>All Tasks</h3>"; // Clear current list and add header

    if (tasks.length === 0) {
        taskList.innerHTML += "<p>No tasks found.</p>";
        return;
    }

    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.classList.add('task');
        taskElement.innerHTML = `
            <div>
                <h3>${task.title}</h3>
                <p>${task.description}</p>
                <p>Due: ${task.due_date}</p>
                <p>Status: <span class="status-${task.status.toLowerCase()}">${task.status}</span></p>
            </div>
            <div class="task-actions">
                <button onclick="openEditForm(${task.id}, '${task.title}', '${task.description}', '${task.due_date}', '${task.status}')">Edit</button>
                <button onclick="deleteTask(${task.id})">Delete</button>
                <button onclick="changeTaskStatus(${task.id}, '${task.status}')">Change Status</button>
            </div>
        `;
        taskList.appendChild(taskElement);
    });

    // Hide the task form and show task list
    document.getElementById('task-form').style.display = 'none';
    taskList.style.display = 'block';
}

// Show the form to create a new task
function showCreateForm() {
    editingTaskId = null; // Reset editing task ID for creating new task
    document.getElementById('form-title').innerText = "Create a New Task";
    document.getElementById('submit-button').innerText = "Create";
    document.getElementById('task-form').style.display = 'block';
    document.getElementById('task-list').style.display = 'none';
}

// Show the form to edit an existing task
function openEditForm(id, title, description, dueDate, status) {
    editingTaskId = id; // Set task ID for editing
    document.getElementById('task-title').value = title;
    document.getElementById('task-description').value = description;
    document.getElementById('task-due-date').value = dueDate;
    document.getElementById('task-status').value = status;

    // Update form header and button text
    document.getElementById('form-title').innerText = "Edit Task";
    document.getElementById('submit-button').innerText = "Update";

    document.getElementById('task-form').style.display = 'block';
    document.getElementById('task-list').style.display = 'none';
}

// Submit the form to create or edit a task
async function submitTask() {
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const dueDate = document.getElementById('task-due-date').value;
    const status = document.getElementById('task-status').value;

    // Validate form fields
    if (!title || !description || !dueDate || !status) {
        alert("All fields are required.");
        return;
    }

    const taskData = { title, description, due_date: dueDate, status };
    let response;

    try {
        if (editingTaskId) {
            // Edit existing task
            response = await fetch(`${apiUrl}/${editingTaskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData),
            });
        } else {
            // Create new task
            response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData),
            });
        }

        if (response.ok) {
            fetchTasks(); // Refresh task list
            cancelCreateForm(); // Hide form
            showFlashMessage(editingTaskId ? "Task updated successfully!" : "Task created successfully!");
        } else {
            alert("Failed to save task.");
        }
    } catch (error) {
        console.error("Error saving task:", error);
    }
}

// Cancel the task creation/editing form
function cancelCreateForm() {
    document.getElementById('task-form').style.display = 'none';
    document.getElementById('task-list').style.display = 'block';

    // Reset form fields and button text
    document.getElementById('task-title').value = '';
    document.getElementById('task-description').value = '';
    document.getElementById('task-due-date').value = '';
    document.getElementById('task-status').value = 'Pending';
    document.getElementById('form-title').innerText = "Create a New Task";
    document.getElementById('submit-button').innerText = "Create";

    // Reset editing ID
    editingTaskId = null;
}

// Show flash message after task is created/edited
function showFlashMessage(message) {
    const flashMessage = document.getElementById('task-created-message');
    flashMessage.innerText = message; // Display the provided message
    flashMessage.style.display = 'block';
    setTimeout(() => {
        flashMessage.style.display = 'none';
    }, 3000);
}

// Delete a task
async function deleteTask(taskId) {
    const confirmation = confirm("Are you sure you want to delete this task?");
    if (!confirmation) return;

    try {
        const response = await fetch(`${apiUrl}/${taskId}`, { method: 'DELETE' });
        if (response.ok) {
            fetchTasks(); // Refresh task list
        } else {
            console.error("Failed to delete task:", response.statusText);
        }
    } catch (error) {
        console.error("Error deleting task:", error);
    }
}

// Change the status of a task
async function changeTaskStatus(taskId, currentStatus) {
    const newStatus = getNextStatus(currentStatus);

    try {
        const response = await fetch(`${apiUrl}/${taskId}/toggle`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
            fetchTasks(); // Refresh task list after status update
        } else {
            console.error("Failed to update task status:", response.statusText);
        }
    } catch (error) {
        console.error("Error updating task status:", error);
    }
}

// Helper function to determine the next status
function getNextStatus(currentStatus) {
    if (currentStatus === "Pending") return "In Progress";
    if (currentStatus === "In Progress") return "Completed";
    return "Pending"; // Wrap around to Pending if Completed
}

// Initialize fetching tasks on page load
document.addEventListener('DOMContentLoaded', fetchTasks);

// Filter tasks by status (triggered by user selection)
function filterTasksByStatus() {
    fetchTasks(); // Re-fetch tasks based on the selected filter
}
