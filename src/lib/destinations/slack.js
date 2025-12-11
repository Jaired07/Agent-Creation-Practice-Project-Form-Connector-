/**
 * Helper function to delay execution (for retry backoff)
 * 
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>} Resolves after the delay
 * @private
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Handles Slack destination processing for form submissions
 * 
 * This function processes a form submission and sends it to a Slack channel
 * via an incoming webhook. It formats the message using Slack's Block Kit
 * for rich, structured messages with proper formatting.
 * 
 * **Setup Instructions:**
 * 
 * 1. **Create Slack Incoming Webhook:**
 *    - Go to https://api.slack.com/apps
 *    - Click "Create New App" → "From scratch"
 *    - Name your app and select your workspace
 *    - Go to "Incoming Webhooks" in the left sidebar
 *    - Toggle "Activate Incoming Webhooks" to ON
 *    - Click "Add New Webhook to Workspace"
 *    - Select the channel where you want notifications
 *    - Click "Allow"
 *    - Copy the webhook URL from Slack
 * 
 * 2. **Add Webhook URL to Connector:**
 *    - When creating/editing a connector, select Slack destination
 *    - Paste the webhook URL in the configuration
 * 
 * **Destination Configuration Structure:**
 * ```javascript
 * {
 *   type: 'slack',
 *   enabled: true,
 *   config: {
 *     webhookUrl: 'your-slack-webhook-url-here'
 *   }
 * }
 * ```
 * 
 * **Message Format:**
 * 
 * The message is formatted using Slack Block Kit with:
 * - Header block with form name and emoji
 * - Divider for visual separation
 * - Section blocks with form fields in key-value format
 * - Timestamp footer
 * - Connector name in footer
 * 
 * **Error Handling:**
 * 
 * - Invalid webhook URL: Returns clear error message
 * - Rate limiting: Handles Slack rate limits with retry
 * - Network errors: Retries with exponential backoff (3 attempts)
 * - Invalid webhook: Returns error if webhook is revoked or invalid
 * 
 * @param {Object} destination - Destination configuration object
 * @param {string} destination.type - Must be 'slack'
 * @param {boolean} destination.enabled - Whether this destination is enabled
 * @param {Object} destination.config - Slack configuration
 * @param {string} destination.config.webhookUrl - Slack incoming webhook URL
 * @param {Object} formData - Form submission data (key-value pairs)
 * @param {Object} connector - Connector metadata
 * @param {string} connector.name - Connector name
 * @param {number} [maxRetries=3] - Maximum number of retry attempts
 * @returns {Promise<void>} Resolves when message is successfully sent to Slack
 * @throws {Error} If webhook URL is missing, invalid, or API errors occur
 * 
 * @example
 * const destination = {
 *   type: 'slack',
 *   enabled: true,
 *   config: {
 *     webhookUrl: 'your-slack-webhook-url-here'
 *   }
 * };
 * 
 * const formData = {
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   message: 'Hello, this is a test message'
 * };
 * 
 * const connector = {
 *   name: 'Contact Form'
 * };
 * 
 * await handleSlack(destination, formData, connector);
 */
export async function handleSlack(destination, formData, connector, maxRetries = 3) {
  console.log('💬 Slack handler called with destination:', JSON.stringify(destination, null, 2));
  
  const config = destination.config || {};
  const webhookUrl = config.webhookUrl || config.webhook_url;

  if (!webhookUrl) {
    throw new Error('Slack webhook URL is required in destination config');
  }

  // Validate webhook URL format
  if (!webhookUrl.startsWith('https://') || !webhookUrl.includes('slack.com')) {
    throw new Error('Invalid Slack webhook URL format. Please provide a valid Slack webhook URL.');
  }

  console.log(`💬 Processing Slack notification for connector: ${connector.name}`);

  let lastError = null;
  let attempts = 0;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    attempts = attempt;
    
    try {
      console.log(`💬 Slack send attempt ${attempt}/${maxRetries}`);

      // Build Slack message blocks
      const blocks = [];

      // Header block
      blocks.push({
        type: 'header',
        text: {
          type: 'plain_text',
          text: `📋 New Form Submission: ${connector.name}`,
          emoji: true
        }
      });

      // Divider
      blocks.push({
        type: 'divider'
      });

      // Form fields - split into pairs for better layout
      const fieldEntries = Object.entries(formData);
      const fieldPairs = [];

      for (let i = 0; i < fieldEntries.length; i += 2) {
        const pair = [];
        
        // First field
        const [key1, value1] = fieldEntries[i];
        pair.push({
          type: 'mrkdwn',
          text: `*${key1.charAt(0).toUpperCase() + key1.slice(1)}:*\n${String(value1 || '(empty)')}`
        });

        // Second field (if exists)
        if (i + 1 < fieldEntries.length) {
          const [key2, value2] = fieldEntries[i + 1];
          pair.push({
            type: 'mrkdwn',
            text: `*${key2.charAt(0).toUpperCase() + key2.slice(1)}:*\n${String(value2 || '(empty)')}`
          });
        } else {
          // Add empty field to maintain layout
          pair.push({
            type: 'mrkdwn',
            text: ' '
          });
        }

        fieldPairs.push(pair);
      }

      // Add field sections
      fieldPairs.forEach(pair => {
        blocks.push({
          type: 'section',
          fields: pair
        });
      });

      // Footer with timestamp and connector name
      blocks.push({
        type: 'divider'
      });

      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `📊 *Connector:* ${connector.name} | 🕐 *Time:* <!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|${new Date().toISOString()}>`
          }
        ]
      });

      // Send to Slack
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blocks,
          text: `New form submission from ${connector.name}`, // Fallback text for notifications
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        if (response.status === 404) {
          throw new Error('Slack webhook not found. Please check that the webhook URL is correct and the webhook is still active.');
        } else if (response.status === 403) {
          throw new Error('Slack webhook access denied. The webhook may have been revoked or the app removed.');
        } else if (response.status === 429) {
          // Rate limited - will retry
          const retryAfter = response.headers.get('Retry-After') || '60';
          throw new Error(`Slack rate limit exceeded. Retry after ${retryAfter} seconds.`);
        }
        
        throw new Error(`Slack API error: ${response.status} ${response.statusText}. ${errorText}`);
      }

      console.log(`✅ Slack message sent successfully on attempt ${attempt}`);
      return;

    } catch (error) {
      lastError = error;
      console.error(`❌ Slack attempt ${attempt} failed:`, error.message);

      // Don't retry on certain errors
      if (error.message.includes('not found') || 
          error.message.includes('access denied') ||
          error.message.includes('Invalid Slack webhook')) {
        throw error; // Fail immediately for configuration errors
      }

      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        // For rate limits, use longer delay
        const delayMs = error.message.includes('rate limit')
          ? 60000 // 60 seconds for rate limits
          : Math.pow(2, attempt - 1) * 1000; // Exponential backoff for other errors
        
        console.log(`⏳ Waiting ${delayMs}ms before retry...`);
        await delay(delayMs);
      }
    }
  }

  // All attempts failed
  throw new Error(
    `Failed to send Slack message after ${attempts} attempt(s). Last error: ${lastError?.message || 'Unknown error'}`
  );
}

