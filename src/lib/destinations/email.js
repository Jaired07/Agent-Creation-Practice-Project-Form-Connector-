import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Helper function to escape HTML to prevent XSS attacks
 * 
 * Escapes special HTML characters to prevent injection attacks when
 * rendering user-provided content in HTML emails.
 * 
 * @param {string|null|undefined} text - Text to escape
 * @returns {string} Escaped HTML string
 * @private
 */
function escapeHtml(text) {
  if (text == null) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Sends an email via SendGrid (single attempt, no retry)
 * 
 * This function processes a form submission and sends it via SendGrid email.
 * It creates a beautifully formatted HTML email with all form fields displayed
 * in a structured layout. The email includes both HTML and plain text versions
 * for maximum compatibility.
 * 
 * **SendGrid Configuration Requirements:**
 * - SENDGRID_API_KEY environment variable must be set
 * - SendGrid account must be verified
 * - From email address must be verified in SendGrid (unless using domain authentication)
 * 
 * **Destination Configuration Structure:**
 * ```javascript
 * {
 *   type: 'email',
 *   enabled: true,
 *   config: {
 *     to_email: 'recipient@example.com',      // or toEmail
 *     from_email: 'sender@example.com',        // or fromEmail
 *     from_name: 'Form Connector',             // or fromName (optional)
 *     subject: 'New Form Submission'           // (optional)
 *   }
 * }
 * ```
 * 
 * **Form Data Structure:**
 * The formData object should contain key-value pairs where:
 * - Keys are field names (will be capitalized for display)
 * - Values are strings, numbers, or booleans
 * 
 * **Connector Structure:**
 * The connector object should contain:
 * - name: string - Name of the connector (used in email)
 * 
 * @param {Object} destination - Destination configuration object
 * @param {string} destination.type - Must be 'email'
 * @param {boolean} destination.enabled - Whether this destination is enabled
 * @param {Object} destination.config - Email configuration
 * @param {string} destination.config.to_email - Recipient email address (or toEmail)
 * @param {string} destination.config.from_email - Sender email address (or fromEmail)
 * @param {string} [destination.config.from_name] - Sender display name (or fromName)
 * @param {string} [destination.config.subject] - Email subject line
 * @param {Object} formData - Form submission data (key-value pairs)
 * @param {Object} connector - Connector metadata
 * @param {string} connector.name - Connector name
 * @returns {Promise<void>} Resolves when email is sent successfully
 * @throws {Error} If SendGrid API key is not configured
 * @throws {Error} If SendGrid send fails (network error, invalid config, etc.)
 * @private
 */
async function sendEmailOnce(destination, formData, connector) {
  console.log('📧 sendEmail called with destination:', JSON.stringify(destination, null, 2));
  
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error('SendGrid API key not configured');
  }

  const config = destination.config || {};
  console.log('📧 Email config:', JSON.stringify(config, null, 2));
  
  // Escape connector name to prevent HTML injection
  const safeConnectorName = escapeHtml(connector.name);
  
  // Build email content
  let htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">📋 New Form Submission</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px;">
        <p style="color: #666; margin-bottom: 20px;">
          You received a new submission from: <strong>${safeConnectorName}</strong>
        </p>
        
        <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
  `;

  // Add form fields with HTML escaping
  Object.entries(formData).forEach(([key, value]) => {
    const label = escapeHtml(key.charAt(0).toUpperCase() + key.slice(1));
    const safeValue = escapeHtml(value);
    htmlContent += `
      <div style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
        <strong style="color: #667eea; display: block; margin-bottom: 5px;">
          ${label}:
        </strong>
        <span style="color: #333;">
          ${safeValue || '(empty)'}
        </span>
      </div>
    `;
  });

  htmlContent += `
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            📊 This submission was logged in your Form Connector dashboard.
          </p>
        </div>
      </div>
      
      <div style="background: #333; padding: 20px; text-align: center;">
        <p style="color: #999; margin: 0; font-size: 12px;">
          Powered by Form-to-Everything Connector
        </p>
      </div>
    </div>
  `;

  // Plain text version (no escaping needed for plain text)
  let textContent = `New Form Submission from ${connector.name}\n\n`;
  Object.entries(formData).forEach(([key, value]) => {
    const label = key.charAt(0).toUpperCase() + key.slice(1);
    textContent += `${label}: ${value || '(empty)'}\n`;
  });

  // Send email
  const msg = {
    to: config.to_email || config.toEmail,
    from: {
      email: config.from_email || config.fromEmail,
      name: config.from_name || config.fromName || 'Form Connector'
    },
    subject: config.subject || `New Form Submission - ${safeConnectorName}`,
    text: textContent,
    html: htmlContent
  };

  console.log('📧 Sending email with config:', JSON.stringify({
    to: msg.to,
    from: msg.from,
    subject: msg.subject
  }, null, 2));
  
  await sgMail.send(msg);
  console.log('📧 SendGrid send() completed');
}

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
 * Handles email destination processing with automatic retry logic
 * 
 * This function wraps sendEmailOnce with exponential backoff retry logic.
 * It attempts to send the email up to maxRetries times, with delays of 1s, 2s, and 4s
 * between retries. This improves reliability when dealing with transient network
 * issues or temporary SendGrid service unavailability.
 * 
 * **Retry Strategy:**
 * - Attempt 1: Immediate
 * - Attempt 2: Wait 1 second (1000ms)
 * - Attempt 3: Wait 2 seconds (2000ms)
 * - Attempt 4: Wait 4 seconds (4000ms)
 * 
 * The exponential backoff helps avoid overwhelming the service during outages
 * while still providing reasonable retry attempts for transient failures.
 * 
 * @param {Object} destination - Destination configuration object
 * @param {Object} formData - Form submission data (key-value pairs)
 * @param {Object} connector - Connector metadata
 * @param {number} [maxRetries=3] - Maximum number of retry attempts (default: 3)
 * @returns {Promise<Object>} Success object with attempt count
 * @returns {boolean} returns.success - Always true on success
 * @returns {number} returns.attempts - Number of attempts made (1-based)
 * @throws {Error} If all retry attempts fail, includes attempt count in error message
 * 
 * @example
 * try {
 *   const result = await handleEmail(destination, formData, connector, 3);
 *   console.log(`Email sent successfully after ${result.attempts} attempt(s)`);
 * } catch (error) {
 *   console.error('Failed to send email after all retries:', error.message);
 * }
 */
export async function handleEmail(destination, formData, connector, maxRetries = 3) {
  let lastError = null;
  let attempts = 0;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    attempts = attempt;
    
    try {
      console.log(`📧 Email send attempt ${attempt}/${maxRetries}`);
      await sendEmailOnce(destination, formData, connector);
      
      // Success - return with attempt count
      console.log(`✅ Email sent successfully on attempt ${attempt}`);
      return { success: true, attempts };
      
    } catch (error) {
      lastError = error;
      console.error(`❌ Email send attempt ${attempt} failed:`, error.message);
      
      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, attempt - 1) * 1000;
        console.log(`⏳ Waiting ${delayMs}ms before retry...`);
        await delay(delayMs);
      }
    }
  }

  // All attempts failed
  throw new Error(
    `Failed to send email after ${attempts} attempt(s). Last error: ${lastError?.message || 'Unknown error'}`
  );
}

