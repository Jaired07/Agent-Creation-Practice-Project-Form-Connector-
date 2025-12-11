import { handleEmail } from './email.js';
import { handleSheets } from './sheets.js';
import { handleSlack } from './slack.js';

/**
 * Placeholder handler for SMS destination
 * 
 * @param {Object} destination - Destination configuration
 * @param {Object} formData - Form submission data
 * @param {Object} connector - Connector metadata
 * @throws {Error} Always throws error indicating not implemented
 */
async function handleSms(destination, formData, connector) {
  console.log('⚠️  SMS destination handler is not yet implemented');
  throw new Error('This destination type is not yet implemented');
}

/**
 * Placeholder handler for Webhook destination
 * 
 * @param {Object} destination - Destination configuration
 * @param {Object} formData - Form submission data
 * @param {Object} connector - Connector metadata
 * @throws {Error} Always throws error indicating not implemented
 */
async function handleWebhook(destination, formData, connector) {
  console.log('⚠️  Webhook destination handler is not yet implemented');
  throw new Error('This destination type is not yet implemented');
}

/**
 * Destination handlers registry
 * 
 * This object maps destination types to their handler functions.
 * Each handler function receives:
 * - destination: The destination configuration object
 * - formData: The form submission data
 * - connector: The connector metadata
 * 
 * Handlers should:
 * - Process the form submission according to the destination type
 * - Throw errors if processing fails
 * - Return void (Promise<void>) on success
 * 
 * @type {Object<string, Function>}
 * 
 * @example
 * // Use a handler
 * const handler = destinationHandlers[destination.type];
 * if (handler) {
 *   await handler(destination, formData, connector);
 * }
 */
export const destinationHandlers = {
  email: handleEmail,
  slack: handleSlack,
  sms: handleSms,
  sheets: handleSheets,
  webhook: handleWebhook
};

