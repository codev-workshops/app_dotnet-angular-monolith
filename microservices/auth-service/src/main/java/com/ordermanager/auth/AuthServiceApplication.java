package com.ordermanager.auth;

import com.ordermanager.auth.model.Role;
import com.ordermanager.auth.model.User;
import com.ordermanager.auth.repository.RoleRepository;
import com.ordermanager.auth.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Set;

@SpringBootApplication
public class AuthServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }

    @Bean
    CommandLineRunner seedData(RoleRepository roleRepository, UserRepository userRepository,
                              PasswordEncoder passwordEncoder) {
        return args -> {
            Role adminRole;
            if (!roleRepository.existsByName("ADMIN")) {
                adminRole = new Role("ADMIN", "Administrator with full access", "all");
                adminRole = roleRepository.save(adminRole);
            } else {
                adminRole = roleRepository.findByName("ADMIN").orElseThrow();
            }

            if (!roleRepository.existsByName("USER")) {
                Role userRole = new Role("USER", "Standard user", "read");
                roleRepository.save(userRole);
            }

            if (!userRepository.existsByUsername("admin")) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setEmail("admin@ordermanager.com");
                admin.setFullName("System Administrator");
                admin.setEnabled(true);
                Set<Role> roles = new HashSet<>();
                roles.add(adminRole);
                admin.setRoles(roles);
                userRepository.save(admin);
            }
        };
    }
}
