package com.reminderpilot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.reminderpilot.config.GeminiProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.List;

@Component
public class GeminiStartupCheck implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(GeminiStartupCheck.class);

    private final GeminiProperties geminiProperties;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public GeminiStartupCheck(
            GeminiProperties geminiProperties,
            RestClient restClient,
            ObjectMapper objectMapper
    ) {
        this.geminiProperties = geminiProperties;
        this.restClient = restClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(ApplicationArguments args) {
        verifyConnection();
    }

    /**
     * Executes a lightweight check against the Gemini /models endpoint.
     * Verifies API key validity and host reachability without generating tokens.
     */
    public boolean verifyConnection() {
        String apiKey = geminiProperties.apiKey();
        if (apiKey.isEmpty()) {
            log.warn("Gemini API key is not configured (GEMINI_API_KEY is empty). Offline fallback will be used.");
            return false;
        }

        // Canonical models list endpoint - validates API key and host connectivity with 0 generation tokens
        String endpoint = "%s/models?key=%s&pageSize=50".formatted(
                geminiProperties.baseUrl(),
                apiKey
        );

        try {
            String rawJson = restClient.get()
                    .uri(endpoint)
                    .retrieve()
                    .body(String.class);

            List<String> availableModels = new ArrayList<>();
            if (rawJson != null && !rawJson.isBlank()) {
                JsonNode root = objectMapper.readTree(rawJson);
                JsonNode modelsNode = root.path("models");
                if (modelsNode.isArray()) {
                    for (JsonNode m : modelsNode) {
                        String name = m.path("name").asText("");
                        if (!name.isBlank()) {
                            availableModels.add(name);
                        }
                    }
                }
            }

            String targetModel = geminiProperties.model();
            boolean modelMatched = availableModels.stream()
                    .anyMatch(m -> m.equalsIgnoreCase(targetModel) || m.equalsIgnoreCase("models/" + targetModel));

            if (modelMatched || availableModels.isEmpty()) {
                log.info("Gemini API connection verified successfully (model: {}).", targetModel);
            } else {
                List<String> shortNames = availableModels.stream()
                        .map(m -> m.replace("models/", ""))
                        .toList();
                log.warn("Gemini API connection verified, but configured model '{}' was not found in available models. Available models: {}",
                        targetModel,
                        shortNames);
            }
            return true;
        } catch (RestClientResponseException ex) {
            int statusCode = ex.getStatusCode().value();
            if (statusCode == 400 || statusCode == 403) {
                log.error("Gemini API connection failed: invalid API key (HTTP {}).", statusCode);
            } else if (statusCode == 404) {
                log.error("Gemini API endpoint not found at {} (HTTP 404).", geminiProperties.baseUrl());
            } else {
                log.error("Gemini API connection failed: HTTP {}.", statusCode);
            }
            return false;
        } catch (ResourceAccessException ex) {
            log.error("Gemini API connection failed: unable to reach host.");
            return false;
        } catch (Exception ex) {
            log.error("Gemini API connection failed: {}.", ex.getMessage());
            return false;
        }
    }
}
