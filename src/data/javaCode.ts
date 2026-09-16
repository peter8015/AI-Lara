export interface JavaSnippet {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  filename: string;
  code: string;
}

export const JAVA_SNIPPETS: JavaSnippet[] = [
  {
    id: 'controller',
    title: '1. Chat Controller & Streaming SSE',
    subtitle: 'Exposes non-blocking REST and SSE Streaming endpoints',
    badge: 'Spring WebFlux / MVC',
    filename: 'AiChatController.java',
    code: `package com.example.aichat.controller;

import com.example.aichat.dto.ChatRequest;
import com.example.aichat.dto.StructuredChatResponse;
import com.example.aichat.service.AiChatService;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class AiChatController {

    private final AiChatService aiChatService;

    public AiChatController(AiChatService aiChatService) {
        this.aiChatService = aiChatService;
    }

    /**
     * Feature: Streaming
     * Server-Sent Events (SSE) streaming token by token back to the client
     */
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> streamChat(@RequestBody ChatRequest request) {
        return aiChatService.streamResponse(request.message())
            .map(token -> ServerSentEvent.<String>builder()
                .event("token")
                .data(token)
                .build());
    }

    /**
     * Feature: Structured Output
     * Directly returns strongly-typed Java Record mapped from LLM JSON Schema
     */
    @PostMapping("/structured")
    public StructuredChatResponse structuredChat(@RequestBody ChatRequest request) {
        return aiChatService.generateStructuredResponse(request.message());
    }
}`
  },
  {
    id: 'service',
    title: '2. Resilience4j Retry & Timeout Service',
    subtitle: 'Enforces Circuit Breakers, Retry policies, and Timeout deadlines',
    badge: 'Resilience4j + Spring AI',
    filename: 'AiChatService.java',
    code: `package com.example.aichat.service;

import com.example.aichat.dto.StructuredChatResponse;
import io.github.resilience4j.retry.annotation.Retry;
import io.github.resilience4j.timelimiter.annotation.TimeLimiter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.metadata.Usage;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import java.time.Duration;

@Service
public class AiChatService {

    private static final Logger log = LoggerFactory.getLogger(AiChatService.class);
    private final ChatClient chatClient;

    public AiChatService(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder
            .defaultSystem("You are a Senior Java Cloud Architect assisting enterprise engineers.")
            .build();
    }

    /**
     * Features: Retry + Timeout + Streaming
     */
    @Retry(name = "llmApi", fallbackMethod = "streamFallback")
    @TimeLimiter(name = "llmApi")
    public Flux<String> streamResponse(String userPrompt) {
        log.info("Dispatching streaming request to LLM API...");
        return chatClient.prompt()
            .user(userPrompt)
            .stream()
            .content()
            .timeout(Duration.ofSeconds(10)); // Feature: Timeout
    }

    /**
     * Features: Structured Output + Token Usage Metrics
     */
    @Retry(name = "llmApi", fallbackMethod = "structuredFallback")
    public StructuredChatResponse generateStructuredResponse(String userPrompt) {
        log.info("Requesting structured schema from LLM...");
        
        ChatResponse response = chatClient.prompt()
            .user(userPrompt)
            .call()
            .chatResponse();

        // Feature: Token Usage telemetry extraction
        Usage usage = response.getMetadata().getUsage();
        log.info("Token Telemetry - Prompt: {}, Generation: {}, Total: {}", 
            usage.getPromptTokens(), usage.getGenerationTokens(), usage.getTotalTokens());

        // Deserialized automatically to Java Record via Jackson/Spring AI converter
        return response.getResult().getOutput().as(StructuredChatResponse.class);
    }

    // Feature: Error Handling - Fallback methods
    public Flux<String> streamFallback(String userPrompt, Throwable ex) {
        log.error("LLM API failed after retries: {}", ex.getMessage());
        return Flux.just("Service temporarily degraded. Upstream LLM fallback engaged.");
    }
}`
  },
  {
    id: 'resilience_yml',
    title: '3. Resilience4j & Timeout Configuration',
    subtitle: 'Exponential backoff retry settings and thread timeout limits',
    badge: 'application.yml',
    filename: 'application.yml',
    code: `spring:
  application:
    name: java-ai-chat
  ai:
    gemini:
      api-key: \${GEMINI_API_KEY}
      chat:
        options:
          model: gemini-3.8-flash
          temperature: 0.7

# Feature: Retry & Timeout (Resilience4j)
resilience4j:
  retry:
    instances:
      llmApi:
        max-attempts: 3 # Maximum retry attempts
        wait-duration: 500ms # Initial wait
        enable-exponential-backoff: true # Exponential backoff
        exponential-backoff-multiplier: 2 # 500ms -> 1000ms -> 2000ms
        retry-exceptions:
          - org.springframework.web.reactive.function.client.WebClientResponseException
          - java.io.IOException
          - java.util.concurrent.TimeoutException
        ignore-exceptions:
          - java.lang.IllegalArgumentException

  timelimiter:
    instances:
      llmApi:
        timeout-duration: 10s # Feature: Timeout limit
        cancel-running-future: true`
  },
  {
    id: 'record',
    title: '4. Structured Output Java Record DTO',
    subtitle: 'Strongly typed Java 21 Record schema for automated JSON mapping',
    badge: 'Java 21 Record',
    filename: 'StructuredChatResponse.java',
    code: `package com.example.aichat.dto;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import java.util.List;

/**
 * Feature: Structured Output
 * Spring AI & Jackson use this schema to guide model JSON output
 */
public record StructuredChatResponse(
    @JsonPropertyDescription("Primary conversational answer to the developer inquiry")
    String reply,

    @JsonPropertyDescription("Sentiment of the exchange: POSITIVE, NEUTRAL, or CONSTRUCTIVE")
    String sentiment,

    @JsonPropertyDescription("Classified user intent e.g. CODE_GENERATION, ARCHITECTURE_QA")
    String intent,

    @JsonPropertyDescription("List of key technical highlights or action items")
    List<String> keyPoints,

    @JsonPropertyDescription("Confidence score ranging from 0.0 to 1.0")
    double confidence,

    @JsonPropertyDescription("Recommended follow-up prompts for deeper exploration")
    List<String> suggestedFollowUps
) {}`
  },
  {
    id: 'errorhandler',
    title: '5. Global Exception Handler (RFC 7807)',
    subtitle: 'Spring Boot 3 ProblemDetail standard error response handler',
    badge: '@RestControllerAdvice',
    filename: 'GlobalExceptionHandler.java',
    code: `package com.example.aichat.exception;

import io.github.resilience4j.retry.MaxRetriesExceededException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.net.URI;
import java.time.Instant;
import java.util.concurrent.TimeoutException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Feature: Error Handling - Timeout
    @ExceptionHandler(TimeoutException.class)
    public ProblemDetail handleTimeoutException(TimeoutException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.GATEWAY_TIMEOUT, 
            "The upstream LLM API did not respond within the configured deadline."
        );
        problem.setTitle("LLM Request Timeout");
        problem.setType(URI.create("https://errors.example.com/timeout"));
        problem.setProperty("timestamp", Instant.now());
        problem.setProperty("suggestion", "Please retry with a shorter prompt or extend timeout-duration.");
        return problem;
    }

    // Feature: Error Handling - Retry Exhausted
    @ExceptionHandler(MaxRetriesExceededException.class)
    public ProblemDetail handleMaxRetries(MaxRetriesExceededException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.SERVICE_UNAVAILABLE, 
            "Upstream LLM provider exhausted all configured retry attempts."
        );
        problem.setTitle("Retry Exhausted");
        problem.setProperty("retryAttempts", 3);
        problem.setProperty("backoffPolicy", "EXPONENTIAL (500ms base)");
        return problem;
    }
}`
  }
];
