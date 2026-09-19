package com.login.auth.service;

import com.login.auth.dto.AuthResponse;
import com.login.auth.dto.LoginRequest;
import com.login.auth.dto.RegisterRequest;
import com.login.auth.entity.User;
import com.login.auth.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public void register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Não foi possível cadastrar este usuário");
        }

        User user = new User(email, passwordEncoder.encode(request.password()), "USER");
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("E-mail ou senha inválidos"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new IllegalArgumentException("E-mail ou senha inválidos");
        }

        return new AuthResponse(jwtService.generateToken(user), "Bearer", jwtService.getExpiration());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}
