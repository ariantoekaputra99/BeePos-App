package com.bee.pos.controller;

import com.bee.pos.dto.AuthDtos.*;
import com.bee.pos.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService auth;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return auth.login(request);
    }

    @GetMapping("/me")
    public UserResponse me() {
        return auth.me();
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        auth.changePassword(request);
        return ResponseEntity.noContent().build();
    }
}
