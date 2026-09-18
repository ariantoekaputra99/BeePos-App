package com.bee.pos.dto;

import com.bee.pos.entity.Role;

public record LoginResponse(String token, String username, Role role) {}
