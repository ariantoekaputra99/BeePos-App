package com.bee.pos.service;

import com.bee.pos.dto.AuthDtos.UserRequest;
import com.bee.pos.dto.AuthDtos.UserResponse;
import com.bee.pos.entity.Role;
import com.bee.pos.entity.User;
import com.bee.pos.exception.BusinessException;
import com.bee.pos.exception.NotFoundException;
import com.bee.pos.repository.UserRepository;
import com.bee.pos.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository users;
    private final PasswordEncoder encoder;

    public List<UserResponse> findAll() {
        return users.findAllByOrderByUsernameAsc().stream().map(UserResponse::from).toList();
    }

    @Transactional
    public UserResponse create(UserRequest request) {
        if (request.password() == null || request.password().length() < 6) {
            throw new BusinessException("Password minimal 6 karakter");
        }
        if (users.existsByUsernameIgnoreCase(request.username().trim())) {
            throw new BusinessException("Username sudah dipakai");
        }
        if (users.existsByEmailIgnoreCase(request.email().trim())) {
            throw new BusinessException("Email sudah dipakai");
        }
        User user = User.builder()
            .username(request.username().trim())
            .email(request.email().trim())
            .fullName(blankToNull(request.fullName()))
            .role(request.role())
            .password(encoder.encode(request.password()))
            .active(request.active() == null || request.active())
            .build();
        return UserResponse.from(users.save(user));
    }

    @Transactional
    public UserResponse update(Long id, UserRequest request) {
        User user = users.findById(id).orElseThrow(() -> NotFoundException.of("User", id));
        boolean self = user.getUsername().equals(CurrentUser.username());
        boolean active = request.active() == null ? user.isActive() : request.active();

        if (self && (!active || request.role() != user.getRole())) {
            throw new BusinessException("Tidak bisa menonaktifkan atau mengubah role akun sendiri");
        }
        if (user.getRole() == Role.ADMIN && (request.role() != Role.ADMIN || !active)) {
            ensureAnotherActiveAdmin(user);
        }
        if (!user.getUsername().equalsIgnoreCase(request.username().trim())
            && users.existsByUsernameIgnoreCase(request.username().trim())) {
            throw new BusinessException("Username sudah dipakai");
        }
        if (!user.getEmail().equalsIgnoreCase(request.email().trim())
            && users.existsByEmailIgnoreCase(request.email().trim())) {
            throw new BusinessException("Email sudah dipakai");
        }

        user.setUsername(request.username().trim());
        user.setEmail(request.email().trim());
        user.setFullName(blankToNull(request.fullName()));
        user.setRole(request.role());
        user.setActive(active);
        if (request.password() != null && !request.password().isBlank()) {
            if (request.password().length() < 6) throw new BusinessException("Password minimal 6 karakter");
            user.setPassword(encoder.encode(request.password()));
        }
        return UserResponse.from(users.save(user));
    }

    /** Users are deactivated, never hard-deleted, so sales history keeps its cashier. */
    @Transactional
    public void deactivate(Long id) {
        User user = users.findById(id).orElseThrow(() -> NotFoundException.of("User", id));
        if (user.getUsername().equals(CurrentUser.username())) {
            throw new BusinessException("Tidak bisa menonaktifkan akun sendiri");
        }
        if (user.getRole() == Role.ADMIN) ensureAnotherActiveAdmin(user);
        user.setActive(false);
        users.save(user);
    }

    private void ensureAnotherActiveAdmin(User user) {
        boolean another = users.findAll().stream()
            .anyMatch(u -> !u.getId().equals(user.getId()) && u.getRole() == Role.ADMIN && u.isActive());
        if (!another) throw new BusinessException("Harus ada minimal satu admin aktif");
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
