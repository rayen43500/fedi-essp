package org.example.backend.api;

import jakarta.validation.Valid;
import org.example.backend.api.dto.AuthDtos;
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
import org.springframework.web.bind.annotation.RestController;

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
    public List<AuthDtos.TicketView> list() {
        return ticketService.listTickets();
    }

    @GetMapping("/{id}")
    public AuthDtos.TicketView get(@PathVariable Long id) {
        return ticketService.getTicket(id);
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('AGENT','SUPERVISEUR','ADMIN')")
    public AuthDtos.TicketView assign(@PathVariable Long id, @Valid @RequestBody AuthDtos.AssignTicketRequest request) {
        return ticketService.assign(id, request.agentId());
    }

    @PatchMapping("/{id}/status")
    public AuthDtos.TicketView changeStatus(@PathVariable Long id, @Valid @RequestBody AuthDtos.TicketStatusRequest request) {
        UserAccount currentUser = currentUserService.requireCurrentUser();
        return ticketService.changeStatus(id, request.status(), currentUser);
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
