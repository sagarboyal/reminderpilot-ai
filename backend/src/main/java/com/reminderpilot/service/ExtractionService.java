package com.reminderpilot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.reminderpilot.config.GeminiProperties;
import com.reminderpilot.dto.AnalyzeResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ExtractionService {

    private static final Logger log = LoggerFactory.getLogger(ExtractionService.class);
    private static final Set<String> ALLOWED_CATEGORIES = Set.of("Bill", "Appointment", "Subscription", "Other");

    private final GeminiProperties geminiProperties;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public ExtractionService(
            GeminiProperties geminiProperties,
            RestClient restClient,
            ObjectMapper objectMapper
    ) {
        this.geminiProperties = geminiProperties;
        this.restClient = restClient;
        this.objectMapper = objectMapper;
    }

    public AnalyzeResponse extract(String userMessage) {
        String apiKey = geminiProperties.apiKey();
        if (apiKey.isEmpty()) {
            log.info("GEMINI_API_KEY is not set. Using local extraction fallback.");
            return extractLocally(
                    userMessage,
                    "Offline fallback used: GEMINI_API_KEY environment variable is not set. Configure your Gemini API key for live AI extraction."
            );
        }

        try {
            return callGemini(userMessage);
        } catch (Exception e) {
            log.error("Gemini API call failed: {}. Falling back to local extractor.", e.getMessage());
            return extractLocally(
                    userMessage,
                    "Notice: Gemini API call failed (" + e.getMessage() + "). Local extractor provided fallback details."
            );
        }
    }

    private AnalyzeResponse callGemini(String userMessage) throws Exception {
        String url = "%s/models/%s:generateContent?key=%s".formatted(
                geminiProperties.baseUrl(),
                geminiProperties.model(),
                geminiProperties.apiKey()
        );

        String prompt = """
            You are an expert deadline and reminder extractor.
            Analyze the following user message and extract reminder details.
            
            Return ONLY a valid JSON object matching this exact schema:
            {
              "task": string or null (clear, concise task name, e.g. 'Pay electricity bill', null if no task found),
              "taskConfident": boolean (true if confident in the task, false otherwise),
              "dueDate": string or null (MUST be in ISO 8601 format 'YYYY-MM-DD', null if date is missing or ambiguous/relative like 'next Monday'),
              "dueDateConfident": boolean (true only if an exact date is clearly stated and formatted as YYYY-MM-DD, false otherwise),
              "amount": number or null (e.g. 1250, null if no monetary amount found),
              "amountConfident": boolean (true if amount is clear, false otherwise),
              "category": string (MUST be one of: 'Bill', 'Appointment', 'Subscription', 'Other'),
              "categoryConfident": boolean (true if category is clear, false otherwise),
              "extractionNote": string or null (brief human-readable note if any field is uncertain or missing)
            }
            
            Rules:
            1. Never invent or hallucinate data. If uncertain, set field to null and confidence to false.
            2. For relative dates like 'next Monday' or 'tomorrow', set dueDate to null and dueDateConfident to false.
            3. Category must be strictly one of: 'Bill', 'Appointment', 'Subscription', 'Other'. Default to 'Other' if unsure.
            
            Message to analyze:
            \"\"\"
            %s
            \"\"\"
            """.formatted(userMessage);

        Map<String, Object> part = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> generationConfig = Map.of("responseMimeType", "application/json");

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(content),
                "generationConfig", generationConfig
        );

        String rawResponse = restClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(String.class);

        JsonNode rootNode = objectMapper.readTree(rawResponse);
        JsonNode candidates = rootNode.path("candidates");
        if (candidates.isMissingNode() || !candidates.isArray() || candidates.isEmpty()) {
            throw new IllegalStateException("No candidates returned from Gemini");
        }

        String jsonText = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
        JsonNode parsed = objectMapper.readTree(jsonText);

        String task = parsed.path("task").isNull() ? null : parsed.path("task").asText();
        boolean taskConfident = parsed.path("taskConfident").asBoolean(task != null && !task.isBlank());

        String rawDueDate = parsed.path("dueDate").isNull() ? null : parsed.path("dueDate").asText();
        boolean dueDateConfident = parsed.path("dueDateConfident").asBoolean(false);
        String validatedDueDate = null;

        if (rawDueDate != null && !rawDueDate.isBlank()) {
            try {
                LocalDate parsedDate = LocalDate.parse(rawDueDate);
                validatedDueDate = parsedDate.toString();
            } catch (DateTimeParseException e) {
                log.warn("Extracted dueDate '{}' failed ISO-8601 parsing. Treating as null.", rawDueDate);
                dueDateConfident = false;
            }
        }

        Double amount = parsed.path("amount").isNull() ? null : parsed.path("amount").asDouble();
        boolean amountConfident = parsed.path("amountConfident").asBoolean(amount != null);

        String category = parsed.path("category").isNull() ? "Other" : parsed.path("category").asText();
        if (!ALLOWED_CATEGORIES.contains(category)) {
            category = "Other";
        }
        boolean categoryConfident = parsed.path("categoryConfident").asBoolean(true);

        String extractionNote = parsed.path("extractionNote").isNull() ? null : parsed.path("extractionNote").asText();

        return AnalyzeResponse.success(
                task, taskConfident,
                validatedDueDate, dueDateConfident,
                amount, amountConfident,
                category, categoryConfident,
                extractionNote
        );
    }

    /**
     * Rule-based fallback extractor when Gemini is not configured or fails.
     * Ensures learner has a working prototype without being blocked.
     */
    public AnalyzeResponse extractLocally(String text, String note) {
        String lower = text.toLowerCase();

        // 1. Category heuristic
        String category = "Other";
        boolean categoryConfident = false;
        if (lower.contains("bill") || lower.contains("electricity") || lower.contains("water") || lower.contains("due")) {
            category = "Bill";
            categoryConfident = true;
        } else if (lower.contains("doctor") || lower.contains("dentist") || lower.contains("appointment") || lower.contains("meeting")) {
            category = "Appointment";
            categoryConfident = true;
        } else if (lower.contains("subscription") || lower.contains("netflix") || lower.contains("spotify") || lower.contains("prime")) {
            category = "Subscription";
            categoryConfident = true;
        }

        // 2. Amount heuristic (matches currency symbols e.g. ₹ / \u20B9, $, €, £, Rs, INR)
        Double amount = null;
        boolean amountConfident = false;
        Pattern amountPattern = Pattern.compile(
                "(?:\\u20B9|₹|\\$|€|£|rs\\.?|inr)\\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\\.[0-9]{2})?|[0-9]+(?:\\.[0-9]{2})?)",
                Pattern.CASE_INSENSITIVE
        );
        Matcher amountMatcher = amountPattern.matcher(text);
        if (amountMatcher.find()) {
            try {
                String cleanNumber = amountMatcher.group(1).replace(",", "");
                amount = Double.parseDouble(cleanNumber);
                amountConfident = true;
            } catch (Exception ignored) {}
        }

        // 3. Due date heuristic (e.g., 25 October 2026, 2026-10-25, 25/10/2026)
        String dueDate = null;
        boolean dueDateConfident = false;

        // Try standard ISO-8601 (YYYY-MM-DD)
        Pattern isoPattern = Pattern.compile("\\b(\\d{4}-\\d{2}-\\d{2})\\b");
        Matcher isoMatcher = isoPattern.matcher(text);
        if (isoMatcher.find()) {
            try {
                LocalDate date = LocalDate.parse(isoMatcher.group(1));
                dueDate = date.toString();
                dueDateConfident = true;
            } catch (DateTimeParseException ignored) {}
        }

        // Try '25 October 2026' or '25 Oct 2026'
        if (dueDate == null) {
            Pattern verbalPattern = Pattern.compile(
                    "\\b(\\d{1,2})\\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\s+(\\d{4})\\b",
                    Pattern.CASE_INSENSITIVE
            );
            Matcher verbalMatcher = verbalPattern.matcher(text);
            if (verbalMatcher.find()) {
                String dayStr = verbalMatcher.group(1);
                String monthStr = verbalMatcher.group(2).substring(0, 3);
                String yearStr = verbalMatcher.group(3);
                try {
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH);
                    String dateCandidate = dayStr + " " + monthStr + " " + yearStr;
                    LocalDate parsedDate = LocalDate.parse(dateCandidate, formatter);
                    dueDate = parsedDate.toString();
                    dueDateConfident = true;
                } catch (DateTimeParseException ignored) {}
            }
        }

        // 4. Task heuristic
        String task = null;
        boolean taskConfident = false;
        if (lower.contains("electricity bill")) {
            task = "Pay electricity bill";
            taskConfident = true;
        } else if (lower.contains("water bill")) {
            task = "Pay water bill";
            taskConfident = true;
        } else if (lower.contains("dentist") || lower.contains("doctor")) {
            task = "Doctor appointment";
            taskConfident = true;
        } else {
            int dotIndex = text.indexOf('.');
            task = (dotIndex > 0 && dotIndex < 60)
                    ? text.substring(0, dotIndex).trim()
                    : (text.length() > 50 ? text.substring(0, 50).trim() + "..." : text.trim());
            taskConfident = !task.isBlank();
        }

        return AnalyzeResponse.success(
                task, taskConfident,
                dueDate, dueDateConfident,
                amount, amountConfident,
                category, categoryConfident,
                note
        );
    }
}
