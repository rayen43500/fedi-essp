package org.example.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.example.backend.api.dto.AuthDtos;
import org.example.backend.domain.Role;
import org.example.backend.domain.TicketCategory;
import org.example.backend.domain.TicketPriority;
import org.example.backend.domain.TicketType;
import org.example.backend.domain.UserAccount;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ChatbotService {

    private final KnowledgeService knowledgeService;
    private final GeminiService geminiService;
    private final TicketService ticketService;
    private final CurrentUserService currentUserService;

    public ChatbotService(KnowledgeService knowledgeService,
                          GeminiService geminiService,
                          TicketService ticketService,
                          CurrentUserService currentUserService) {
        this.knowledgeService = knowledgeService;
        this.geminiService = geminiService;
        this.ticketService = ticketService;
        this.currentUserService = currentUserService;
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
                    "Parfait — votre ticket #" + created.id() + " est créé. Un agent Topnet va le prendre en charge rapidement.",
                    List.of(),
                    geminiService.isConfigured(),
                    true,
                    created,
                    null,
                    false);
        }

        String searchQuery = buildSearchQuery(question, request.history());
        List<AuthDtos.KnowledgeView> suggestions = knowledgeService.search(searchQuery).stream()
                .limit(5)
                .toList();

        if (!geminiService.isConfigured()) {
            if (request.ticketDraft() != null && canCreateTicket && !Boolean.TRUE.equals(request.confirmTicket())) {
                AuthDtos.ChatbotReply draftReply = handleDraftUpdateHeuristic(question, request.ticketDraft(), suggestions);
                if (draftReply != null) {
                    return draftReply;
                }
            }
            return fallbackReply(question, suggestions, canCreateTicket, currentUser, request.ticketDraft());
        }

        try {
            return chatWithGemini(question, request, currentUser, canCreateTicket, suggestions);
        } catch (Exception ex) {
            AuthDtos.ChatbotReply fallback = fallbackReply(question, suggestions, canCreateTicket, currentUser, request.ticketDraft());
            String notice = geminiService.isConfigured()
                    ? "\n\n_(Réponse de secours — l'IA n'a pas pu répondre : " + sanitizeForUser(ex.getMessage()) + ")_"
                    : "";
            return reply(
                    fallback.answer() + notice,
                    fallback.suggestions(),
                    false,
                    fallback.ticketCreated(),
                    fallback.createdTicket(),
                    fallback.proposedTicket(),
                    fallback.awaitingConfirmation());
        }
    }

    private AuthDtos.ChatbotReply chatWithGemini(String question,
                                                 AuthDtos.ChatRequest request,
                                                 UserAccount currentUser,
                                                 boolean canCreateTicket,
                                                 List<AuthDtos.KnowledgeView> suggestions) {
        List<GeminiService.ChatTurn> history = toGeminiHistory(request.history());
        String knowledgeContext = buildKnowledgeContext(suggestions);
        String systemPrompt = buildSystemPrompt(
                knowledgeContext,
                canCreateTicket,
                request.ticketDraft(),
                currentUser);

        JsonNode parsed = geminiService.generateAssistantJson(systemPrompt, history, question);

        String answer = polishAnswer(parsed.path("answer").asText(
                "Pouvez-vous préciser votre problème ? Je suis là pour vous aider."));
        String intent = parsed.path("intent").asText("GENERAL").toUpperCase(Locale.ROOT);
        boolean wantsTicket = parsed.path("createTicket").asBoolean(false);
        boolean updateDraft = parsed.path("updateDraft").asBoolean(false);
        boolean needsClarification = parsed.path("needsClarification").asBoolean(false);

        if (request.ticketDraft() != null && canCreateTicket
                && (updateDraft || wantsTicket || "UPDATE_DRAFT".equals(intent))) {
            AuthDtos.TicketDraftDto draft = buildDraftFromAi(parsed, question, request.ticketDraft());
            if (isConfirmationMessage(question) && !needsClarification) {
                AuthDtos.TicketView created = createTicketFromDraft(draft, currentUser);
                return reply(
                        polishAnswer("Ticket #" + created.id() + " envoyé au support Topnet. " + answer),
                        suggestions,
                        true,
                        true,
                        created,
                        null,
                        false);
            }
            String draftAnswer = answer;
            if (!draftAnswer.toLowerCase(Locale.ROOT).contains("confirmer")) {
                draftAnswer += "\n\nVérifiez le brouillon ci-dessous puis cliquez sur **Confirmer et envoyer**.";
            }
            return reply(draftAnswer, suggestions, true, false, null, draft, true);
        }

        if (wantsTicket && canCreateTicket && !needsClarification) {
            AuthDtos.TicketDraftDto draft = buildDraftFromAi(parsed, question, null);
            if (isConfirmationMessage(question)) {
                AuthDtos.TicketView created = createTicketFromDraft(draft, currentUser);
                return reply(
                        polishAnswer("Ticket #" + created.id() + " créé. " + answer),
                        suggestions,
                        true,
                        true,
                        created,
                        null,
                        false);
            }
            String draftAnswer = answer;
            if (!draftAnswer.toLowerCase(Locale.ROOT).contains("confirmer")
                    && !draftAnswer.toLowerCase(Locale.ROOT).contains("brouillon")) {
                draftAnswer += "\n\nUn brouillon de ticket a été préparé — confirmez-le pour l'envoyer au support.";
            }
            return reply(draftAnswer, suggestions, true, false, null, draft, true);
        }

        if (needsClarification || "CLARIFY".equals(intent)) {
            return reply(polishAnswer(answer), suggestions, true, false, null, request.ticketDraft(), request.ticketDraft() != null);
        }

        return reply(polishAnswer(answer), suggestions, true, false, null, null, false);
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
                "Ticket #" + ticket.id() + " préparé et envoyé. Suivez son avancement dans vos tickets.",
                List.of(),
                geminiService.isConfigured(),
                true,
                ticket,
                null,
                false);
    }

    private AuthDtos.ChatbotReply handleDraftUpdateHeuristic(String question,
                                                             AuthDtos.TicketDraftDto currentDraft,
                                                             List<AuthDtos.KnowledgeView> suggestions) {
        if (isModificationMessage(question) && !hasDraftUpdatePayload(question)) {
            return reply(
                    "Indiquez ce que vous souhaitez changer (titre, description, priorité…), ou modifiez le brouillon dans le formulaire.",
                    suggestions,
                    false,
                    false,
                    null,
                    currentDraft,
                    true);
        }
        if (!isModificationMessage(question) && !isDraftCorrectionDetail(question)) {
            return null;
        }
        AuthDtos.TicketDraftDto updated = mergeDraftWithMessage(currentDraft, question);
        return reply(
                "Brouillon mis à jour. Vérifiez le résumé puis cliquez sur « Confirmer et envoyer ».",
                suggestions,
                false,
                false,
                null,
                updated,
                true);
    }

    private AuthDtos.ChatbotReply fallbackReply(String question,
                                                List<AuthDtos.KnowledgeView> suggestions,
                                                boolean canCreateTicket,
                                                UserAccount currentUser,
                                                AuthDtos.TicketDraftDto existingDraft) {
        if (existingDraft != null && canCreateTicket) {
            AuthDtos.ChatbotReply draftReply = handleDraftUpdateHeuristic(question, existingDraft, suggestions);
            if (draftReply != null) {
                return draftReply;
            }
        }
        if (canCreateTicket && wantsTicketCreation(question)) {
            AuthDtos.TicketDraftDto draft = buildDraftFromMessage(question);
            String problemDetail = extractProblemDetail(question);
            if (!problemDetail.isBlank()) {
                draft = new AuthDtos.TicketDraftDto(
                        problemDetail.length() > 100 ? problemDetail.substring(0, 97) + "..." : problemDetail,
                        problemDetail,
                        TicketType.INCIDENT,
                        inferCategory(problemDetail, TicketCategory.AUTRE),
                        inferPriority(problemDetail, TicketPriority.MOYENNE));
            }
            if (isConfirmationMessage(question)) {
                AuthDtos.TicketView ticket = createTicketFromDraft(draft, currentUser);
                String answer = "Ticket #" + ticket.id() + " créé pour vous. Un agent va le traiter.";
                if (!suggestions.isEmpty()) {
                    answer += " Consultez aussi les articles proposés.";
                }
                return reply(answer, suggestions, false, true, ticket, null, false);
            }
            return reply(
                    "J'ai préparé un ticket à partir de votre message. Vérifiez le brouillon et confirmez l'envoi.",
                    suggestions,
                    false,
                    false,
                    null,
                    draft,
                    true);
        }

        String answer;
        if (!suggestions.isEmpty()) {
            String titles = suggestions.stream()
                    .limit(2)
                    .map(AuthDtos.KnowledgeView::title)
                    .collect(Collectors.joining(" », « "));
            answer = "J'ai trouvé des articles utiles (« " + titles + " »). Parcourez-les ci-dessous. "
                    + "Si le problème persiste, décrivez-le et je préparerai un ticket.";
        } else if (canCreateTicket) {
            answer = "Décrivez votre problème (réseau, logiciel, accès…) ou cliquez sur « Créer un ticket ». "
                    + "Je vous guiderai étape par étape.";
        } else {
            answer = "Je n'ai pas trouvé d'article correspondant. Reformulez votre question ou contactez un agent.";
        }
        return reply(answer, suggestions, geminiService.isConfigured(), false, null, null, false);
    }

    private String buildSearchQuery(String question, List<AuthDtos.ChatMessage> history) {
        Set<String> terms = new LinkedHashSet<>();
        terms.add(question);
        if (history != null) {
            history.stream()
                    .filter(m -> "user".equalsIgnoreCase(m.role()))
                    .map(AuthDtos.ChatMessage::content)
                    .filter(c -> c != null && !c.isBlank())
                    .limit(3)
                    .forEach(terms::add);
        }
        return String.join(" ", terms);
    }

    private String extractProblemDetail(String message) {
        if (message == null) {
            return "";
        }
        String[] markers = {
                "mon problème :", "mon probleme :", "mon problème:", "mon probleme:",
                "problème :", "probleme :", "problème:", "probleme:"
        };
        String lower = message.toLowerCase(Locale.ROOT);
        for (String marker : markers) {
            int idx = lower.indexOf(marker);
            if (idx >= 0) {
                return message.substring(idx + marker.length()).trim();
            }
        }
        return "";
    }

    private String polishAnswer(String answer) {
        if (answer == null || answer.isBlank()) {
            return "Comment puis-je vous aider ?";
        }
        return answer
                .replace("**", "")
                .replaceAll("\\n{3,}", "\n\n")
                .trim();
    }

    private String sanitizeForUser(String message) {
        if (message == null) {
            return "erreur technique";
        }
        if (message.length() > 120) {
            return message.substring(0, 117) + "...";
        }
        return message;
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

    private AuthDtos.TicketDraftDto buildDraftFromAi(JsonNode parsed, String fallbackMessage, AuthDtos.TicketDraftDto existing) {
        String title = parsed.path("ticketTitle").asText("").trim();
        String description = parsed.path("ticketDescription").asText("").trim();

        if (title.isBlank() && existing != null) {
            title = existing.title();
        }
        if (description.isBlank() && existing != null) {
            description = existing.description();
        }
        if (title.isBlank()) {
            String detail = extractProblemDetail(fallbackMessage);
            String source = detail.isBlank() ? fallbackMessage : detail;
            title = source.length() > 100 ? source.substring(0, 97) + "..." : source;
        }
        if (description.isBlank()) {
            description = extractProblemDetail(fallbackMessage);
            if (description.isBlank()) {
                description = fallbackMessage;
            }
        }

        TicketType type = parseEnum(parsed.path("ticketType").asText(""), TicketType.class,
                existing != null ? existing.type() : TicketType.INCIDENT);
        TicketCategory category = parseEnum(parsed.path("ticketCategory").asText(""), TicketCategory.class,
                existing != null ? existing.category() : inferCategory(description, TicketCategory.AUTRE));
        TicketPriority priority = parseEnum(parsed.path("ticketPriority").asText(""), TicketPriority.class,
                existing != null ? existing.priority() : inferPriority(description, TicketPriority.MOYENNE));

        if (category == TicketCategory.AUTRE && existing == null) {
            category = inferCategory(description + " " + fallbackMessage, category);
        }
        if (priority == TicketPriority.MOYENNE && existing == null) {
            priority = inferPriority(description + " " + fallbackMessage, priority);
        }

        return new AuthDtos.TicketDraftDto(
                title.substring(0, Math.min(title.length(), 180)),
                description.substring(0, Math.min(description.length(), 2500)),
                type,
                category,
                priority);
    }

    private AuthDtos.TicketDraftDto buildDraftFromMessage(String message) {
        String detail = extractProblemDetail(message);
        String source = detail.isBlank() ? message : detail;
        String title = source.length() > 100 ? source.substring(0, 97) + "..." : source;
        return new AuthDtos.TicketDraftDto(
                title,
                source,
                TicketType.INCIDENT,
                inferCategory(source, TicketCategory.AUTRE),
                inferPriority(source, TicketPriority.MOYENNE));
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
                || lower.contains("envoyer le ticket")
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
                || lower.contains("mon probleme")
                || lower.contains("mon problème")
                || lower.contains("j'ai un probleme")
                || lower.contains("j'ai un problème")
                || lower.contains("ne marche pas")
                || lower.contains("ne fonctionne pas")
                || lower.contains("panne")
                || isConfirmationMessage(message);
    }

    private boolean isModificationMessage(String message) {
        String lower = message.toLowerCase(Locale.ROOT);
        return lower.contains("modifier")
                || lower.contains("modification")
                || lower.contains("changer")
                || lower.contains("corriger")
                || lower.contains("mettre a jour")
                || lower.contains("mettre à jour")
                || lower.contains("ajuster");
    }

    private boolean hasDraftUpdatePayload(String message) {
        return stripModificationBoilerplate(message).length() > 3;
    }

    private boolean isDraftCorrectionDetail(String message) {
        String cleaned = stripModificationBoilerplate(message).toLowerCase(Locale.ROOT);
        if (cleaned.length() <= 3 || cleaned.contains("?")) {
            return false;
        }
        return cleaned.contains("priorit")
                || cleaned.contains("titre")
                || cleaned.contains("description")
                || cleaned.contains("categorie")
                || cleaned.contains("catégorie")
                || cleaned.contains("urgent")
                || cleaned.contains("critique")
                || cleaned.contains("wifi")
                || cleaned.contains("reseau")
                || cleaned.contains("réseau");
    }

    private String stripModificationBoilerplate(String message) {
        if (message == null) {
            return "";
        }
        return message
                .replaceAll("(?i)^\\s*je souhaite modifier le ticket\\s*:?\\s*", "")
                .replaceAll("(?i)^\\s*modifier le ticket\\s*:?\\s*", "")
                .trim();
    }

    private AuthDtos.TicketDraftDto mergeDraftWithMessage(AuthDtos.TicketDraftDto draft, String message) {
        String detail = stripModificationBoilerplate(message);
        if (detail.isBlank()) {
            return draft;
        }
        String title = draft.title();
        String description = draft.description();
        TicketCategory category = draft.category();
        TicketPriority priority = draft.priority();

        if (detail.length() <= 120 && !detail.contains("\n")) {
            title = detail;
        }
        description = description + "\n\nPrécision client : " + detail;
        category = inferCategory(detail, category);
        priority = inferPriority(detail, priority);

        return new AuthDtos.TicketDraftDto(
                title.substring(0, Math.min(title.length(), 180)),
                description.substring(0, Math.min(description.length(), 2500)),
                draft.type(),
                category,
                priority);
    }

    private TicketCategory inferCategory(String text, TicketCategory fallback) {
        String lower = text.toLowerCase(Locale.ROOT);
        if (lower.contains("wifi") || lower.contains("wi-fi") || lower.contains("reseau") || lower.contains("réseau")
                || lower.contains("vpn") || lower.contains("internet") || lower.contains("connexion")
                || lower.contains("fibre") || lower.contains("box")) {
            return TicketCategory.RESEAU;
        }
        if (lower.contains("email") || lower.contains("messagerie") || lower.contains("outlook")
                || lower.contains("teams") || lower.contains("logiciel")) {
            return TicketCategory.LOGICIEL;
        }
        if (lower.contains("acces") || lower.contains("accès") || lower.contains("mot de passe") || lower.contains("compte")) {
            return TicketCategory.ACCES;
        }
        if (lower.contains("pc") || lower.contains("ordinateur") || lower.contains("imprimante") || lower.contains("ecran")) {
            return TicketCategory.MATERIEL;
        }
        return fallback;
    }

    private TicketPriority inferPriority(String text, TicketPriority fallback) {
        String lower = text.toLowerCase(Locale.ROOT);
        if (lower.contains("critique") || lower.contains("urgent") || lower.contains("bloque") || lower.contains("bloqué")
                || lower.contains("production") || lower.contains("tout le monde")) {
            return TicketPriority.CRITIQUE;
        }
        if (lower.contains("important") || lower.contains("eleve") || lower.contains("élevé") || lower.contains("rapidement")) {
            return TicketPriority.ELEVEE;
        }
        if (lower.contains("faible") || lower.contains("pas pressé") || lower.contains("quand possible")) {
            return TicketPriority.FAIBLE;
        }
        return fallback;
    }

    private String buildKnowledgeContext(List<AuthDtos.KnowledgeView> suggestions) {
        if (suggestions.isEmpty()) {
            return "(Aucun article trouvé pour cette recherche.)";
        }
        StringBuilder sb = new StringBuilder();
        int i = 1;
        for (AuthDtos.KnowledgeView article : suggestions) {
            sb.append(i++).append(". [").append(article.category()).append("] ")
                    .append(article.title()).append("\n")
                    .append(truncate(article.content(), 550)).append("\n\n");
        }
        return sb.toString().trim();
    }

    private String buildSystemPrompt(String knowledgeContext,
                                     boolean canCreateTicket,
                                     AuthDtos.TicketDraftDto draft,
                                     UserAccount user) {
        String userContext = "Utilisateur : " + user.getFullName()
                + " | Rôle : " + (canCreateTicket ? "CLIENT" : "STAFF")
                + " | Email : " + user.getEmail();

        String draftContext = draft == null
                ? ""
                : """
                
                BROUILLON EN COURS (le client doit confirmer avant envoi) :
                - Titre : %s
                - Description : %s
                - Type : %s | Catégorie : %s | Priorité : %s
                Si le client demande une modification → intent=UPDATE_DRAFT, updateDraft=true, createTicket=true,
                et mettez à jour tous les champs ticket* pertinents. Ne créez pas le ticket vous-même.
                """.formatted(draft.title(), draft.description(), draft.type(), draft.category(), draft.priority());

        String ticketRules = canCreateTicket
                ? """
                RÈGLES TICKETS (clients uniquement) :
                - Proposez d'abord 1 à 3 étapes de dépannage issues des articles si pertinent (intent=TROUBLESHOOT ou KNOWLEDGE).
                - createTicket=true seulement si : panne non résolue, demande explicite de ticket, ou impact métier.
                - ticketTitle : court et précis (max 80 car.), ticketDescription : contexte, symptômes, depuis quand, ce qui a été testé.
                - ticketType : INCIDENT (panne) ou DEMANDE (nouvelle demande).
                - ticketCategory : MATERIEL | LOGICIEL | RESEAU | ACCES | AUTRE
                - ticketPriority : FAIBLE | MOYENNE | ELEVEE | CRITIQUE (wifi coupé travail = ELEVEE minimum).
                - needsClarification=true si informations manquantes (intent=CLARIFY) : posez UNE question précise dans answer.
                - Ne dites jamais que le ticket est déjà créé — le client confirme dans l'interface.
                - answer : français soigné, ton professionnel et rassurant Topnet, 2 à 6 phrases ou liste numérotée courte.
                - Citez les titres d'articles utilisés dans referencedArticleTitles.
                """
                : """
                L'utilisateur est STAFF : createTicket=false, updateDraft=false. Aidez à répondre aux clients et à trouver des articles.
                """;

        return """
                Tu es l'assistant support IA de Topnet (opérateur télécom / IT entreprise).
                %s
                
                BASE DE CONNAISSANCES (source prioritaire — ne inventez pas de procédures) :
                %s
                %s
                
                %s
                
                Comportement :
                - Répondez UNIQUEMENT en JSON valide selon le schéma.
                - intent : TROUBLESHOOT | KNOWLEDGE | CREATE_TICKET | UPDATE_DRAFT | CONFIRM | CLARIFY | GENERAL
                - Soyez concret : étapes, vérifications câble/reboot, contact support si échec.
                - Si le client décrit un problème technique sans demander de ticket, essayez d'abord TROUBLESHOOT puis proposez un brouillon si besoin.
                """.formatted(userContext, knowledgeContext, draftContext, ticketRules);
    }

    private List<GeminiService.ChatTurn> toGeminiHistory(List<AuthDtos.ChatMessage> history) {
        List<GeminiService.ChatTurn> turns = new ArrayList<>();
        if (history == null) {
            return turns;
        }
        int start = Math.max(0, history.size() - 12);
        for (int i = start; i < history.size(); i++) {
            AuthDtos.ChatMessage message = history.get(i);
            if (message.content() == null || message.content().isBlank()) {
                continue;
            }
            String role = "assistant".equalsIgnoreCase(message.role()) ? "model" : "user";
            turns.add(new GeminiService.ChatTurn(role, message.content().trim()));
        }
        return turns;
    }

    private <E extends Enum<E>> E parseEnum(String raw, Class<E> type, E fallback) {
        if (raw == null || raw.isBlank()) {
            return fallback;
        }
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
