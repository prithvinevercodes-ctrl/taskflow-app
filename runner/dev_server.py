"""
TaskFlow Dev Server & REST Runner
Serves the TaskFlow frontend and REST API on http://localhost:8080
"""

import http.server
import socketserver
import json
import os
import urllib.parse

PORT = 8080
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend')
FRONTEND_DIR = os.path.abspath(FRONTEND_DIR)

# In-memory storage for local dev testing
TASKS_DB = [
    {
        "id": 1,
        "title": "Set up Spring Boot & Java backend",
        "description": "Configure Maven pom.xml, Spring Data JPA repositories, and REST API controllers.",
        "status": "COMPLETED",
        "priority": "HIGH",
        "dueDate": "2026-08-04",
        "createdAt": "2026-08-03T10:00:00",
        "userId": 1
    },
    {
        "id": 2,
        "title": "Build Bootstrap 5 dashboard UI",
        "description": "Implement task list cards, metrics summary, and responsive layout for mobile and desktop.",
        "status": "IN_PROGRESS",
        "priority": "HIGH",
        "dueDate": "2026-08-05",
        "createdAt": "2026-08-03T11:00:00",
        "userId": 1
    },
    {
        "id": 3,
        "title": "Implement search and status filters",
        "description": "Allow users to filter tasks by TODO, IN_PROGRESS, and COMPLETED, or search by text.",
        "status": "TODO",
        "priority": "MEDIUM",
        "dueDate": "2026-08-07",
        "createdAt": "2026-08-03T12:00:00",
        "userId": 1
    }
]

USERS_DB = {
    "user@example.com": {
        "id": 1,
        "name": "Internship Developer",
        "email": "user@example.com",
        "password": "password123"
    }
}

class TaskFlowHandler(http.server.SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_DIR, **kwargs)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def send_json(self, data, status_code=200):
        self.send_response(status_code)
        self.send_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path == '/api/tasks':
            status = query.get('status', [''])[0]
            priority = query.get('priority', [''])[0]
            search = query.get('search', [''])[0].lower()

            filtered = TASKS_DB
            if status:
                filtered = [t for t in filtered if t.get('status') == status]
            if priority:
                filtered = [t for t in filtered if t.get('priority') == priority]
            if search:
                filtered = [t for t in filtered if search in t.get('title', '').lower() or search in t.get('description', '').lower()]

            self.send_json(filtered)
            return

        elif path.startswith('/api/tasks/'):
            try:
                task_id = int(path.split('/')[-1])
                task = next((t for t in TASKS_DB if t['id'] == task_id), None)
                if task:
                    self.send_json(task)
                else:
                    self.send_json({'message': 'Task not found'}, 404)
            except ValueError:
                self.send_json({'message': 'Invalid task ID'}, 400)
            return

        # Fallback to static frontend server
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get('Content-Length', 0))
        body_raw = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'
        data = json.loads(body_raw) if body_raw else {}

        if path == '/api/auth/register':
            email = data.get('email')
            name = data.get('name')
            password = data.get('password')
            user_id = len(USERS_DB) + 1
            USERS_DB[email] = {'id': user_id, 'name': name, 'email': email, 'password': password}
            self.send_json({'id': user_id, 'name': name, 'email': email, 'message': 'Registration successful'})
            return

        elif path == '/api/auth/login':
            email = data.get('email')
            password = data.get('password')
            user = USERS_DB.get(email)
            if user:
                self.send_json({'id': user['id'], 'name': user['name'], 'email': user['email'], 'message': 'Login successful'})
            else:
                name = email.split('@')[0].capitalize()
                self.send_json({'id': 1, 'name': name, 'email': email, 'message': 'Login successful'})
            return

        elif path == '/api/auth/logout':
            self.send_json({'message': 'Logged out successfully'})
            return

        elif path == '/api/tasks':
            new_task = {
                'id': len(TASKS_DB) + 100,
                'title': data.get('title', 'Untitled'),
                'description': data.get('description', ''),
                'status': data.get('status', 'TODO'),
                'priority': data.get('priority', 'MEDIUM'),
                'dueDate': data.get('dueDate'),
                'createdAt': '2026-08-03T12:00:00',
                'userId': data.get('userId', 1)
            }
            TASKS_DB.insert(0, new_task)
            self.send_json(new_task, 201)
            return

        self.send_json({'message': 'Not found'}, 404)

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path.startswith('/api/tasks/'):
            try:
                task_id = int(path.split('/')[-1])
                content_length = int(self.headers.get('Content-Length', 0))
                body_raw = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'
                data = json.loads(body_raw) if body_raw else {}

                for task in TASKS_DB:
                    if task['id'] == task_id:
                        if 'title' in data: task['title'] = data['title']
                        if 'description' in data: task['description'] = data['description']
                        if 'status' in data: task['status'] = data['status']
                        if 'priority' in data: task['priority'] = data['priority']
                        if 'dueDate' in data: task['dueDate'] = data['dueDate']
                        self.send_json(task)
                        return

                self.send_json({'message': 'Task not found'}, 404)
            except Exception as e:
                self.send_json({'message': str(e)}, 400)
            return

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path.startswith('/api/tasks/'):
            try:
                task_id = int(path.split('/')[-1])
                global TASKS_DB
                TASKS_DB = [t for t in TASKS_DB if t['id'] != task_id]
                self.send_response(204)
                self.send_cors_headers()
                self.end_headers()
            except Exception as e:
                self.send_json({'message': str(e)}, 400)
            return

def run_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), TaskFlowHandler) as httpd:
        print(f"TaskFlow Server running at http://localhost:{PORT}")
        print("Press Ctrl+C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")

if __name__ == '__main__':
    run_server()
