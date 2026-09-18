package com.bee.pos.service;

import com.bee.pos.dto.*;
import com.bee.pos.entity.User;
import com.bee.pos.repository.UserRepository;
import com.bee.pos.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service @RequiredArgsConstructor
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final UserRepository users;
    private final UserDetailsServiceImpl details;
    private final JwtService jwt;
    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        User user = users.findByUsername(request.username()).orElseThrow();
        UserDetails principal = details.loadUserByUsername(user.getUsername());
        return new LoginResponse(jwt.generate(principal), user.getUsername(), user.getRole());
    }
}
