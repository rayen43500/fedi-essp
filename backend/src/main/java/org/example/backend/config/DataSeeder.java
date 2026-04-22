package org.example.backend.config;

import org.example.backend.domain.KnowledgeArticle;
import org.example.backend.domain.Role;
import org.example.backend.domain.UserAccount;
import org.example.backend.repository.KnowledgeArticleRepository;
import org.example.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Set;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final KnowledgeArticleRepository articleRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, KnowledgeArticleRepository articleRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.articleRepository = articleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        UserAccount admin = ensureUser("Admin Support", "admin@support.local", "admin123", Set.of(Role.ADMIN, Role.SUPERVISEUR));
        ensureUser("Agent Niveau 1", "agent@support.local", "agent123", Set.of(Role.AGENT));
        ensureUser("Client Demo", "client@support.local", "client123", Set.of(Role.CLIENT));

        if (articleRepository.count() == 0) {
            KnowledgeArticle a1 = new KnowledgeArticle();
            a1.setTitle("Probleme de mot de passe oublie");
            a1.setCategory("acces");
            a1.setContent("Utilisez la fonctionnalite de reinitialisation depuis l'ecran de connexion ou contactez le support.");
            a1.setAuthor(admin);
            a1.setUpdatedAt(Instant.now());

            KnowledgeArticle a2 = new KnowledgeArticle();
            a2.setTitle("Connexion reseau instable");
            a2.setCategory("reseau");
            a2.setContent("Verifiez votre cable ou votre Wi-Fi, redemarrez le routeur, puis testez avec un autre appareil.");
            a2.setAuthor(admin);
            a2.setUpdatedAt(Instant.now());

            articleRepository.save(a1);
            articleRepository.save(a2);
        }
    }

    private UserAccount ensureUser(String name, String email, String rawPassword, Set<Role> roles) {
        return userRepository.findByEmail(email.toLowerCase()).orElseGet(() -> {
            UserAccount user = new UserAccount();
            user.setFullName(name);
            user.setEmail(email);
            user.setPasswordHash(passwordEncoder.encode(rawPassword));
            user.setRoles(roles);
            return userRepository.save(user);
        });
    }
}
