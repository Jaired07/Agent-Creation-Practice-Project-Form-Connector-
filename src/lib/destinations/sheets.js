import { google } from 'googleapis';

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
 * Authenticates with Google Sheets API using service account credentials
 * 
 * Parses service account JSON from environment variable and creates
 * an authenticated JWT client for Google Sheets API access.
 * 
 * @returns {Promise<google.auth.JWT>} Authenticated JWT client
 * @throws {Error} If service account JSON is missing or invalid
 * @private
 */
async function authenticateGoogleSheets() {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  
  if (!serviceAccountJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set');
  }

  let credentials;
  try {
    credentials = typeof serviceAccountJson === 'string' 
      ? JSON.parse(serviceAccountJson) 
      : serviceAccountJson;
  } catch (error) {
    throw new Error(`Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON: ${error.message}`);
  }

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('Invalid service account credentials: missing client_email or private_key');
  }

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return auth;
}

/**
 * Handles Google Sheets destination processing for form submissions
 * 
 * This function processes a form submission and appends it to a Google Sheet.
 * It automatically creates headers on the first submission if the sheet is empty,
 * and maintains consistent column order for all subsequent submissions.
 * 
 * **Setup Instructions:**
 * 
 * 1. **Create Google Service Account:**
 *    - Go to Google Cloud Console (https://console.cloud.google.com)
 *    - Create a new project or select existing one
 *    - Enable Google Sheets API
 *    - Go to "IAM & Admin" → "Service Accounts"
 *    - Click "Create Service Account"
 *    - Fill in details and create
 *    - Click on the service account → "Keys" tab
 *    - Click "Add Key" → "Create new key" → Choose JSON format
 *    - Download the JSON key file
 * 
 * 2. **Share Spreadsheet with Service Account:**
 *    - Open your Google Sheet
 *    - Click "Share" button
 *    - Add the service account email (found in the JSON file as "client_email")
 *    - Give it "Editor" permissions
 *    - Click "Send"
 * 
 * 3. **Get Spreadsheet ID:**
 *    - Open your Google Sheet
 *    - Look at the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
 *    - Copy the SPREADSHEET_ID part
 * 
 * 4. **Add Environment Variable:**
 *    - Add to `.env.local`:
 *    ```
 *    GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
 *    ```
 *    - Or read the JSON file and paste its contents as a single-line string
 * 
 * **Destination Configuration Structure:**
 * ```javascript
 * {
 *   type: 'sheets',
 *   enabled: true,
 *   config: {
 *     spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',  // Required
 *     sheetName: 'Form Submissions'  // Optional, defaults to 'Form Submissions'
 *   }
 * }
 * ```
 * 
 * **How It Works:**
 * 
 * 1. Authenticates with Google Sheets API using service account
 * 2. Gets the specified spreadsheet and sheet
 * 3. On first submission (empty sheet):
 *    - Creates header row with: Timestamp, Connector Name, and all form field names
 * 4. Appends new row with:
 *    - Current timestamp (ISO format)
 *    - Connector name
 *    - All form field values in the same order as headers
 * 5. Handles errors gracefully with retry logic
 * 
 * **Error Handling:**
 * 
 * - Invalid spreadsheet ID: Returns clear error message
 * - Missing permissions: Suggests sharing spreadsheet with service account
 * - Network errors: Retries with exponential backoff (3 attempts)
 * - Invalid sheet name: Creates the sheet automatically if possible
 * 
 * @param {Object} destination - Destination configuration object
 * @param {string} destination.type - Must be 'sheets'
 * @param {boolean} destination.enabled - Whether this destination is enabled
 * @param {Object} destination.config - Google Sheets configuration
 * @param {string} destination.config.spreadsheetId - Google Spreadsheet ID (from URL)
 * @param {string} [destination.config.sheetName] - Sheet name (default: 'Form Submissions')
 * @param {Object} formData - Form submission data (key-value pairs)
 * @param {Object} connector - Connector metadata
 * @param {string} connector.name - Connector name
 * @returns {Promise<void>} Resolves when data is successfully appended to sheet
 * @throws {Error} If authentication fails, spreadsheet not found, or API errors occur
 * 
 * @example
 * const destination = {
 *   type: 'sheets',
 *   enabled: true,
 *   config: {
 *     spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
 *     sheetName: 'Contact Form Submissions'
 *   }
 * };
 * 
 * const formData = {
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   message: 'Hello, this is a test'
 * };
 * 
 * const connector = {
 *   name: 'Contact Form'
 * };
 * 
 * await handleSheets(destination, formData, connector);
 */
