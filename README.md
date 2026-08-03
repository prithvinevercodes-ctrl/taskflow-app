# TaskFlow - Task Management Web Application

TaskFlow is a secure, responsive full-stack task management web application developed as part of an internship project. It allows users to create, update, track, search, and filter personal tasks while enforcing user-based authorization and clean layered architecture.

## 🚀 Features

- **Authentication & Authorization**: User registration, login, logout, and password security.
- **Task CRUD Operations**: Create, Read, Update, and Delete tasks.
- **Status & Priority Tracking**: 
  - Statuses: `TODO`, `IN_PROGRESS`, `COMPLETED`
  - Priorities: `HIGH`, `MEDIUM`, `LOW`
  - Due Dates with overdue indicators
- **Search & Multi-Filter**: Search by title/description and filter by status and priority simultaneously.
- **Dashboard Metrics**: Live statistics cards showing total tasks, pending/in-progress count, and completed count.
- **Responsive UI**: Hand-crafted, modern Bootstrap 5 interface designed for desktop, tablet, and mobile devices.

## 🛠️ Technology Stack

- **Backend**: Java, Spring Boot, Spring REST, Spring Data JPA, Hibernate, Spring Security, BCrypt.
- **Frontend**: HTML5, CSS3, JavaScript (ES6+ Fetch API), Bootstrap 5.
- **Build Tool**: Apache Maven (`pom.xml`).
- **Database**: Relational Database (H2 / MySQL).

## 📂 Project Structure

```text
task-management-app/
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/internship/taskflow/
│       ├── TaskFlowApplication.java
│       ├── config/SecurityConfig.java
│       ├── controller/AuthController.java & TaskController.java
│       ├── dto/LoginRequest.java, RegisterRequest.java, TaskDto.java
│       ├── model/User.java, Task.java, TaskStatus.java, Priority.java
│       ├── repository/UserRepository.java, TaskRepository.java
│       └── service/AuthService.java, TaskService.java
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/api.js, auth.js, app.js
└── runner/
    └── DevServer.java
```

## 🔌 REST API Specification

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Log in user & initialize session |
| `POST` | `/api/auth/logout` | Log out user |
| `GET` | `/api/auth/me` | Fetch authenticated user profile |
| `GET` | `/api/tasks` | Get all tasks belonging to logged-in user |
| `POST` | `/api/tasks` | Create a new task |
| `GET` | `/api/tasks/{id}` | Get specific task details |
| `PUT` | `/api/tasks/{id}` | Update task status, title, description, priority, due date |
| `DELETE` | `/api/tasks/{id}` | Delete task |

## 💻 Running the Application

### Option 1: Embedded Java Dev Runner (Quickest)
Run the embedded DevServer using Java or Python:
```bash
python runner/dev_server.py
```
Then open `http://localhost:8080` in your web browser.

### Option 2: Spring Boot & Maven
```bash
cd backend
mvn spring-boot:run
```
Open `frontend/index.html` or serve via your preferred static file server.
