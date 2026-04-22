package org.example.backend.config;

import org.example.backend.domain.KnowledgeArticle;
import org.example.backend.domain.Role;
import org.example.backend.domain.Ticket;
import org.example.backend.domain.TicketCategory;
import org.example.backend.domain.TicketPriority;
import org.example.backend.domain.TicketStatus;
import org.example.backend.domain.TicketType;
import org.example.backend.domain.UserAccount;
import org.example.backend.repository.KnowledgeArticleRepository;
import org.example.backend.repository.TicketRepository;
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
    private final TicketRepository ticketRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository,
                      KnowledgeArticleRepository articleRepository,
                      TicketRepository ticketRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.articleRepository = articleRepository;
        this.ticketRepository = ticketRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        UserAccount admin = ensureUser("Admin Support", "admin@support.local", "admin123", Set.of(Role.ADMIN, Role.SUPERVISEUR));
        UserAccount agent = ensureUser("Agent Niveau 1", "agent@support.local", "agent123", Set.of(Role.AGENT));
        UserAccount client = ensureUser("Client Demo", "client@support.local", "client123", Set.of(Role.CLIENT));

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

            if (ticketRepository.count() == 0) {
                ticketRepository.save(buildTicket(
                    "Impossible de se connecter au VPN",
                    "Depuis ce matin, le client VPN affiche un timeout.",
                    TicketType.INCIDENT,
                    TicketCategory.RESEAU,
                    TicketPriority.ELEVEE,
                    TicketStatus.EN_COURS,
                    client,
                    agent,
                    Instant.now().plusSeconds(6 * 3600)));

                ticketRepository.save(buildTicket(
                    "Demande d'acces a l'ERP",
                    "Nouvel employe, merci de creer les droits standard ERP.",
                    TicketType.DEMANDE,
                    TicketCategory.ACCES,
                    TicketPriority.MOYENNE,
                    TicketStatus.OUVERT,
                    client,
                    agent,
                    Instant.now().plusSeconds(24 * 3600)));

                Ticket resolved = buildTicket(
                    "Erreur imprimante etage 2",
                    "L'imprimante ne repond plus sur le reseau interne.",
                    TicketType.INCIDENT,
                    TicketCategory.MATERIEL,
                    TicketPriority.FAIBLE,
                    TicketStatus.RESOLU,
                    client,
                    agent,
                    Instant.now().minusSeconds(2 * 3600));
                resolved.setSatisfactionScore(5);
                ticketRepository.save(resolved);
            }
    }

            private Ticket buildTicket(String title,
                           String description,
                           TicketType type,
                           TicketCategory category,
                           TicketPriority priority,
                           TicketStatus status,
                           UserAccount client,
                           UserAccount agent,
                           Instant slaDeadline) {
            Ticket ticket = new Ticket();
            ticket.setTitle(title);
            ticket.setDescription(description);
            ticket.setType(type);
            ticket.setCategory(category);
            ticket.setPriority(priority);
            ticket.setStatus(status);
            ticket.setClient(client);
            ticket.setAssignedAgent(agent);
            ticket.setSlaDeadline(slaDeadline);
            ticket.setUpdatedAt(Instant.now());
            return ticket;
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