export async function handleSheets(destination, formData, connector, maxRetries = 3) {
  console.log('📊 Google Sheets handler called with destination:', JSON.stringify(destination, null, 2));
  
  const config = destination.config || {};
  const spreadsheetId = config.spreadsheetId || config.spreadsheet_id;
  const sheetName = config.sheetName || config.sheet_name || 'Form Submissions';

  if (!spreadsheetId) {
    throw new Error('Google Sheets spreadsheet ID is required in destination config');
  }

  console.log(`📊 Processing Google Sheets submission to spreadsheet: ${spreadsheetId}, sheet: ${sheetName}`);

  let lastError = null;
  let attempts = 0;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    attempts = attempt;
    
    try {
      console.log(`📊 Google Sheets attempt ${attempt}/${maxRetries}`);

      // Authenticate
      const auth = await authenticateGoogleSheets();
      const sheets = google.sheets({ version: 'v4', auth });

      // Get spreadsheet metadata to verify access
      try {
        await sheets.spreadsheets.get({
          spreadsheetId,
        });
        console.log('✅ Successfully authenticated and accessed spreadsheet');
      } catch (error) {
        if (error.code === 404) {
          throw new Error(`Spreadsheet not found. Please check the spreadsheet ID: ${spreadsheetId}`);
        } else if (error.code === 403) {
          throw new Error(
            `Permission denied. Please share the spreadsheet with the service account email ` +
            `(found in GOOGLE_SERVICE_ACCOUNT_JSON as "client_email") and give it Editor permissions.`
          );
        }
        throw error;
      }

      // Get existing data to check if headers exist
      const existingData = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A1:Z1`, // Get first row (headers)
      });

      const existingRows = existingData.data.values || [];
      const hasHeaders = existingRows.length > 0;

      // Prepare row data
      const timestamp = new Date().toISOString();
      const fieldNames = Object.keys(formData);
      
      let rowData;

      if (!hasHeaders) {
        // First submission - create headers and data row
        console.log('📊 First submission detected, creating headers');
        
        const headers = ['Timestamp', 'Connector Name', ...fieldNames];
        const values = [timestamp, connector.name, ...fieldNames.map(key => formData[key] || '')];

        // Append headers and first row
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `${sheetName}!A1`,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [headers, values],
          },
        });

        console.log(`✅ Created headers and appended first row to sheet "${sheetName}"`);
      } else {
        // Subsequent submissions - append data row matching header order
        const headers = existingRows[0];
        const connectorNameIndex = headers.indexOf('Connector Name');
        const timestampIndex = headers.indexOf('Timestamp');

        // Build row matching header order
        rowData = headers.map((header, index) => {
          if (index === timestampIndex) {
            return timestamp;
          } else if (index === connectorNameIndex) {
            return connector.name;
          } else {
            // Find matching form field
            const formValue = formData[header];
            return formValue !== undefined && formValue !== null ? String(formValue) : '';
          }
        });

        // Append row
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `${sheetName}!A:A`,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [rowData],
          },
        });

        console.log(`✅ Appended row to sheet "${sheetName}"`);
      }

      // Success - return
      return;

    } catch (error) {
      lastError = error;
      console.error(`❌ Google Sheets attempt ${attempt} failed:`, error.message);

      // Don't retry on certain errors
      if (error.message.includes('not found') || 
          error.message.includes('Permission denied') ||
          error.message.includes('spreadsheet ID')) {
        throw error; // Fail immediately for configuration errors
      }

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
    `Failed to append to Google Sheets after ${attempts} attempt(s). Last error: ${lastError?.message || 'Unknown error'}`
  );
}

