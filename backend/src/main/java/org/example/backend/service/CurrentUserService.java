package org.example.backend.service;

import org.example.backend.domain.UserAccount;
import org.example.backend.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserAccount requireCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new IllegalStateException("Utilisateur non authentifie");
        }
        return userRepository.findByEmail(auth.getName().toLowerCase())
                .orElseThrow(() -> new IllegalStateException("Utilisateur introuvable"));
    }
}
