package com.reminderpilot;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.reminderpilot.config.GeminiProperties;
import com.reminderpilot.service.GeminiStartupCheck;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class GeminiStartupCheckTest {

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
    }

    @Test
    void testVerifyConnectionWithEmptyApiKeyReturnsFalseWithoutError() {
        GeminiProperties properties = new GeminiProperties("", "", "");
        RestClient restClient = mock(RestClient.class);

        GeminiStartupCheck startupCheck = new GeminiStartupCheck(properties, restClient, objectMapper);
        boolean result = startupCheck.verifyConnection();

        assertFalse(result);
        verifyNoInteractions(restClient);
    }

    @Test
    void testVerifyConnectionWithInvalidKeyHandlesErrorGracefully() {
        GeminiProperties properties = new GeminiProperties("invalid_test_key", "https://mock.gemini", "gemini-3.8-flash");
        RestClient restClient = mock(RestClient.class);
        RestClient.RequestHeadersUriSpec uriSpec = mock(RestClient.RequestHeadersUriSpec.class);
        RestClient.ResponseSpec responseSpec = mock(RestClient.ResponseSpec.class);

        when(restClient.get()).thenReturn(uriSpec);
        when(uriSpec.uri(anyString())).thenReturn(uriSpec);
        when(uriSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(String.class)).thenThrow(new HttpClientErrorException(HttpStatus.BAD_REQUEST, "API_KEY_INVALID"));

        GeminiStartupCheck startupCheck = new GeminiStartupCheck(properties, restClient, objectMapper);

        assertDoesNotThrow(() -> {
            boolean result = startupCheck.verifyConnection();
            assertFalse(result);
        });
    }

    @Test
    void testVerifyConnectionWithHostUnreachableHandlesErrorGracefully() {
        GeminiProperties properties = new GeminiProperties("test_key", "https://unreachable.gemini", "gemini-3.8-flash");
        RestClient restClient = mock(RestClient.class);
        RestClient.RequestHeadersUriSpec uriSpec = mock(RestClient.RequestHeadersUriSpec.class);
        RestClient.ResponseSpec responseSpec = mock(RestClient.ResponseSpec.class);

        when(restClient.get()).thenReturn(uriSpec);
        when(uriSpec.uri(anyString())).thenReturn(uriSpec);
        when(uriSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(String.class)).thenThrow(new ResourceAccessException("Connect timed out"));

        GeminiStartupCheck startupCheck = new GeminiStartupCheck(properties, restClient, objectMapper);

        assertDoesNotThrow(() -> {
            boolean result = startupCheck.verifyConnection();
            assertFalse(result);
        });
    }

    @Test
    void testVerifyConnectionSuccessWithModelMatch() {
        GeminiProperties properties = new GeminiProperties("valid_key", "https://mock.gemini", "gemini-3.8-flash");
        RestClient restClient = mock(RestClient.class);
        RestClient.RequestHeadersUriSpec uriSpec = mock(RestClient.RequestHeadersUriSpec.class);
        RestClient.ResponseSpec responseSpec = mock(RestClient.ResponseSpec.class);

        String sampleResponse = """
            {
              "models": [
                { "name": "models/gemini-3.8-flash" },
                { "name": "models/gemini-2.5-pro" }
              ]
            }
            """;

        when(restClient.get()).thenReturn(uriSpec);
        when(uriSpec.uri(anyString())).thenReturn(uriSpec);
        when(uriSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(String.class)).thenReturn(sampleResponse);

        GeminiStartupCheck startupCheck = new GeminiStartupCheck(properties, restClient, objectMapper);
        boolean result = startupCheck.verifyConnection();

        assertTrue(result);
    }
}
