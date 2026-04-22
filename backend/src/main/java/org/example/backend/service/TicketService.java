package org.example.backend.service;

import org.example.backend.api.dto.AuthDtos;
import org.example.backend.domain.Role;
import org.example.backend.domain.Ticket;
import org.example.backend.domain.TicketCategory;
import org.example.backend.domain.TicketComment;
import org.example.backend.domain.TicketPriority;
import org.example.backend.domain.TicketStatus;
import org.example.backend.domain.UserAccount;
import org.example.backend.repository.TicketCommentRepository;
import org.example.backend.repository.TicketRepository;
import org.example.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketCommentRepository commentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public TicketService(TicketRepository ticketRepository,
                         TicketCommentRepository commentRepository,
                         UserRepository userRepository,
                         NotificationService notificationService) {
        this.ticketRepository = ticketRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public AuthDtos.TicketView createTicket(AuthDtos.TicketCreateRequest request, UserAccount client) {
        Ticket ticket = new Ticket();
        ticket.setTitle(request.title());
        ticket.setDescription(request.description());
        ticket.setType(request.type());
        ticket.setCategory(request.category());
        ticket.setPriority(request.priority());
        ticket.setAttachmentUrl(request.attachmentUrl());
        ticket.setClient(client);
        ticket.setSlaDeadline(Instant.now().plus(resolveSlaDuration(request.priority())));

        UserAccount agent = chooseAgentForCategory(request.category());
        if (agent != null) {
            ticket.setAssignedAgent(agent);
        }

        Ticket saved = ticketRepository.save(ticket);
        if (agent != null) {
            notificationService.push(agent, "Nouveau ticket", "Ticket #" + saved.getId() + " assigne a vous");
        }

        return toView(saved);
    }

    @Transactional(readOnly = true)
    public List<AuthDtos.TicketView> listTickets() {
        return ticketRepository.findByArchivedFalseOrderByCreatedAtDesc().stream()
                .map(this::toView)
                .toList();
    }

    @Transactional(readOnly = true)
    public AuthDtos.TicketView getTicket(Long id) {
        return toView(findTicket(id));
    }

    @Transactional
    public AuthDtos.TicketView assign(Long ticketId, Long agentId) {
        Ticket ticket = findTicket(ticketId);
        UserAccount agent = userRepository.findById(agentId)
                .orElseThrow(() -> new IllegalArgumentException("Agent introuvable"));
        ticket.setAssignedAgent(agent);
        ticket.setUpdatedAt(Instant.now());
        Ticket saved = ticketRepository.save(ticket);
        notificationService.push(agent, "Ticket assigne", "Ticket #" + saved.getId() + " vous a ete assigne");
        return toView(saved);
    }

    @Transactional
    public AuthDtos.TicketView changeStatus(Long ticketId, TicketStatus status, UserAccount actor) {
        Ticket ticket = findTicket(ticketId);
        ticket.setStatus(status);
        ticket.setUpdatedAt(Instant.now());
        Ticket saved = ticketRepository.save(ticket);

        notificationService.push(saved.getClient(), "Mise a jour ticket", "Le ticket #" + saved.getId() + " est maintenant " + status.name());
        return toView(saved);
    }

    @Transactional
    public AuthDtos.CommentView addComment(Long ticketId, String message, UserAccount author) {
        Ticket ticket = findTicket(ticketId);
        TicketComment comment = new TicketComment();
        comment.setTicket(ticket);
        comment.setAuthor(author);
        comment.setMessage(message);

        TicketComment saved = commentRepository.save(comment);
        ticket.setUpdatedAt(Instant.now());
        ticketRepository.save(ticket);

        if (!ticket.getClient().getId().equals(author.getId())) {
            notificationService.push(ticket.getClient(), "Nouveau commentaire", "Un commentaire a ete ajoute sur le ticket #" + ticket.getId());
        }
        return new AuthDtos.CommentView(saved.getId(), author.getFullName(), saved.getMessage(), saved.getCreatedAt());
    }

    @Transactional
    public AuthDtos.TicketView rateSatisfaction(Long ticketId, Integer score, UserAccount client) {
        Ticket ticket = findTicket(ticketId);
        if (!ticket.getClient().getId().equals(client.getId())) {
            throw new IllegalArgumentException("Vous ne pouvez evaluer que vos tickets");
        }
        if (score < 1 || score > 5) {
            throw new IllegalArgumentException("La note doit etre entre 1 et 5");
        }
        ticket.setSatisfactionScore(score);
        ticket.setUpdatedAt(Instant.now());
        return toView(ticketRepository.save(ticket));
    }

    @Transactional
    public int archiveClosedTickets() {
        List<Ticket> closed = ticketRepository.findByArchivedFalseOrderByCreatedAtDesc().stream()
                .filter(t -> t.getStatus() == TicketStatus.FERME)
                .toList();
        for (Ticket ticket : closed) {
            ticket.setArchived(true);
            ticket.setUpdatedAt(Instant.now());
            ticketRepository.save(ticket);
        }
        return closed.size();
    }

    @Transactional
    public int escalateSlaBreaches() {
        List<Ticket> breached = ticketRepository.findByStatusNotAndSlaDeadlineBefore(TicketStatus.FERME, Instant.now());
        for (Ticket ticket : breached) {
            if (ticket.getPriority() != TicketPriority.CRITIQUE) {
                ticket.setPriority(TicketPriority.CRITIQUE);
            }
            if (ticket.getStatus() == TicketStatus.EN_ATTENTE) {
                ticket.setStatus(TicketStatus.EN_COURS);
            }
            ticket.setUpdatedAt(Instant.now());
            ticketRepository.save(ticket);
            if (ticket.getAssignedAgent() != null) {
                notificationService.push(ticket.getAssignedAgent(), "Alerte SLA", "Le ticket #" + ticket.getId() + " a depasse le delai SLA");
            }
        }
        return breached.size();
    }

    @Transactional(readOnly = true)
    public AuthDtos.DashboardStats dashboardStats() {
        List<Ticket> all = ticketRepository.findAll();
        long total = all.size();
        long open = all.stream().filter(t -> t.getStatus() == TicketStatus.OUVERT).count();
        long inProgress = all.stream().filter(t -> t.getStatus() == TicketStatus.EN_COURS).count();
        long waiting = all.stream().filter(t -> t.getStatus() == TicketStatus.EN_ATTENTE).count();
        long resolved = all.stream().filter(t -> t.getStatus() == TicketStatus.RESOLU).count();
        long closed = all.stream().filter(t -> t.getStatus() == TicketStatus.FERME).count();

        double avgResolutionHours = all.stream()
                .filter(t -> t.getStatus() == TicketStatus.RESOLU || t.getStatus() == TicketStatus.FERME)
                .mapToLong(t -> Duration.between(t.getCreatedAt(), t.getUpdatedAt()).toHours())
                .average()
                .orElse(0.0);

        double satisfactionRate = all.stream()
                .filter(t -> t.getSatisfactionScore() != null)
                .mapToInt(Ticket::getSatisfactionScore)
                .average()
                .orElse(0.0);

        return new AuthDtos.DashboardStats(total, open, inProgress, waiting, resolved, closed, avgResolutionHours, satisfactionRate);
    }

    private Ticket findTicket(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket introuvable"));
    }

    private AuthDtos.TicketView toView(Ticket ticket) {
        List<AuthDtos.CommentView> comments = commentRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId()).stream()
                .map(c -> new AuthDtos.CommentView(c.getId(), c.getAuthor().getFullName(), c.getMessage(), c.getCreatedAt()))
                .toList();

        AuthDtos.UserSummary client = new AuthDtos.UserSummary(
                ticket.getClient().getId(),
                ticket.getClient().getFullName(),
                ticket.getClient().getEmail(),
                ticket.getClient().getRoles(),
                ticket.getClient().isActive());

        AuthDtos.UserSummary agent = null;
        if (ticket.getAssignedAgent() != null) {
            agent = new AuthDtos.UserSummary(
                    ticket.getAssignedAgent().getId(),
                    ticket.getAssignedAgent().getFullName(),
                    ticket.getAssignedAgent().getEmail(),
                    ticket.getAssignedAgent().getRoles(),
                    ticket.getAssignedAgent().isActive());
        }

        return new AuthDtos.TicketView(
                ticket.getId(),
                ticket.getTitle(),
                ticket.getDescription(),
                ticket.getType(),
                ticket.getCategory(),
                ticket.getPriority(),
                ticket.getStatus(),
                ticket.getCreatedAt(),
                ticket.getUpdatedAt(),
                ticket.getSlaDeadline(),
                ticket.isArchived(),
                ticket.getAttachmentUrl(),
                ticket.getSatisfactionScore(),
                client,
                agent,
                comments);
    }

    private Duration resolveSlaDuration(TicketPriority priority) {
        return switch (priority) {
            case CRITIQUE -> Duration.ofHours(4);
            case ELEVEE -> Duration.ofHours(8);
            case MOYENNE -> Duration.ofHours(24);
            case FAIBLE -> Duration.ofHours(48);
        };
    }

    private UserAccount chooseAgentForCategory(TicketCategory category) {
        List<UserAccount> agents = userRepository.findByRolesContainingAndActiveTrue(Role.AGENT);
        return agents.stream()
                .min(Comparator.comparing(UserAccount::getId))
                .orElse(null);
    }
}
