package org.example.backend.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class SlaScheduler {

    private final TicketService ticketService;

    public SlaScheduler(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    // Every 5 minutes, escalate breached SLA tickets.
    @Scheduled(fixedDelay = 300000)
    public void checkSlaBreaches() {
        ticketService.escalateSlaBreaches();
    }
}
