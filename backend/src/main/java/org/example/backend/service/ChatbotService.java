package org.example.backend.service;

import org.example.backend.api.dto.AuthDtos;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ChatbotService {

    private final KnowledgeService knowledgeService;

    public ChatbotService(KnowledgeService knowledgeService) {
        this.knowledgeService = knowledgeService;
    }

    @Transactional(readOnly = true)
    public AuthDtos.ChatbotReply ask(String question) {
        List<AuthDtos.KnowledgeView> suggestions = knowledgeService.search(question).stream()
                .limit(3)
                .toList();

        if (!suggestions.isEmpty()) {
            return new AuthDtos.ChatbotReply(
                    "J'ai trouve des articles qui peuvent vous aider avant de creer un ticket.",
                    suggestions);
        }

        return new AuthDtos.ChatbotReply(
                "Je n'ai pas trouve de solution immediate. Je vous conseille de creer un ticket avec un maximum de details.",
                List.of());
    }
}
