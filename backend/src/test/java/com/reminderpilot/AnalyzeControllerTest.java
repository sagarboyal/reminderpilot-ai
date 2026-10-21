package com.reminderpilot;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.reminderpilot.config.GeminiProperties;
import com.reminderpilot.controller.AnalyzeController;
import com.reminderpilot.dto.AnalyzeRequest;
import com.reminderpilot.dto.AnalyzeResponse;
import com.reminderpilot.service.ExtractionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClient;

import static org.junit.jupiter.api.Assertions.*;

class AnalyzeControllerTest {

    private AnalyzeController controller;

    @BeforeEach
    void setUp() {
        GeminiProperties properties = new GeminiProperties("", "", "");
        RestClient restClient = RestClient.builder().build();
        ObjectMapper objectMapper = new ObjectMapper();
        ExtractionService extractionService = new ExtractionService(properties, restClient, objectMapper);
        controller = new AnalyzeController(extractionService);
    }

    @Test
    void testAnalyzeWithValidElectricityBillMessage() {
        String message = "Your electricity bill of ₹1,250 is due on 25 October 2026. Please make the payment before the due date.";
        AnalyzeRequest request = new AnalyzeRequest(message);

        ResponseEntity<AnalyzeResponse> response = controller.analyze(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().success());
        assertEquals("Pay electricity bill", response.getBody().task());
        assertEquals("2026-10-25", response.getBody().dueDate());
        assertEquals(1250.0, response.getBody().amount());
        assertEquals("Bill", response.getBody().category());
    }

    @Test
    void testAnalyzeWithEmptyMessageReturnsBadRequest() {
        AnalyzeRequest request = new AnalyzeRequest("   ");

        ResponseEntity<AnalyzeResponse> response = controller.analyze(request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().success());
    }

    @Test
    void testAnalyzeWithDoctorAppointment() {
        String message = "Reminder: Dentist appointment scheduled for 2026-11-15.";
        AnalyzeRequest request = new AnalyzeRequest(message);

        ResponseEntity<AnalyzeResponse> response = controller.analyze(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().success());
        assertEquals("Doctor appointment", response.getBody().task());
        assertEquals("2026-11-15", response.getBody().dueDate());
        assertEquals("Appointment", response.getBody().category());
    }

    @Test
    void testFallbackNoteIsCleanWithoutRawJsonOrEol() {
        String message = "Your electricity bill of ₹1,250 is due on 25 October 2026.";
        AnalyzeRequest request = new AnalyzeRequest(message);

        ResponseEntity<AnalyzeResponse> response = controller.analyze(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().success());
        assertEquals("AI unavailable. Using local extraction—please review the details.", response.getBody().extractionNote());
        assertFalse(response.getBody().extractionNote().contains("<EOL>"));
        assertFalse(response.getBody().extractionNote().contains("503"));
    }
}
