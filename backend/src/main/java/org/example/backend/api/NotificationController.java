package org.example.backend.api;

import org.example.backend.api.dto.AuthDtos;
import org.example.backend.domain.UserAccount;
import org.example.backend.service.CurrentUserService;
import org.example.backend.service.NotificationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final CurrentUserService currentUserService;

    public NotificationController(NotificationService notificationService, CurrentUserService currentUserService) {
        this.notificationService = notificationService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public List<AuthDtos.NotificationView> myNotifications() {
        UserAccount currentUser = currentUserService.requireCurrentUser();
        return notificationService.myNotifications(currentUser);
    }

    @PatchMapping("/{id}/read")
    public void markAsRead(@PathVariable Long id) {
        UserAccount currentUser = currentUserService.requireCurrentUser();
        notificationService.markAsRead(currentUser, id);
    }
}
