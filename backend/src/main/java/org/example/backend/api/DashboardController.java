package org.example.backend.api;

import org.example.backend.api.dto.AuthDtos;
import org.example.backend.domain.UserAccount;
import org.example.backend.service.CurrentUserService;
import org.example.backend.service.TicketService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final TicketService ticketService;
    private final CurrentUserService currentUserService;

    public DashboardController(TicketService ticketService, CurrentUserService currentUserService) {
        this.ticketService = ticketService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('AGENT','SUPERVISEUR','ADMIN')")
    public AuthDtos.DashboardStats stats() {
        return ticketService.dashboardStats();
    }

    @GetMapping("/charts")
    @PreAuthorize("hasAnyRole('AGENT','SUPERVISEUR','ADMIN')")
    public AuthDtos.DashboardCharts charts() {
        return ticketService.dashboardCharts();
    }

    @GetMapping("/my/charts")
    @PreAuthorize("hasRole('CLIENT')")
    public AuthDtos.DashboardCharts myCharts() {
        UserAccount client = currentUserService.requireCurrentUser();
        return ticketService.dashboardChartsForUser(client);
    }
}
