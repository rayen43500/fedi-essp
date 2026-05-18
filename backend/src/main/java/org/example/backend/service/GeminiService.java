package org.example.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class GeminiService {

    private static final String API_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    private static final Pattern JSON_FENCE = Pattern.compile("```(?:json)?\\s*([\\s\\S]*?)```", Pattern.CASE_INSENSITIVE);

    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    @Value("${app.gemini.api-key:}")
    private String apiKey;

    @Value("${app.gemini.model:gemini-2.0-flash}")
    private String model;

    @Value("${app.gemini.temperature:0.4}")
    private double temperature;

    @Value("${app.gemini.max-output-tokens:2048}")
    private int maxOutputTokens;

    public GeminiService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.restClient = RestClient.create();
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public String getModel() {
        return model;
    }

    public JsonNode generateAssistantJson(String systemPrompt, List<ChatTurn> history, String userMessage) {
        if (!isConfigured()) {
            throw new IllegalStateException("GEMINI_API_KEY non configuree");
        }

        List<Map<String, Object>> contents = new ArrayList<>();
        for (ChatTurn turn : history) {
            contents.add(Map.of(
                    "role", turn.role(),
                    "parts", List.of(Map.of("text", turn.content()))
            ));
        }
        contents.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", userMessage))
        ));

        Map<String, Object> generationConfig = new LinkedHashMap<>();
        generationConfig.put("temperature", temperature);
        generationConfig.put("topP", 0.9);
        generationConfig.put("topK", 40);
        generationConfig.put("maxOutputTokens", maxOutputTokens);
        generationConfig.put("responseMimeType", "application/json");
        generationConfig.put("responseSchema", assistantResponseSchema());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("systemInstruction", Map.of("parts", List.of(Map.of("text", systemPrompt))));
        body.put("contents", contents);
        body.put("generationConfig", generationConfig);

        try {
            String response = restClient.post()
                    .uri(String.format(API_URL, model, apiKey))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            String text = extractTextFromResponse(response);
            return parseJsonPayload(text);
        } catch (RestClientResponseException ex) {
            String detail = ex.getResponseBodyAsString();
            throw new IllegalStateException("Gemini API (" + ex.getStatusCode() + "): " + shorten(detail, 280), ex);
        } catch (Exception ex) {
            throw new IllegalStateException("Appel Gemini echoue: " + ex.getMessage(), ex);
        }
    }

    /** @deprecated use {@link #generateAssistantJson} */
    public String generateJson(String systemPrompt, List<ChatTurn> history, String userMessage) {
        return generateAssistantJson(systemPrompt, history, userMessage).toString();
    }

    static JsonNode parseJsonPayload(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalStateException("Reponse Gemini vide");
        }
        String trimmed = raw.trim();
        Matcher fence = JSON_FENCE.matcher(trimmed);
        if (fence.find()) {
            trimmed = fence.group(1).trim();
        }
        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start >= 0 && end > start) {
            trimmed = trimmed.substring(start, end + 1);
        }
        try {
            return new ObjectMapper().readTree(trimmed);
        } catch (Exception ex) {
            throw new IllegalStateException("JSON Gemini invalide: " + shorten(trimmed, 120), ex);
        }
    }

    private String extractTextFromResponse(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode error = root.path("error");
        if (!error.isMissingNode()) {
            throw new IllegalStateException(error.path("message").asText("Erreur Gemini"));
        }
        JsonNode candidates = root.path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            throw new IllegalStateException("Reponse Gemini sans candidat");
        }
        JsonNode first = candidates.get(0);
        String finish = first.path("finishReason").asText("");
        if ("SAFETY".equalsIgnoreCase(finish) || "BLOCKED".equalsIgnoreCase(finish)) {
            throw new IllegalStateException("Reponse bloquee par les filtres de securite Gemini");
        }
        JsonNode parts = first.path("content").path("parts");
        if (!parts.isArray() || parts.isEmpty()) {
            throw new IllegalStateException("Reponse Gemini sans contenu texte");
        }
        StringBuilder text = new StringBuilder();
        for (JsonNode part : parts) {
            if (part.has("text")) {
                text.append(part.path("text").asText());
            }
        }
        if (text.isEmpty()) {
            throw new IllegalStateException("Texte Gemini vide");
        }
        return text.toString();
    }

    private static Map<String, Object> assistantResponseSchema() {
        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("answer", Map.of(
                "type", "string",
                "description", "Reponse en francais pour l'utilisateur, claire et actionnable"));
        properties.put("intent", Map.of(
                "type", "string",
                "enum", List.of("TROUBLESHOOT", "KNOWLEDGE", "CREATE_TICKET", "UPDATE_DRAFT", "CONFIRM", "CLARIFY", "GENERAL")));
        properties.put("createTicket", Map.of("type", "boolean"));
        properties.put("updateDraft", Map.of("type", "boolean"));
        properties.put("needsClarification", Map.of("type", "boolean"));
        properties.put("ticketTitle", Map.of("type", "string"));
        properties.put("ticketDescription", Map.of("type", "string"));
        properties.put("ticketType", Map.of("type", "string", "enum", List.of("INCIDENT", "DEMANDE")));
        properties.put("ticketCategory", Map.of(
                "type", "string",
                "enum", List.of("MATERIEL", "LOGICIEL", "RESEAU", "ACCES", "AUTRE")));
        properties.put("ticketPriority", Map.of(
                "type", "string",
                "enum", List.of("FAIBLE", "MOYENNE", "ELEVEE", "CRITIQUE")));
        properties.put("referencedArticleTitles", Map.of(
                "type", "array",
                "items", Map.of("type", "string")));

        return Map.of(
                "type", "object",
                "properties", properties,
                "required", List.of("answer", "intent", "createTicket", "updateDraft", "needsClarification")
        );
    }

    private static String shorten(String value, int max) {
        if (value == null || value.length() <= max) {
            return value == null ? "" : value;
        }
        return value.substring(0, max) + "...";
    }

    public record ChatTurn(String role, String content) {
    }
}
