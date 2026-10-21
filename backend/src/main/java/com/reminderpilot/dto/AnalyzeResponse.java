package com.reminderpilot.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AnalyzeResponse(
    boolean success,
    String message,
    String task,
    boolean taskConfident,
    String dueDate,
    boolean dueDateConfident,
    Double amount,
    boolean amountConfident,
    String category,
    boolean categoryConfident,
    String extractionNote
) {
    public static AnalyzeResponse success(
        String task, boolean taskConfident,
        String dueDate, boolean dueDateConfident,
        Double amount, boolean amountConfident,
        String category, boolean categoryConfident,
        String extractionNote
    ) {
        return new AnalyzeResponse(
            true, null,
            task, taskConfident,
            dueDate, dueDateConfident,
            amount, amountConfident,
            category, categoryConfident,
            extractionNote
        );
    }

    public static AnalyzeResponse failure(String message) {
        return new AnalyzeResponse(
            false, message,
            null, false,
            null, false,
            null, false,
            null, false,
            message
        );
    }
}
