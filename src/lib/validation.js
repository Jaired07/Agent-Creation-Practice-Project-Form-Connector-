/**
 * Input validation module for form submissions
 * 
 * This module provides comprehensive validation for form submission payloads
 * to prevent abuse, ensure data integrity, and protect against malicious input.
 */

/**
 * Validates a form submission payload according to security and performance constraints
 * 
 * This function performs multiple validation checks:
 * - Payload size limit (100KB) to prevent DoS attacks via large payloads
 * - Field count limit (50 fields) to prevent resource exhaustion
 * - Field type validation (string, number, boolean only) to ensure data consistency
 * - String length limit (10,000 chars per field) to prevent memory issues
 * 
 * @param {Object} formData - The form submission data object to validate
 * @returns {boolean} Returns true if all validation passes
 * @throws {Error} Throws descriptive error with field name if validation fails
 * 
 * @example
 * try {
 *   validateSubmission({ name: "John", email: "john@example.com" });
 *   // Validation passed
 * } catch (error) {
 *   // Handle validation error
 *   console.error(error.message);
 * }
 */
export function validateSubmission(formData) {
  // Check if formData is an object
  if (!formData || typeof formData !== 'object' || Array.isArray(formData)) {
    throw new Error('Form data must be a valid object');
  }

  // Calculate payload size (approximate JSON string size)
  const payloadSize = JSON.stringify(formData).length;
  const maxPayloadSize = 100 * 1024; // 100KB in bytes
  
  console.log(`📊 Payload size: ${(payloadSize / 1024).toFixed(2)}KB / ${(maxPayloadSize / 1024).toFixed(2)}KB limit`);
  
  if (payloadSize > maxPayloadSize) {
    throw new Error(`Payload size exceeds limit: ${(payloadSize / 1024).toFixed(2)}KB > ${(maxPayloadSize / 1024).toFixed(2)}KB`);
  }

  // Get field count
  const fieldCount = Object.keys(formData).length;
  const maxFields = 50;
  
  console.log(`📊 Field count: ${fieldCount} / ${maxFields} limit`);
  
  if (fieldCount > maxFields) {
    throw new Error(`Field count exceeds limit: ${fieldCount} > ${maxFields}`);
  }

  // Validate each field
  for (const [fieldName, fieldValue] of Object.entries(formData)) {
    // Validate field name (basic sanity check)
    if (typeof fieldName !== 'string' || fieldName.length === 0) {
      throw new Error(`Invalid field name: field names must be non-empty strings`);
    }

    if (fieldName.length > 255) {
      throw new Error(`Field name too long: "${fieldName}" exceeds 255 characters`);
    }

    // Validate field type (only string, number, boolean allowed)
    const fieldType = typeof fieldValue;
    
    if (fieldValue !== null && fieldValue !== undefined) {
      if (fieldType !== 'string' && fieldType !== 'number' && fieldType !== 'boolean') {
        throw new Error(
          `Invalid field type for "${fieldName}": expected string, number, or boolean, got ${fieldType}`
        );
      }

      // Validate string length
      if (fieldType === 'string') {
        const maxStringLength = 10000; // 10,000 characters
        
        if (fieldValue.length > maxStringLength) {
          throw new Error(
            `Field "${fieldName}" exceeds maximum length: ${fieldValue.length} > ${maxStringLength} characters`
          );
        }
      }

      // Validate number range (prevent extremely large numbers)
      if (fieldType === 'number') {
        if (!Number.isFinite(fieldValue)) {
          throw new Error(`Field "${fieldName}" must be a finite number`);
        }
        
        // Check for extremely large numbers that could cause issues
        const maxNumber = Number.MAX_SAFE_INTEGER;
        const minNumber = Number.MIN_SAFE_INTEGER;
        
        if (fieldValue > maxNumber || fieldValue < minNumber) {
          throw new Error(
            `Field "${fieldName}" number value out of safe range: ${fieldValue}`
          );
        }
      }
    }
  }

  console.log(`✅ Validation passed: ${fieldCount} fields, ${(payloadSize / 1024).toFixed(2)}KB`);
  return true;
}

