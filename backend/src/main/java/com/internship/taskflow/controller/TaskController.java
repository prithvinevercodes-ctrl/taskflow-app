package com.internship.taskflow.controller;

import com.internship.taskflow.dto.TaskDto;
import com.internship.taskflow.model.Priority;
import com.internship.taskflow.model.TaskStatus;
import com.internship.taskflow.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public ResponseEntity<List<TaskDto>> getTasks(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) String search) {

        Long currentUserId = userId != null ? userId : 1L; // Fallback to user ID 1 for dev mode
        List<TaskDto> tasks = taskService.getTasks(currentUserId, status, priority, search);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskDto> getTaskById(@PathVariable Long id, @RequestParam(required = false) Long userId) {
        Long currentUserId = userId != null ? userId : 1L;
        TaskDto task = taskService.getTaskById(id, currentUserId);
        return ResponseEntity.ok(task);
    }

    @PostMapping
    public ResponseEntity<TaskDto> createTask(@Valid @RequestBody TaskDto dto, @RequestParam(required = false) Long userId) {
        Long currentUserId = userId != null ? userId : (dto.getUserId() != null ? dto.getUserId() : 1L);
        TaskDto created = taskService.createTask(dto, currentUserId);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskDto> updateTask(@PathVariable Long id, @RequestBody TaskDto dto, @RequestParam(required = false) Long userId) {
        Long currentUserId = userId != null ? userId : 1L;
        TaskDto updated = taskService.updateTask(id, dto, currentUserId);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id, @RequestParam(required = false) Long userId) {
        Long currentUserId = userId != null ? userId : 1L;
        taskService.deleteTask(id, currentUserId);
        return ResponseEntity.noContent().build();
    }
}
