package org.example.backend.api;

import org.example.backend.api.dto.AuthDtos;
import org.example.backend.service.ChatbotService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chatbot")
public class ChatbotController {

    private final ChatbotService chatbotService;

    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @GetMapping
    public AuthDtos.ChatbotReply ask(@RequestParam String q) {
        return chatbotService.ask(q);
    }
}
