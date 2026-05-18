package org.example.backend.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.example.backend.api.dto.AuthDtos;
import org.example.backend.domain.LoginHistory;
import org.example.backend.domain.UserAccount;
import org.example.backend.service.AuthService;
import org.example.backend.service.CurrentUserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final CurrentUserService currentUserService;

    public AuthController(AuthService authService, CurrentUserService currentUserService) {
        this.authService = authService;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/register")
    public AuthDtos.AuthResponse register(@Valid @RequestBody AuthDtos.RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthDtos.AuthResponse login(@Valid @RequestBody AuthDtos.LoginRequest request, HttpServletRequest httpRequest) {
        return authService.login(request, httpRequest);
    }

    @GetMapping("/me")
    public AuthDtos.UserSummary me() {
        return authService.getProfile(currentUserService.requireCurrentUser());
    }

    @PatchMapping("/me")
    public AuthDtos.UserSummary updateMe(@Valid @RequestBody AuthDtos.ProfileUpdateRequest request) {
        return authService.updateProfile(currentUserService.requireCurrentUser(), request);
    }

    @PatchMapping("/me/password")
    public void changePassword(@Valid @RequestBody AuthDtos.PasswordChangeRequest request) {
        authService.changePassword(currentUserService.requireCurrentUser(), request);
    }

    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AuthDtos.UserSummary uploadAvatar(@RequestPart("file") MultipartFile file) {
        return authService.uploadAvatar(currentUserService.requireCurrentUser(), file);
    }

    @GetMapping("/users")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISEUR')")
    public List<AuthDtos.UserSummary> users() {
        return authService.users();
    }

    @GetMapping("/users/support")
    @PreAuthorize("hasAnyRole('AGENT','SUPERVISEUR','ADMIN')")
    public List<AuthDtos.UserSummary> supportUsers() {
        return authService.supportUsers();
    }

    @PatchMapping("/users/{id}/active")
    @PreAuthorize("hasRole('ADMIN')")
    public AuthDtos.UserSummary toggleUser(@PathVariable Long id, @RequestParam boolean active) {
        return authService.toggleUser(id, active);
    }

    @PatchMapping("/users/{id}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public AuthDtos.UserSummary updateRoles(@PathVariable Long id, @Valid @RequestBody AuthDtos.UserRolesRequest request) {
        UserAccount currentUser = currentUserService.requireCurrentUser();
        return authService.updateRoles(id, request.roles(), currentUser);
    }

    @GetMapping("/users/{id}/logins")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISEUR')")
    public List<LoginHistory> loginHistory(@PathVariable Long id) {
        return authService.loginHistory(id);
    }
}
