/**
 * Safely parses JSON by stripping out any markdown code fences.
 */
function safeParseJSON(text) {
  try {
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();
    return JSON.parse(cleaned);
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error.message}. Raw text: ${text}`);
  }
}

module.exports = { safeParseJSON };
