package org.example.backend.api;

import jakarta.validation.Valid;
import org.example.backend.api.dto.AuthDtos;
import org.example.backend.service.ChatbotService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

    @GetMapping("/status")
    public AuthDtos.AssistantStatus status() {
        return chatbotService.status();
    }

    @GetMapping
    public AuthDtos.ChatbotReply ask(@RequestParam String q) {
        return chatbotService.ask(q);
    }

    @PostMapping("/chat")
    public AuthDtos.ChatbotReply chat(@Valid @RequestBody AuthDtos.ChatRequest request) {
        return chatbotService.chat(request);
    }

    @PostMapping("/create-ticket")
    public AuthDtos.ChatbotReply createTicket(@Valid @RequestBody AuthDtos.ChatRequest request) {
        return chatbotService.createTicketForClient(request);
    }
}
