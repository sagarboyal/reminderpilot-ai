package com.reminderpilot.controller;

import com.reminderpilot.dto.AnalyzeRequest;
import com.reminderpilot.dto.AnalyzeResponse;
import com.reminderpilot.service.ExtractionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AnalyzeController {

    private final ExtractionService extractionService;

    public AnalyzeController(ExtractionService extractionService) {
        this.extractionService = extractionService;
    }

    @PostMapping("/analyze")
    public ResponseEntity<AnalyzeResponse> analyze(@RequestBody(required = false) AnalyzeRequest request) {
        if (request == null || request.message() == null || request.message().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(
                    AnalyzeResponse.failure("Message cannot be empty.")
            );
        }
        AnalyzeResponse response = extractionService.extract(request.message().trim());
        return ResponseEntity.ok(response);
    }
}
