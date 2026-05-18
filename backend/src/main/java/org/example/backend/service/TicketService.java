package org.example.backend.service;

import org.example.backend.api.dto.AuthDtos;
import org.example.backend.domain.Role;
import org.example.backend.domain.Ticket;
import org.example.backend.domain.TicketCategory;
import org.example.backend.domain.TicketComment;
import org.example.backend.domain.TicketPriority;
import org.example.backend.domain.TicketStatus;
import org.example.backend.domain.TicketType;
import org.example.backend.domain.UserAccount;
import org.example.backend.repository.TicketCommentRepository;
import org.example.backend.repository.TicketRepository;
import org.example.backend.repository.UserRepository;
import org.springframework.data.domain.Sort;
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
    public List<AuthDtos.TicketView> listTickets(UserAccount currentUser,
                                                 String search,
                                                 TicketStatus status,
                                                 TicketPriority priority,
                                                 TicketCategory category,
                                                 TicketType type,
                                                 Long agentId,
                                                 Boolean unassigned,
                                                 Boolean assignedToMe,
                                                 Boolean mine,
                                                 Boolean overdue,
                                                 Boolean includeArchived) {
        Instant now = Instant.now();
        boolean staff = hasStaffRole(currentUser);
        boolean canSeeArchived = staff && Boolean.TRUE.equals(includeArchived);

        return ticketRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .filter(ticket -> canSeeArchived || !ticket.isArchived())
                .filter(ticket -> staff || ticket.getClient().getId().equals(currentUser.getId()))
                .filter(ticket -> status == null || ticket.getStatus() == status)
                .filter(ticket -> priority == null || ticket.getPriority() == priority)
                .filter(ticket -> category == null || ticket.getCategory() == category)
                .filter(ticket -> type == null || ticket.getType() == type)
                .filter(ticket -> !staff || agentId == null || hasAssignedAgent(ticket, agentId))
                .filter(ticket -> !Boolean.TRUE.equals(unassigned) || ticket.getAssignedAgent() == null)
                .filter(ticket -> !Boolean.TRUE.equals(assignedToMe) || hasAssignedAgent(ticket, currentUser.getId()))
                .filter(ticket -> !Boolean.TRUE.equals(mine) || isMine(ticket, currentUser))
                .filter(ticket -> !Boolean.TRUE.equals(overdue) || isSlaBreached(ticket, now))
                .filter(ticket -> matchesSearch(ticket, search))
                .sorted(Comparator
                        .comparing((Ticket ticket) -> isSlaBreached(ticket, now)).reversed()
                        .thenComparingInt(ticket -> priorityRank(ticket.getPriority()))
                        .thenComparing(Ticket::getSlaDeadline)
                        .thenComparing(Ticket::getCreatedAt, Comparator.reverseOrder()))
                .map(this::toView)
                .toList();
    }

    @Transactional(readOnly = true)
    public AuthDtos.TicketView getTicket(Long id, UserAccount currentUser) {
        Ticket ticket = findTicket(id);
        ensureCanAccess(ticket, currentUser);
        return toView(ticket);
    }

    @Transactional
    public AuthDtos.TicketView assign(Long ticketId, Long agentId, UserAccount actor) {
        if (!hasStaffRole(actor)) {
            throw new IllegalArgumentException("Vous n'etes pas autorise a assigner un ticket");
        }
        Ticket ticket = findTicket(ticketId);
        UserAccount agent = userRepository.findById(agentId)
                .orElseThrow(() -> new IllegalArgumentException("Agent introuvable"));
        if (!agent.isActive() || !hasStaffRole(agent)) {
            throw new IllegalArgumentException("Le destinataire doit etre un membre actif du support");
        }
        ticket.setAssignedAgent(agent);
        ticket.setUpdatedAt(Instant.now());
        Ticket saved = ticketRepository.save(ticket);
        notificationService.push(agent, "Ticket assigne", "Ticket #" + saved.getId() + " vous a ete assigne");
        return toView(saved);
    }

    @Transactional
    public AuthDtos.TicketView changeStatus(Long ticketId, TicketStatus status, UserAccount actor) {
        Ticket ticket = findTicket(ticketId);
        ensureCanAccess(ticket, actor);
        if (!hasStaffRole(actor)) {
            throw new IllegalArgumentException("Vous n'etes pas autorise a modifier le statut");
        }
        ticket.setStatus(status);
        ticket.setUpdatedAt(Instant.now());
        Ticket saved = ticketRepository.save(ticket);

        notificationService.push(saved.getClient(), "Mise a jour ticket", "Le ticket #" + saved.getId() + " est maintenant " + status.name());
        return toView(saved);
    }

    @Transactional
    public AuthDtos.TicketView changePriority(Long ticketId, TicketPriority priority, UserAccount actor) {
        Ticket ticket = findTicket(ticketId);
        ensureCanAccess(ticket, actor);
        if (!hasStaffRole(actor)) {
            throw new IllegalArgumentException("Vous n'etes pas autorise a modifier la priorite");
        }
        ticket.setPriority(priority);
        ticket.setSlaDeadline(Instant.now().plus(resolveSlaDuration(priority)));
        ticket.setUpdatedAt(Instant.now());
        Ticket saved = ticketRepository.save(ticket);

        notificationService.push(saved.getClient(), "Priorite ticket", "Le ticket #" + saved.getId() + " est maintenant " + priority.name());
        return toView(saved);
    }

    @Transactional
    public AuthDtos.CommentView addComment(Long ticketId, String message, UserAccount author) {
        Ticket ticket = findTicket(ticketId);
        ensureCanAccess(ticket, author);
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
        Instant now = Instant.now();
        List<Ticket> breached = ticketRepository.findByArchivedFalseOrderByCreatedAtDesc().stream()
                .filter(ticket -> isSlaBreached(ticket, now))
                .toList();
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
        List<Ticket> active = all.stream().filter(ticket -> !ticket.isArchived()).toList();
        Instant now = Instant.now();
        long total = active.size();
        long open = active.stream().filter(t -> t.getStatus() == TicketStatus.OUVERT).count();
        long inProgress = active.stream().filter(t -> t.getStatus() == TicketStatus.EN_COURS).count();
        long waiting = active.stream().filter(t -> t.getStatus() == TicketStatus.EN_ATTENTE).count();
        long resolved = active.stream().filter(t -> t.getStatus() == TicketStatus.RESOLU).count();
        long closed = active.stream().filter(t -> t.getStatus() == TicketStatus.FERME).count();
        long critical = active.stream().filter(t -> t.getPriority() == TicketPriority.CRITIQUE).count();
        long overdue = active.stream().filter(t -> isSlaBreached(t, now)).count();
        long unassigned = active.stream().filter(t -> t.getAssignedAgent() == null).count();
        long archived = all.stream().filter(Ticket::isArchived).count();

        double avgResolutionHours = active.stream()
                .filter(t -> t.getStatus() == TicketStatus.RESOLU || t.getStatus() == TicketStatus.FERME)
                .mapToLong(t -> Duration.between(t.getCreatedAt(), t.getUpdatedAt()).toHours())
                .average()
                .orElse(0.0);

        double satisfactionRate = active.stream()
                .filter(t -> t.getSatisfactionScore() != null)
                .mapToInt(Ticket::getSatisfactionScore)
                .average()
                .orElse(0.0);

        return new AuthDtos.DashboardStats(total, open, inProgress, waiting, resolved, closed, critical, overdue, unassigned, archived, avgResolutionHours, satisfactionRate);
    }

    @Transactional(readOnly = true)
    public AuthDtos.DashboardCharts dashboardCharts() {
        List<Ticket> active = ticketRepository.findAll().stream()
                .filter(t -> !t.isArchived())
                .toList();

        List<AuthDtos.ChartSlice> byStatus = List.of(
                slice("Ouverts", active.stream().filter(t -> t.getStatus() == TicketStatus.OUVERT).count()),
                slice("En cours", active.stream().filter(t -> t.getStatus() == TicketStatus.EN_COURS).count()),
                slice("En attente", active.stream().filter(t -> t.getStatus() == TicketStatus.EN_ATTENTE).count()),
                slice("Resolus", active.stream().filter(t -> t.getStatus() == TicketStatus.RESOLU).count()),
                slice("Fermes", active.stream().filter(t -> t.getStatus() == TicketStatus.FERME).count())
        );

        List<AuthDtos.ChartSlice> byPriority = List.of(
                slice("Critique", active.stream().filter(t -> t.getPriority() == TicketPriority.CRITIQUE).count()),
                slice("Elevee", active.stream().filter(t -> t.getPriority() == TicketPriority.ELEVEE).count()),
                slice("Moyenne", active.stream().filter(t -> t.getPriority() == TicketPriority.MOYENNE).count()),
                slice("Faible", active.stream().filter(t -> t.getPriority() == TicketPriority.FAIBLE).count())
        );

        return new AuthDtos.DashboardCharts(byStatus, byPriority);
    }

    @Transactional(readOnly = true)
    public AuthDtos.DashboardCharts dashboardChartsForUser(UserAccount user) {
        List<Ticket> mine = ticketRepository.findAll().stream()
                .filter(t -> !t.isArchived())
                .filter(t -> t.getClient().getId().equals(user.getId()))
                .toList();

        List<AuthDtos.ChartSlice> byStatus = List.of(
                slice("Ouverts", mine.stream().filter(t -> t.getStatus() == TicketStatus.OUVERT).count()),
                slice("En cours", mine.stream().filter(t -> t.getStatus() == TicketStatus.EN_COURS).count()),
                slice("En attente", mine.stream().filter(t -> t.getStatus() == TicketStatus.EN_ATTENTE).count()),
                slice("Resolus", mine.stream().filter(t -> t.getStatus() == TicketStatus.RESOLU).count()),
                slice("Fermes", mine.stream().filter(t -> t.getStatus() == TicketStatus.FERME).count())
        );

        List<AuthDtos.ChartSlice> byPriority = List.of(
                slice("Critique", mine.stream().filter(t -> t.getPriority() == TicketPriority.CRITIQUE).count()),
                slice("Elevee", mine.stream().filter(t -> t.getPriority() == TicketPriority.ELEVEE).count()),
                slice("Moyenne", mine.stream().filter(t -> t.getPriority() == TicketPriority.MOYENNE).count()),
                slice("Faible", mine.stream().filter(t -> t.getPriority() == TicketPriority.FAIBLE).count())
        );

        return new AuthDtos.DashboardCharts(byStatus, byPriority);
    }

    private AuthDtos.ChartSlice slice(String label, long value) {
        return new AuthDtos.ChartSlice(label, value);
    }

    private Ticket findTicket(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket introuvable"));
    }

    private void ensureCanAccess(Ticket ticket, UserAccount user) {
        if (hasStaffRole(user) || ticket.getClient().getId().equals(user.getId())) {
            return;
        }
        throw new IllegalArgumentException("Ticket introuvable");
    }

    private boolean hasStaffRole(UserAccount user) {
        return user.getRoles().contains(Role.AGENT)
                || user.getRoles().contains(Role.SUPERVISEUR)
                || user.getRoles().contains(Role.ADMIN);
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
                ticket.getClient().isActive(),
                ticket.getClient().getCreatedAt());

        AuthDtos.UserSummary agent = null;
        if (ticket.getAssignedAgent() != null) {
            agent = new AuthDtos.UserSummary(
                    ticket.getAssignedAgent().getId(),
                    ticket.getAssignedAgent().getFullName(),
                    ticket.getAssignedAgent().getEmail(),
                    ticket.getAssignedAgent().getRoles(),
                    ticket.getAssignedAgent().isActive(),
                    ticket.getAssignedAgent().getCreatedAt());
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

    private boolean hasAssignedAgent(Ticket ticket, Long agentId) {
        return ticket.getAssignedAgent() != null && ticket.getAssignedAgent().getId().equals(agentId);
    }

    private boolean isMine(Ticket ticket, UserAccount user) {
        return ticket.getClient().getId().equals(user.getId()) || hasAssignedAgent(ticket, user.getId());
    }

    private boolean matchesSearch(Ticket ticket, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }
        String normalized = search.trim().toLowerCase();
        return ticket.getTitle().toLowerCase().contains(normalized)
                || ticket.getDescription().toLowerCase().contains(normalized)
                || ticket.getClient().getFullName().toLowerCase().contains(normalized)
                || (ticket.getAssignedAgent() != null && ticket.getAssignedAgent().getFullName().toLowerCase().contains(normalized));
    }

    private boolean isSlaBreached(Ticket ticket, Instant now) {
        return isOpenWork(ticket) && ticket.getSlaDeadline().isBefore(now);
    }

    private boolean isOpenWork(Ticket ticket) {
        return ticket.getStatus() == TicketStatus.OUVERT
                || ticket.getStatus() == TicketStatus.EN_COURS
                || ticket.getStatus() == TicketStatus.EN_ATTENTE;
    }

    private int priorityRank(TicketPriority priority) {
        return switch (priority) {
            case CRITIQUE -> 0;
            case ELEVEE -> 1;
            case MOYENNE -> 2;
            case FAIBLE -> 3;
        };
    }
}
