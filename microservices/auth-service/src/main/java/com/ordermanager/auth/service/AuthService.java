package com.ordermanager.auth.service;

import com.ordermanager.auth.dto.LoginRequest;
import com.ordermanager.auth.dto.LoginResponse;
import com.ordermanager.auth.dto.RefreshRequest;
import com.ordermanager.auth.model.Role;
import com.ordermanager.auth.model.User;
import com.ordermanager.auth.repository.UserRepository;
import com.ordermanager.auth.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository,
                       JwtTokenProvider jwtTokenProvider,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.passwordEncoder = passwordEncoder;
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid username or password");
        }

        if (!user.isEnabled()) {
            throw new RuntimeException("User account is disabled");
        }

        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .toList();

        String token = jwtTokenProvider.generateToken(user.getUsername(), roles, user.getId());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getUsername());

        return new LoginResponse(token, refreshToken, user.getUsername(), roles);
    }

    public LoginResponse refresh(RefreshRequest request) {
        if (!jwtTokenProvider.validateToken(request.getRefreshToken())) {
            throw new RuntimeException("Invalid refresh token");
        }

        String username = jwtTokenProvider.getUsernameFromToken(request.getRefreshToken());
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .toList();

        String token = jwtTokenProvider.generateToken(user.getUsername(), roles, user.getId());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getUsername());

        return new LoginResponse(token, refreshToken, user.getUsername(), roles);
    }
}
