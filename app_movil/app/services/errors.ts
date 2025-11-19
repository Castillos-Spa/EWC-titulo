export class ApiError extends Error {
  status?: number;
  code?: string;
  body?: any;
  constructor(message: string, status?: number, code?: string, body?: any) {
    super(message);
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

export class PermissionError extends ApiError {
  constructor(message: string = 'Permiso denegado', body?: any) {
    super(message, 403, 'E_PERM', body);
  }
}

export class TimeoutError extends ApiError {
  constructor(message: string = 'Tiempo de espera excedido') {
    super(message, undefined, 'E_TIMEOUT');
  }
}

export function mapStatusToError(status: number, message: string, body?: any): ApiError {
  if (status === 403) return new PermissionError(message, body);
  if (status === 401) return new ApiError(message || 'No autorizado', status, 'E_AUTH', body);
  if (status === 404) return new ApiError(message || 'Recurso no encontrado', status, 'E_NOT_FOUND', body);
  if (status >= 500) return new ApiError(message || 'Error de servidor', status, 'E_SERVER', body);
  return new ApiError(message || 'Error de solicitud', status, 'E_REQUEST', body);
}