/*
 * ============================================================
 * File Name     : aiProviderConfig.js
 * Description   : Resolves OpenAI-compatible AI provider settings.
 * Module        : AI Provider Configuration
 * Author        : Your Name
 * Date          : 25/11/2026
 * ============================================================
 */

/*
 * ============================================================
 * Function Name : getAiProviderConfig
 * Description   : Supports explicit OpenAI-compatible settings and Groq keys.
 * Input         : Server environment variables.
 * Output        : Normalized provider URL, key, model, and configured status.
 * Author        : Your Name
 * Date          : 25/11/2026
 * ============================================================
 */
export const getAiProviderConfig = () => {
  const groqKey = process.env.GROQ_API_KEY?.trim();
  const apiKey = process.env.AI_API_KEY?.trim() || groqKey;
  const apiUrl = process.env.AI_API_URL?.trim() || (groqKey ? "https://api.groq.com/openai/v1" : "");
  const model = process.env.AI_MODEL?.trim() || (groqKey ? "openai/gpt-oss-120b" : "gpt-4o-mini");

  return {
    apiUrl: apiUrl.replace(/\/$/, ""),
    apiKey,
    model,
    configured: Boolean(apiUrl && apiKey),
  };
};
