package com.reminderpilot.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "gemini")
public record GeminiProperties(
    String apiKey,
    String baseUrl,
    String model
) {
    public GeminiProperties {
        if (apiKey == null) {
            apiKey = "";
        } else {
            apiKey = apiKey.trim();
        }
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = "https://generativelanguage.googleapis.com/v1beta";
        }
        if (model == null || model.isBlank()) {
            model = "gemini-3.8-flash";
        }
    }
}
