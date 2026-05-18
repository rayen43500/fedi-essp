package org.example.backend.api.dto;

import org.example.backend.domain.Role;
import org.example.backend.domain.TicketCategory;
import org.example.backend.domain.TicketPriority;
import org.example.backend.domain.TicketStatus;
import org.example.backend.domain.TicketType;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.Set;

public final class AuthDtos {
    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank String fullName,
            @Email @NotBlank String email,
            @NotBlank @Size(min = 6, max = 120) String password
    ) {
    }

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password
    ) {
    }

    public record AuthResponse(
            String token,
            UserSummary user
    ) {
    }

    public record UserSummary(
            Long id,
            String fullName,
            String email,
            Set<Role> roles,
            boolean active,
            Instant createdAt
    ) {
    }

    public record UserRolesRequest(
            @NotNull Set<Role> roles
    ) {
    }

    public record TicketCreateRequest(
            @NotBlank String title,
            @NotBlank @Size(max = 2500) String description,
            @NotNull TicketType type,
            @NotNull TicketCategory category,
            @NotNull TicketPriority priority,
            String attachmentUrl
    ) {
    }

    public record TicketStatusRequest(
            @NotNull TicketStatus status
    ) {
    }

    public record TicketPriorityRequest(
            @NotNull TicketPriority priority
    ) {
    }

    public record AssignTicketRequest(
            @NotNull Long agentId
    ) {
    }

    public record CommentRequest(
            @NotBlank String message
    ) {
    }

    public record SatisfactionRequest(
            @NotNull Integer score
    ) {
    }

    public record TicketView(
            Long id,
            String title,
            String description,
            TicketType type,
            TicketCategory category,
            TicketPriority priority,
            TicketStatus status,
            Instant createdAt,
            Instant updatedAt,
            Instant slaDeadline,
            boolean archived,
            String attachmentUrl,
            Integer satisfactionScore,
            UserSummary client,
            UserSummary agent,
            List<CommentView> comments
    ) {
    }

    public record CommentView(
            Long id,
            String author,
            String message,
            Instant createdAt
    ) {
    }

    public record DashboardStats(
            long totalTickets,
            long openTickets,
            long inProgressTickets,
            long waitingTickets,
            long resolvedTickets,
            long closedTickets,
            long criticalTickets,
            long overdueTickets,
            long unassignedTickets,
            long archivedTickets,
            double averageResolutionHours,
            double customerSatisfactionRate
    ) {
    }

    public record KnowledgeRequest(
            @NotBlank String title,
            @NotBlank String content,
            @NotBlank String category
    ) {
    }

    public record KnowledgeView(
            Long id,
            String title,
            String content,
            String category,
            Instant updatedAt,
            String authorName
    ) {
    }

    public record ChatMessage(
            String role,
            String content
    ) {
    }

    public record ChatRequest(
            @NotBlank String message,
            List<ChatMessage> history
    ) {
    }

    public record ChatbotReply(
            String answer,
            List<KnowledgeView> suggestions,
            boolean assistantEnabled,
            boolean ticketCreated,
            TicketView createdTicket
    ) {
    }

    public record AssistantStatus(
            boolean enabled
    ) {
    }

    public record ChartSlice(
            String label,
            long value
    ) {
    }

    public record DashboardCharts(
            List<ChartSlice> ticketsByStatus,
            List<ChartSlice> ticketsByPriority
    ) {
    }

    public record NotificationView(
            Long id,
            String title,
            String message,
            boolean read,
            Instant createdAt
    ) {
    }
}
