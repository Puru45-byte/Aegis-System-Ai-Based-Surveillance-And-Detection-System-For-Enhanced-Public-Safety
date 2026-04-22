/**
 * Test file to verify error handling works correctly
 */

import { handleApiError } from './errorHandler.js';

// Test FastAPI validation error (ARRAY)
const testValidationError = {
    response: {
        data: {
            detail: [
                { msg: "Field required", type: "missing", loc: ["body", "description"] },
                { msg: "Invalid email", type: "value_error", loc: ["body", "contact_email"] }
            ]
        }
    }
};

// Test single string error
const testStringError = {
    response: {
        data: {
            detail: "Authentication failed"
        }
    }
};

// Test custom message error
const testCustomError = {
    response: {
        data: {
            message: "Custom error message"
        }
    }
};

// Test network error
const testNetworkError = {
    message: "Network Error"
};

console.log("=== Testing Error Handler ===");
console.log("1. Validation Error:", handleApiError(testValidationError));
console.log("2. String Error:", handleApiError(testStringError));
console.log("3. Custom Error:", handleApiError(testCustomError));
console.log("4. Network Error:", handleApiError(testNetworkError));

// Expected output:
// 1. Validation Error: Field required, Invalid email
// 2. String Error: Authentication failed
// 3. Custom Error: Custom error message
// 4. Network Error: Network Error
