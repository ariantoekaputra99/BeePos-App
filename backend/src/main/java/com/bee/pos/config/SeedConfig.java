package com.bee.pos.config;

import com.bee.pos.entity.*;
import com.bee.pos.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class SeedConfig {
    @Bean CommandLineRunner seed(UserRepository users, PasswordEncoder encoder) { return args -> { if(users.findByUsername("admin").isEmpty()) users.save(User.builder().username("admin").email("admin@beepos.local").password(encoder.encode("admin123")).role(Role.ADMIN).active(true).build()); }; }
}
