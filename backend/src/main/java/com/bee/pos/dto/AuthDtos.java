package com.bee.pos.dto;

import com.bee.pos.entity.Role;
import com.bee.pos.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;

public final class AuthDtos {
    private AuthDtos() {}

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {}

    public record LoginResponse(String token, String username, Role role, String fullName) {}

    public record ChangePasswordRequest(@NotBlank String currentPassword,
                                        @NotBlank @Size(min = 6, message = "minimal 6 karakter") String newPassword) {}

    public record UserResponse(Long id, String username, String email, String fullName, Role role,
                               boolean active, OffsetDateTime createdAt) {
        public static UserResponse from(User user) {
            return new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getFullName(),
                user.getRole(), user.isActive(), user.getCreatedAt());
        }
    }

    /** Password is required on create and optional on update (blank = unchanged). */
    public record UserRequest(@NotBlank @Size(min = 3, max = 50) String username,
                              @NotBlank @Email String email,
                              String fullName,
                              @NotNull Role role,
                              String password,
                              Boolean active) {}
}
