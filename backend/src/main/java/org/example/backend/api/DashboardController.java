package org.example.backend.api;

import org.example.backend.api.dto.AuthDtos;
import org.example.backend.service.TicketService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final TicketService ticketService;

    public DashboardController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('AGENT','SUPERVISEUR','ADMIN')")
    public AuthDtos.DashboardStats stats() {
        return ticketService.dashboardStats();
    }
}
