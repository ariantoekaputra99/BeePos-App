package com.bee.pos.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/login")
    public Map<String, String> login() {
        return Map.of(
            "message", "Login successful",
            "token", "demo-token"
        );
    }

    @GetMapping("/me")
    public Map<String, Object> me() {
        return Map.of(
            "id", 1,
            "name", "Admin BeePos",
            "role", "ADMIN",
            "email", "admin@bee-pos.local"
        );
    }
}
