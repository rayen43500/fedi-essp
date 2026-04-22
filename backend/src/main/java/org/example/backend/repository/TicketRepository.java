package org.example.backend.repository;

import org.example.backend.domain.Ticket;
import org.example.backend.domain.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByArchivedFalseOrderByCreatedAtDesc();

    long countByStatus(TicketStatus status);

    List<Ticket> findByStatusNotAndSlaDeadlineBefore(TicketStatus status, Instant date);
}
