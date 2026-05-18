package org.example.backend.api;

import jakarta.validation.Valid;
import org.example.backend.api.dto.AuthDtos;
import org.example.backend.domain.TicketCategory;
import org.example.backend.domain.TicketPriority;
import org.example.backend.domain.TicketStatus;
import org.example.backend.domain.TicketType;
import org.example.backend.domain.UserAccount;
import org.example.backend.service.CurrentUserService;
import org.example.backend.service.TicketService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final CurrentUserService currentUserService;

    public TicketController(TicketService ticketService, CurrentUserService currentUserService) {
        this.ticketService = ticketService;
        this.currentUserService = currentUserService;
    }

    @PostMapping
    public AuthDtos.TicketView create(@Valid @RequestBody AuthDtos.TicketCreateRequest request) {
        UserAccount currentUser = currentUserService.requireCurrentUser();
        return ticketService.createTicket(request, currentUser);
    }

    @GetMapping
    public List<AuthDtos.TicketView> list(@RequestParam(required = false) String q,
                                          @RequestParam(required = false) TicketStatus status,
                                          @RequestParam(required = false) TicketPriority priority,
                                          @RequestParam(required = false) TicketCategory category,
                                          @RequestParam(required = false) TicketType type,
                                          @RequestParam(required = false) Long agentId,
                                          @RequestParam(required = false) Boolean unassigned,
                                          @RequestParam(required = false) Boolean assignedToMe,
                                          @RequestParam(required = false) Boolean mine,
                                          @RequestParam(required = false) Boolean overdue,
                                          @RequestParam(required = false) Boolean includeArchived,
                                          @RequestParam(required = false) Instant createdFrom,
                                          @RequestParam(required = false) Instant createdTo) {
        UserAccount currentUser = currentUserService.requireCurrentUser();
        return ticketService.listTickets(currentUser, q, status, priority, category, type, agentId, unassigned, assignedToMe, mine, overdue, includeArchived, createdFrom, createdTo);
    }

    @GetMapping("/{id}")
    public AuthDtos.TicketView get(@PathVariable Long id) {
        UserAccount currentUser = currentUserService.requireCurrentUser();
        return ticketService.getTicket(id, currentUser);
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('AGENT','SUPERVISEUR','ADMIN')")
    public AuthDtos.TicketView assign(@PathVariable Long id, @Valid @RequestBody AuthDtos.AssignTicketRequest request) {
        UserAccount currentUser = currentUserService.requireCurrentUser();
        return ticketService.assign(id, request.agentId(), currentUser);
    }

    @PatchMapping("/{id}/status")
    public AuthDtos.TicketView changeStatus(@PathVariable Long id, @Valid @RequestBody AuthDtos.TicketStatusRequest request) {
        UserAccount currentUser = currentUserService.requireCurrentUser();
        return ticketService.changeStatus(id, request.status(), currentUser);
    }

    @PatchMapping("/{id}/priority")
    @PreAuthorize("hasAnyRole('AGENT','SUPERVISEUR','ADMIN')")
    public AuthDtos.TicketView changePriority(@PathVariable Long id, @Valid @RequestBody AuthDtos.TicketPriorityRequest request) {
        UserAccount currentUser = currentUserService.requireCurrentUser();
        return ticketService.changePriority(id, request.priority(), currentUser);
    }

    @PostMapping("/{id}/comments")
    public AuthDtos.CommentView addComment(@PathVariable Long id, @Valid @RequestBody AuthDtos.CommentRequest request) {
        UserAccount currentUser = currentUserService.requireCurrentUser();
        return ticketService.addComment(id, request.message(), currentUser);
    }

    @PostMapping("/{id}/satisfaction")
    public AuthDtos.TicketView rateSatisfaction(@PathVariable Long id, @Valid @RequestBody AuthDtos.SatisfactionRequest request) {
        UserAccount currentUser = currentUserService.requireCurrentUser();
        return ticketService.rateSatisfaction(id, request.score(), currentUser);
    }

    @PatchMapping("/archive")
    @PreAuthorize("hasAnyRole('SUPERVISEUR','ADMIN')")
    public int archiveClosedTickets() {
        return ticketService.archiveClosedTickets();
    }

    @PatchMapping("/sla/escalate")
    @PreAuthorize("hasAnyRole('SUPERVISEUR','ADMIN')")
    public int escalateSla() {
        return ticketService.escalateSlaBreaches();
    }
}
