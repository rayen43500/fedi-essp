package org.example.backend.service;

import org.example.backend.api.dto.AuthDtos;
import org.example.backend.domain.Notification;
import org.example.backend.domain.UserAccount;
import org.example.backend.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public void push(UserAccount user, String title, String message) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<AuthDtos.NotificationView> myNotifications(UserAccount user) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(n -> new AuthDtos.NotificationView(n.getId(), n.getTitle(), n.getMessage(), n.isRead(), n.getCreatedAt()))
                .toList();
    }

    @Transactional
    public void markAsRead(UserAccount user, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification introuvable"));
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Notification inaccessible");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
    }
}
