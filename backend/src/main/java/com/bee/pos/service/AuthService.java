package com.bee.pos.service;

import com.bee.pos.dto.AuthDtos.*;
import com.bee.pos.entity.User;
import com.bee.pos.exception.BusinessException;
import com.bee.pos.exception.NotFoundException;
import com.bee.pos.repository.UserRepository;
import com.bee.pos.security.CurrentUser;
import com.bee.pos.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final UserRepository users;
    private final UserDetailsServiceImpl details;
    private final JwtService jwt;
    private final PasswordEncoder encoder;

    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        User user = users.findByUsername(request.username()).orElseThrow();
        UserDetails principal = details.loadUserByUsername(user.getUsername());
        return new LoginResponse(jwt.generate(principal), user.getUsername(), user.getRole(), user.getFullName());
    }

    public UserResponse me() {
        return UserResponse.from(currentUser());
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = currentUser();
        if (!encoder.matches(request.currentPassword(), user.getPassword())) {
            throw new BusinessException("Password lama tidak sesuai");
        }
        user.setPassword(encoder.encode(request.newPassword()));
        users.save(user);
    }

    private User currentUser() {
        String username = CurrentUser.username();
        return users.findByUsername(username).orElseThrow(() -> NotFoundException.of("User", username));
    }
}
