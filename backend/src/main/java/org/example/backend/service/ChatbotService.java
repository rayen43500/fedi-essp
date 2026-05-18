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
        return chat(new AuthDtos.ChatRequest(question, List.of()));
    }

    @Transactional
    public AuthDtos.ChatbotReply chat(AuthDtos.ChatRequest request) {
        String question = request.message().trim();
        if (question.isBlank()) {
            throw new IllegalArgumentException("Message vide");
        }

        List<AuthDtos.KnowledgeView> suggestions = knowledgeService.search(question).stream()
                .limit(3)
                .toList();

        UserAccount currentUser = currentUserService.requireCurrentUser();
        boolean canCreateTicket = currentUser.getRoles().contains(Role.CLIENT);

        if (!geminiService.isConfigured()) {
            return fallbackReply(question, suggestions, canCreateTicket);
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

            AuthDtos.TicketView createdTicket = null;
            if (wantsTicket && canCreateTicket) {
                createdTicket = createTicketFromAi(parsed, currentUser);
                if (createdTicket != null) {
                    answer = answer + "\n\nJ'ai cree le ticket #" + createdTicket.id()
                            + " pour vous. L'equipe support va le traiter.";
                }
            }

            return new AuthDtos.ChatbotReply(
                    answer,
                    suggestions,
                    true,
                    createdTicket != null,
                    createdTicket
            );
        } catch (Exception ex) {
            AuthDtos.ChatbotReply fallback = fallbackReply(question, suggestions, canCreateTicket);
            return new AuthDtos.ChatbotReply(
                    fallback.answer() + "\n\n(Assistant IA temporairement indisponible — reponse de secours.)",
                    fallback.suggestions(),
                    false,
                    false,
                    null
            );
        }
    }

    private AuthDtos.ChatbotReply fallbackReply(String question,
                                                  List<AuthDtos.KnowledgeView> suggestions,
                                                  boolean canCreateTicket) {
        String answer;
        if (!suggestions.isEmpty()) {
            answer = "J'ai trouve des articles qui peuvent vous aider avant de creer un ticket.";
        } else if (canCreateTicket) {
            answer = "Je n'ai pas trouve de solution immediate. Decrivez votre probleme en detail "
                    + "et je pourrai creer un ticket pour vous si necessaire.";
        } else {
            answer = "Je n'ai pas trouve de solution immediate dans la base de connaissances.";
        }
        return new AuthDtos.ChatbotReply(answer, suggestions, geminiService.isConfigured(), false, null);
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
                Si le client confirme vouloir ouvrir un ticket, ou si le probleme necessite une intervention humaine,
                renseignez createTicket=true avec ticketTitle, ticketDescription, ticketType (INCIDENT ou DEMANDE),
                ticketCategory (MATERIEL, LOGICIEL, RESEAU, ACCES, AUTRE) et ticketPriority (FAIBLE, MOYENNE, ELEVEE, CRITIQUE).
                Sinon createTicket=false.
                """
                : "L'utilisateur n'est pas client: createTicket doit toujours etre false.";

        return """
                Tu es l'assistant support Topnet pour une plateforme de tickets IT.
                Reponds en francais, de facon claire et professionnelle.
                Utilise la base de connaissances fournie avant de proposer un ticket.

                Articles disponibles:
                %s

                %s

                Reponds UNIQUEMENT en JSON avec cette structure exacte:
                {
                  "answer": "texte de reponse pour l'utilisateur",
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

    private AuthDtos.TicketView createTicketFromAi(JsonNode parsed, UserAccount client) {
        String title = parsed.path("ticketTitle").asText("").trim();
        String description = parsed.path("ticketDescription").asText("").trim();
        if (title.isBlank() || description.isBlank()) {
            return null;
        }

        TicketType type = parseEnum(parsed.path("ticketType").asText("INCIDENT"), TicketType.class, TicketType.INCIDENT);
        TicketCategory category = parseEnum(
                parsed.path("ticketCategory").asText("AUTRE"), TicketCategory.class, TicketCategory.AUTRE);
        TicketPriority priority = parseEnum(
                parsed.path("ticketPriority").asText("MOYENNE"), TicketPriority.class, TicketPriority.MOYENNE);

        AuthDtos.TicketCreateRequest request = new AuthDtos.TicketCreateRequest(
                title.substring(0, Math.min(title.length(), 180)),
                description.substring(0, Math.min(description.length(), 2500)),
                type,
                category,
                priority,
                null
        );
        return ticketService.createTicket(request, client);
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
