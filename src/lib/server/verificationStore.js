/**
 * In-memory store for mapping email -> code.
 * Note: In Vercel's serverless environment, this store does not persist
 * across different invocations. For production, use a persistent database.
 */
export const verificationStore = {};
