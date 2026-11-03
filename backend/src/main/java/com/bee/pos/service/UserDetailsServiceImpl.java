package com.bee.pos.service;

import com.bee.pos.entity.User;
import com.bee.pos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {
    private final UserRepository users;

    @Override
    public UserDetails loadUserByUsername(String username) {
        User u = users.findByUsername(username).orElseThrow(() -> new UsernameNotFoundException(username));
        return org.springframework.security.core.userdetails.User.withUsername(u.getUsername())
            .password(u.getPassword())
            .roles(u.getRole().name())
            .disabled(!u.isActive())
            .build();
    }
}
