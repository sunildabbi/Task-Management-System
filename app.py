from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS  # Import CORS
from flask_migrate import Migrate  # Import Migrate

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
db = SQLAlchemy(app)
migrate = Migrate(app, db)  # Initialize Migrate

# Enable CORS for your app (allows cross-origin requests)
CORS(app)  # This will allow your frontend to make requests to the backend

# Define the Task model with an additional 'status' field
class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(200), nullable=True)
    due_date = db.Column(db.String(50), nullable=True)
    status = db.Column(db.String(50), default='Pending')  # Default status is 'Pending'

# Home route
@app.route('/')
def home():
    return "Task Manager Backend is Running!"

# Create Task route
@app.route('/tasks', methods=['POST'])
def create_task():
    data = request.get_json()
    new_task = Task(
        title=data['title'],
        description=data.get('description', ''),
        due_date=data.get('due_date', ''),
        status=data.get('status', 'Pending')  # Default to 'Pending' if no status is provided
    )
    db.session.add(new_task)
    db.session.commit()
    return jsonify({'message': 'Task created successfully', 'task_id': new_task.id})

# Get all tasks or filter by status route
@app.route('/tasks', methods=['GET'])
def get_all_tasks():
    status = request.args.get('status')  # Get status filter from query parameters
    
    if status:
        # Ensure status is valid before querying
        if status not in ['Pending', 'In Progress', 'Completed']:
            return jsonify({'message': 'Invalid status'}), 400
        tasks = Task.query.filter_by(status=status).all()  # Filter tasks based on status
    else:
        tasks = Task.query.all()  # Return all tasks if no filter is provided

    tasks_list = [{"id": task.id, "title": task.title, "description": task.description, "due_date": task.due_date, "status": task.status} for task in tasks]
    return jsonify(tasks_list)

# Update Task route (to update title, description, etc.)
@app.route('/tasks/<int:id>', methods=['PUT'])
def update_task(id):
    task = Task.query.get(id)
    if task is None:
        return jsonify({'message': 'Task not found'}), 404

    data = request.get_json()
    task.title = data.get('title', task.title)
    task.description = data.get('description', task.description)
    task.due_date = data.get('due_date', task.due_date)
    task.status = data.get('status', task.status)  # Update the status if provided
    db.session.commit()
    return jsonify({'message': 'Task updated successfully'})

# Toggle Task Status route (Pending <-> Completed) - PATCH Method
@app.route('/tasks/<int:id>/toggle', methods=['PATCH'])
def toggle_status(id):
    task = Task.query.get(id)
    if task is None:
        return jsonify({'message': 'Task not found'}), 404
    
    # Toggle the status between Pending and Completed
    if task.status == 'Pending':
        task.status = 'Completed'
    elif task.status == 'Completed':
        task.status = 'Pending'
    else:
        return jsonify({'message': 'Invalid status'}), 400  # Handle unexpected statuses
    
    db.session.commit()
    return jsonify({'message': f'Task status updated to {task.status}'}), 200

# Delete Task route
@app.route('/tasks/<int:id>', methods=['DELETE'])
def delete_task(id):
    task = Task.query.get(id)
    if task is None:
        return jsonify({'message': 'Task not found'}), 404

    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': 'Task deleted successfully'})

if __name__ == "__main__":
    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()

    app.run(debug=True)
