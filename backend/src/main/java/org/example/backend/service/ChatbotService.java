package org.example.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.api.dto.AuthDtos;
import org.example.backend.domain.Role;
import org.example.backend.domain.TicketCategory;
import org.example.backend.domain.TicketPriority;
import org.example.backend.domain.TicketType;
import org.example.backend.domain.UserAccount;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class ChatbotService {

    private final KnowledgeService knowledgeService;
    private final GeminiService geminiService;
    private final TicketService ticketService;
    private final CurrentUserService currentUserService;
    private final ObjectMapper objectMapper;

    public ChatbotService(KnowledgeService knowledgeService,
                          GeminiService geminiService,
                          TicketService ticketService,
                          CurrentUserService currentUserService,
                          ObjectMapper objectMapper) {
        this.knowledgeService = knowledgeService;
        this.geminiService = geminiService;
        this.ticketService = ticketService;
        this.currentUserService = currentUserService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public AuthDtos.AssistantStatus status() {
        return new AuthDtos.AssistantStatus(geminiService.isConfigured());
    }

    @Transactional(readOnly = true)
    public AuthDtos.ChatbotReply ask(String question) {
        return chat(new AuthDtos.ChatRequest(question, List.of(), false, null));
    }

    @Transactional
    public AuthDtos.ChatbotReply chat(AuthDtos.ChatRequest request) {
        String question = request.message().trim();
        if (question.isBlank()) {
            throw new IllegalArgumentException("Message vide");
        }

        UserAccount currentUser = currentUserService.requireCurrentUser();
        boolean canCreateTicket = currentUser.getRoles().contains(Role.CLIENT);

        if (Boolean.TRUE.equals(request.confirmTicket()) && request.ticketDraft() != null && canCreateTicket) {
            AuthDtos.TicketView created = createTicketFromDraft(request.ticketDraft(), currentUser);
            return reply(
                    "Parfait — votre ticket #" + created.id() + " est cree. Un agent va le prendre en charge rapidement.",
                    List.of(),
                    geminiService.isConfigured(),
                    true,
                    created,
                    null,
                    false);
        }

        List<AuthDtos.KnowledgeView> suggestions = knowledgeService.search(question).stream()
                .limit(3)
                .toList();

        if (!geminiService.isConfigured()) {
            return fallbackReply(question, suggestions, canCreateTicket, currentUser);
        }

        try {
            String knowledgeContext = buildKnowledgeContext(suggestions);
            List<GeminiService.ChatTurn> history = toGeminiHistory(request.history());
            String systemPrompt = buildSystemPrompt(knowledgeContext, canCreateTicket);
            String rawJson = geminiService.generateJson(systemPrompt, history, question);
            JsonNode parsed = objectMapper.readTree(rawJson);

            String answer = parsed.path("answer").asText(
                    "Je n'ai pas pu formuler une reponse claire. Pouvez-vous preciser votre probleme ?");
            boolean wantsTicket = parsed.path("createTicket").asBoolean(false);

            if (wantsTicket && canCreateTicket) {
                AuthDtos.TicketDraftDto draft = buildDraftFromAi(parsed, question);
                if (isConfirmationMessage(question)) {
                    AuthDtos.TicketView created = createTicketFromDraft(draft, currentUser);
                    return reply(
                            answer + "\n\nTicket #" + created.id() + " confirme et envoye au support.",
                            suggestions,
                            true,
                            true,
                            created,
                            null,
                            false);
                }
                return reply(
                        answer + "\n\nVoici le ticket propose. Cliquez sur « Confirmer » pour l'envoyer au support.",
                        suggestions,
                        true,
                        false,
                        null,
                        draft,
                        true);
            }

            return reply(answer, suggestions, true, false, null, null, false);
        } catch (Exception ex) {
            AuthDtos.ChatbotReply fallback = fallbackReply(question, suggestions, canCreateTicket, currentUser);
            return reply(
                    fallback.answer() + "\n\n(Assistant IA temporairement indisponible — reponse de secours.)",
                    fallback.suggestions(),
                    false,
                    fallback.ticketCreated(),
                    fallback.createdTicket(),
                    fallback.proposedTicket(),
                    fallback.awaitingConfirmation());
        }
    }

    @Transactional
    public AuthDtos.ChatbotReply createTicketForClient(AuthDtos.ChatRequest request) {
        UserAccount currentUser = currentUserService.requireCurrentUser();
        if (!currentUser.getRoles().contains(Role.CLIENT)) {
            throw new IllegalArgumentException("Seuls les clients peuvent creer un ticket via l'assistant");
        }
        String message = request.message().trim();
        if (message.isBlank()) {
            throw new IllegalArgumentException("Message vide");
        }
        AuthDtos.TicketDraftDto draft = buildDraftFromMessage(message);
        AuthDtos.TicketView ticket = createTicketFromDraft(draft, currentUser);
        return reply(
                "Ticket #" + ticket.id() + " prepare et envoye. Suivez son avancement dans vos tickets.",
                List.of(),
                geminiService.isConfigured(),
                true,
                ticket,
                null,
                false);
    }

    private AuthDtos.ChatbotReply fallbackReply(String question,
                                                  List<AuthDtos.KnowledgeView> suggestions,
                                                  boolean canCreateTicket,
                                                  UserAccount currentUser) {
        if (canCreateTicket && wantsTicketCreation(question)) {
            AuthDtos.TicketDraftDto draft = buildDraftFromMessage(question);
            if (isConfirmationMessage(question)) {
                AuthDtos.TicketView ticket = createTicketFromDraft(draft, currentUser);
                String answer = "Ticket #" + ticket.id() + " cree pour vous. Un agent va le traiter.";
                if (!suggestions.isEmpty()) {
                    answer += " Consultez aussi les articles proposes.";
                }
                return reply(answer, suggestions, false, true, ticket, null, false);
            }
            return reply(
                    "J'ai prepare un ticket a partir de votre message. Confirmez pour l'envoyer au support.",
                    suggestions,
                    false,
                    false,
                    null,
                    draft,
                    true);
        }

        String answer;
        if (!suggestions.isEmpty()) {
            answer = "J'ai trouve des articles utiles. Si besoin, dites « creer un ticket » avec les details.";
        } else if (canCreateTicket) {
            answer = "Decrivez votre probleme ou utilisez « Creer un ticket avec l'IA » pour un envoi guide.";
        } else {
            answer = "Je n'ai pas trouve de solution immediate dans la base de connaissances.";
        }
        return reply(answer, suggestions, geminiService.isConfigured(), false, null, null, false);
    }

    private AuthDtos.ChatbotReply reply(String answer,
                                        List<AuthDtos.KnowledgeView> suggestions,
                                        boolean enabled,
                                        boolean created,
                                        AuthDtos.TicketView ticket,
                                        AuthDtos.TicketDraftDto draft,
                                        boolean awaiting) {
        return new AuthDtos.ChatbotReply(answer, suggestions, enabled, created, ticket, draft, awaiting);
    }

    private AuthDtos.TicketDraftDto buildDraftFromAi(JsonNode parsed, String fallbackMessage) {
        String title = parsed.path("ticketTitle").asText("").trim();
        String description = parsed.path("ticketDescription").asText("").trim();
        if (title.isBlank()) {
            title = fallbackMessage.length() > 100 ? fallbackMessage.substring(0, 97) + "..." : fallbackMessage;
        }
        if (description.isBlank()) {
            description = fallbackMessage;
        }
        TicketType type = parseEnum(parsed.path("ticketType").asText("INCIDENT"), TicketType.class, TicketType.INCIDENT);
        TicketCategory category = parseEnum(
                parsed.path("ticketCategory").asText("AUTRE"), TicketCategory.class, TicketCategory.AUTRE);
        TicketPriority priority = parseEnum(
                parsed.path("ticketPriority").asText("MOYENNE"), TicketPriority.class, TicketPriority.MOYENNE);
        return new AuthDtos.TicketDraftDto(
                title.substring(0, Math.min(title.length(), 180)),
                description.substring(0, Math.min(description.length(), 2500)),
                type,
                category,
                priority);
    }

    private AuthDtos.TicketDraftDto buildDraftFromMessage(String message) {
        String title = message.length() > 100 ? message.substring(0, 97) + "..." : message;
        return new AuthDtos.TicketDraftDto(title, message, TicketType.INCIDENT, TicketCategory.AUTRE, TicketPriority.MOYENNE);
    }

    private AuthDtos.TicketView createTicketFromDraft(AuthDtos.TicketDraftDto draft, UserAccount client) {
        AuthDtos.TicketCreateRequest request = new AuthDtos.TicketCreateRequest(
                draft.title(),
                draft.description(),
                draft.type(),
                draft.category(),
                draft.priority(),
                null);
        return ticketService.createTicket(request, client);
    }

    private boolean isConfirmationMessage(String message) {
        String lower = message.toLowerCase(Locale.ROOT);
        return lower.equals("oui")
                || lower.equals("ok")
                || lower.contains("confirmer")
                || lower.contains("valider")
                || lower.contains("creer le ticket")
                || lower.contains("créer le ticket")
                || lower.contains("envoyer");
    }

    private boolean wantsTicketCreation(String message) {
        String lower = message.toLowerCase(Locale.ROOT);
        return lower.contains("creer un ticket")
                || lower.contains("créer un ticket")
                || lower.contains("ouvrir un ticket")
                || lower.contains("passer un ticket")
                || lower.contains("nouveau ticket")
                || lower.contains("generer un ticket")
                || lower.contains("générer un ticket")
                || isConfirmationMessage(message);
    }

    private String buildKnowledgeContext(List<AuthDtos.KnowledgeView> suggestions) {
        if (suggestions.isEmpty()) {
            return "Aucun article pertinent trouve.";
        }
        return suggestions.stream()
                .map(a -> "- [" + a.category() + "] " + a.title() + ": " + truncate(a.content(), 400))
                .collect(Collectors.joining("\n"));
    }

    private String buildSystemPrompt(String knowledgeContext, boolean canCreateTicket) {
        String ticketRules = canCreateTicket
                ? """
                Analyse le probleme du client. Si un ticket est necessaire, renseignez createTicket=true
                avec ticketTitle, ticketDescription, ticketType (INCIDENT ou DEMANDE),
                ticketCategory (MATERIEL, LOGICIEL, RESEAU, ACCES, AUTRE) et ticketPriority (FAIBLE, MOYENNE, ELEVEE, CRITIQUE).
                Le client devra confirmer avant envoi : ne dites pas que le ticket est deja cree.
                Sinon createTicket=false.
                """
                : "L'utilisateur n'est pas client: createTicket doit toujours etre false.";

        return """
                Tu es l'assistant support Topnet (plateforme IT). Reponds en francais, clair et professionnel.
                Utilise la base de connaissances avant de proposer un ticket.

                Articles:
                %s

                %s

                JSON uniquement:
                {
                  "answer": "reponse pour l'utilisateur",
                  "createTicket": false,
                  "ticketTitle": "",
                  "ticketDescription": "",
                  "ticketType": "INCIDENT",
                  "ticketCategory": "AUTRE",
                  "ticketPriority": "MOYENNE"
                }
                """.formatted(knowledgeContext, ticketRules);
    }

    private List<GeminiService.ChatTurn> toGeminiHistory(List<AuthDtos.ChatMessage> history) {
        List<GeminiService.ChatTurn> turns = new ArrayList<>();
        if (history == null) {
            return turns;
        }
        for (AuthDtos.ChatMessage message : history) {
            if (message.content() == null || message.content().isBlank()) {
                continue;
            }
            String role = "assistant".equalsIgnoreCase(message.role()) ? "model" : "user";
            turns.add(new GeminiService.ChatTurn(role, message.content().trim()));
        }
        return turns;
    }

    private <E extends Enum<E>> E parseEnum(String raw, Class<E> type, E fallback) {
        try {
            return Enum.valueOf(type, raw.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            return fallback;
        }
    }

    private String truncate(String value, int max) {
        if (value == null) {
            return "";
        }
        return value.length() <= max ? value : value.substring(0, max) + "...";
    }
}
