/**
 * Centralized FastAPI Error Handler
 * Handles all types of FastAPI validation errors and converts them to readable messages
 */

export const handleApiError = (error) => {
    console.log("Full error:", error.response?.data);

    let errorMessage = "Something went wrong";

    const errorData = error.response?.data;

    // Case 1: No response data
    if (!errorData) {
        errorMessage = error.message || "Network error occurred";
        return errorMessage;
    }

    // ✅ Case 2: FastAPI validation errors (ARRAY) - Most common
    if (Array.isArray(errorData.detail)) {
        errorMessage = errorData.detail
            .map(err => err.msg || JSON.stringify(err))
            .join(", ");
        return errorMessage;
    }

    // ✅ Case 3: Single string error
    if (typeof errorData.detail === "string") {
        errorMessage = errorData.detail;
        return errorMessage;
    }

    // ✅ Case 4: Custom backend message
    if (errorData.message) {
        errorMessage = errorData.message;
        return errorMessage;
    }

    // ✅ Case 5: Fallback - stringify the error data
    errorMessage = JSON.stringify(errorData);
    return errorMessage;
};

/**
 * Redux thunk error handler for consistent error handling in async thunks
 */
export const handleThunkError = (error, fallbackMessage = "Operation failed") => {
    const errorData = error.response?.data;
    
    // ✅ Handle FastAPI validation errors (ARRAY)
    if (errorData && Array.isArray(errorData.detail)) {
        return errorData.detail
            .map(err => err.msg || JSON.stringify(err))
            .join(", ");
    }
    
    // ✅ Handle single string error
    if (errorData && typeof errorData.detail === "string") {
        return errorData.detail;
    }
    
    // ✅ Handle custom backend message
    if (errorData && errorData.message) {
        return errorData.message;
    }
    
    // ✅ Fallback
    return errorData ? JSON.stringify(errorData) : fallbackMessage;
};
