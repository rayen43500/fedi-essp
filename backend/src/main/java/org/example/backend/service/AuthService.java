package org.example.backend.service;

import jakarta.servlet.http.HttpServletRequest;
import org.example.backend.api.dto.AuthDtos;
import org.example.backend.domain.LoginHistory;
import org.example.backend.domain.Role;
import org.example.backend.domain.UserAccount;
import org.example.backend.repository.LoginHistoryRepository;
import org.example.backend.repository.UserRepository;
import org.example.backend.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final LoginHistoryRepository loginHistoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       LoginHistoryRepository loginHistoryRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.loginHistoryRepository = loginHistoryRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        if (userRepository.findByEmail(request.email().toLowerCase()).isPresent()) {
            throw new IllegalArgumentException("Email deja utilise");
        }

        UserAccount user = new UserAccount();
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRoles(Set.of(Role.CLIENT));
        userRepository.save(user);

        String token = jwtService.generateToken(user);
        return new AuthDtos.AuthResponse(token, toUserSummary(user));
    }

    @Transactional
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request, HttpServletRequest httpRequest) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.email().toLowerCase(), request.password()));
        UserAccount user = userRepository.findByEmail(request.email().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));

        LoginHistory history = new LoginHistory();
        history.setUser(user);
        history.setSourceIp(resolveClientIp(httpRequest));
        loginHistoryRepository.save(history);

        String token = jwtService.generateToken(user);
        return new AuthDtos.AuthResponse(token, toUserSummary(user));
    }

    @Transactional(readOnly = true)
    public List<AuthDtos.UserSummary> users() {
        return userRepository.findAll().stream().map(this::toUserSummary).toList();
    }

    @Transactional
    public AuthDtos.UserSummary toggleUser(Long id, boolean active) {
        UserAccount user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));
        user.setActive(active);
        return toUserSummary(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<LoginHistory> loginHistory(Long userId) {
        return loginHistoryRepository.findTop20ByUserIdOrderByLoginAtDesc(userId);
    }

    private AuthDtos.UserSummary toUserSummary(UserAccount user) {
        return new AuthDtos.UserSummary(user.getId(), user.getFullName(), user.getEmail(), user.getRoles(), user.isActive());
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr();
    }
}
