/**
 * API client for communicating with the Spring Boot backend reminder analyzer.
 */

const ANALYZE_ENDPOINT = '/api/analyze'

export async function analyzeMessage(message) {
  if (!message || !message.trim()) {
    throw new Error('Message cannot be empty.')
  }

  let response
  try {
    response = await fetch(ANALYZE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: message.trim() })
    })
  } catch (networkError) {
    throw new Error(
      'Unable to connect to the ReminderPilot backend server. Please make sure the Spring Boot service is running on port 8080.'
    )
  }

  let data
  try {
    data = await response.json()
  } catch (parseError) {
    throw new Error('Received an unparseable response from the server.')
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to extract reminder details from message.')
  }

  return data
}
