/**
 * Environment variable validation module
 * 
 * This module ensures that all required environment variables are present
 * before the application starts processing requests. This prevents runtime
 * errors and provides clear feedback about missing configuration.
 */

/**
 * Required environment variables for the application
 * 
 * - NEXT_PUBLIC_SUPABASE_URL: Supabase project URL for database connection
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Supabase anonymous key for client-side operations
 * - SENDGRID_API_KEY: SendGrid API key for sending emails
 */
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SENDGRID_API_KEY'
];

/**
 * Validates that all required environment variables are present
 * 
 * This function checks for the presence of all required environment variables
 * and throws a descriptive error listing all missing variables if any are absent.
 * This ensures the application fails fast with clear error messages rather than
 * encountering undefined values at runtime.
 * 
 * @returns {boolean} Returns true if all required environment variables are present
 * @throws {Error} Throws error with list of all missing environment variables
 * 
 * @example
 * try {
 *   validateEnv();
 *   console.log('All environment variables are configured');
 * } catch (error) {
 *   console.error('Missing environment variables:', error.message);
 *   process.exit(1);
 * }
 */
export function validateEnv() {
  const missingVars = [];

  // Check each required environment variable
  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName];
    
    if (!value || value.trim() === '') {
      missingVars.push(varName);
    }
  }

  // If any variables are missing, throw descriptive error
  if (missingVars.length > 0) {
    const errorMessage = 
      `Missing required environment variables:\n` +
      `  ${missingVars.join('\n  ')}\n\n` +
      `Please add these variables to your .env.local file.`;
    
    throw new Error(errorMessage);
  }

  console.log('✅ All required environment variables are configured');
  return true;
}

/**
 * Gets the value of a required environment variable
 * Throws an error if the variable is not set
 * 
 * @param {string} varName - Name of the environment variable
 * @returns {string} The value of the environment variable
 * @throws {Error} If the environment variable is not set
 */
export function getRequiredEnv(varName) {
  const value = process.env[varName];
  
  if (!value || value.trim() === '') {
    throw new Error(`Required environment variable "${varName}" is not set`);
  }
  
  return value;
}

/**
 * Gets the value of an optional environment variable with a default
 * 
 * @param {string} varName - Name of the environment variable
 * @param {string} defaultValue - Default value if variable is not set
 * @returns {string} The value of the environment variable or default
 */
export function getOptionalEnv(varName, defaultValue = '') {
  return process.env[varName] || defaultValue;
}

