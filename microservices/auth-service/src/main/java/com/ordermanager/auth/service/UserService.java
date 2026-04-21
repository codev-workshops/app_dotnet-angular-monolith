package com.ordermanager.auth.service;

import com.ordermanager.auth.dto.UserDto;
import com.ordermanager.auth.model.Role;
import com.ordermanager.auth.model.User;
import com.ordermanager.auth.repository.RoleRepository;
import com.ordermanager.auth.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        return toDto(user);
    }

    @Transactional
    public UserDto createUser(UserDto userDto) {
        if (userRepository.existsByUsername(userDto.getUsername())) {
            throw new RuntimeException("Username already exists: " + userDto.getUsername());
        }
        if (userDto.getEmail() != null && userRepository.existsByEmail(userDto.getEmail())) {
            throw new RuntimeException("Email already exists: " + userDto.getEmail());
        }

        User user = new User();
        user.setUsername(userDto.getUsername());
        user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        user.setEmail(userDto.getEmail());
        user.setFullName(userDto.getFullName());
        user.setEnabled(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setRoles(resolveRoles(userDto.getRoles()));

        User saved = userRepository.save(user);
        return toDto(saved);
    }

    @Transactional
    public UserDto updateUser(Long id, UserDto userDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        if (userDto.getUsername() != null) {
            user.setUsername(userDto.getUsername());
        }
        if (userDto.getPassword() != null && !userDto.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        }
        if (userDto.getEmail() != null) {
            user.setEmail(userDto.getEmail());
        }
        if (userDto.getFullName() != null) {
            user.setFullName(userDto.getFullName());
        }
        user.setEnabled(userDto.isEnabled());
        if (userDto.getRoles() != null) {
            user.setRoles(resolveRoles(userDto.getRoles()));
        }

        User saved = userRepository.save(user);
        return toDto(saved);
    }

    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }

    private Set<Role> resolveRoles(List<String> roleNames) {
        Set<Role> roles = new HashSet<>();
        if (roleNames != null) {
            for (String roleName : roleNames) {
                Role role = roleRepository.findByName(roleName)
                        .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
                roles.add(role);
            }
        }
        return roles;
    }

    private UserDto toDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setEnabled(user.isEnabled());
        dto.setRoles(user.getRoles().stream()
                .map(Role::getName)
                .toList());
        return dto;
    }
}
