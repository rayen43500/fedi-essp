package org.example.backend.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.List;

@Component
public class SlaScheduler {

    private final TicketService ticketService;

    public SlaScheduler(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    // Every 5 minutes, escalate breached SLA tickets.
    @Scheduled(fixedDelay = 300000)
    public void checkSlaBreaches() {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new UsernamePasswordAuthenticationToken(
                "system", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        ));
        SecurityContextHolder.setContext(context);
        
        try {
            ticketService.escalateSlaBreaches();
        } finally {
            SecurityContextHolder.clearContext();
        }
    }
}
