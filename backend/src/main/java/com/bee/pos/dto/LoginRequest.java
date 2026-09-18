package com.bee.pos.dto;

import com.bee.pos.entity.Role;
import jakarta.validation.constraints.*;

public record LoginRequest(@NotBlank String username, @NotBlank String password) {}
