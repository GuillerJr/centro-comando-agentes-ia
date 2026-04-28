export function successResponse<T>(message: string, data: T) {
  return { success: true, message, data };
}

export function errorResponse(message: string, details?: unknown) {
  return { success: false, message, details };
}
