package com.internship.taskflow.service;

import com.internship.taskflow.dto.TaskDto;
import com.internship.taskflow.exception.ResourceNotFoundException;
import com.internship.taskflow.model.Priority;
import com.internship.taskflow.model.Task;
import com.internship.taskflow.model.TaskStatus;
import com.internship.taskflow.model.User;
import com.internship.taskflow.repository.TaskRepository;
import com.internship.taskflow.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public TaskService(TaskRepository taskRepository, UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    public List<TaskDto> getTasks(Long userId, TaskStatus status, Priority priority, String search) {
        return taskRepository.filterTasks(userId, status, priority, search)
                .stream()
                .map(TaskDto::fromEntity)
                .collect(Collectors.toList());
    }

    public TaskDto getTaskById(Long id, Long userId) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + id));

        if (!task.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized access to task");
        }

        return TaskDto.fromEntity(task);
    }

    public TaskDto createTask(TaskDto dto, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        Task task = new Task(
                dto.getTitle(),
                dto.getDescription(),
                dto.getStatus(),
                dto.getPriority(),
                dto.getDueDate(),
                user
        );

        Task savedTask = taskRepository.save(task);
        return TaskDto.fromEntity(savedTask);
    }

    public TaskDto updateTask(Long id, TaskDto dto, Long userId) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + id));

        if (!task.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized modification of task");
        }

        if (dto.getTitle() != null) task.setTitle(dto.getTitle());
        if (dto.getDescription() != null) task.setDescription(dto.getDescription());
        if (dto.getStatus() != null) task.setStatus(dto.getStatus());
        if (dto.getPriority() != null) task.setPriority(dto.getPriority());
        if (dto.getDueDate() != null) task.setDueDate(dto.getDueDate());

        Task updatedTask = taskRepository.save(task);
        return TaskDto.fromEntity(updatedTask);
    }

    public void deleteTask(Long id, Long userId) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + id));

        if (!task.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized deletion of task");
        }

        taskRepository.delete(task);
    }
}
