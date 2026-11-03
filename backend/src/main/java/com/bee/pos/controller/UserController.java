package com.bee.pos.controller;

import com.bee.pos.dto.AuthDtos.UserRequest;
import com.bee.pos.dto.AuthDtos.UserResponse;
import com.bee.pos.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserController {
    private final UserService users;

    @GetMapping
    public List<UserResponse> list() {
        return users.findAll();
    }

    @PostMapping
    public ResponseEntity<UserResponse> create(@Valid @RequestBody UserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(users.create(request));
    }

    @PutMapping("/{id}")
    public UserResponse update(@PathVariable Long id, @Valid @RequestBody UserRequest request) {
        return users.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        users.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
