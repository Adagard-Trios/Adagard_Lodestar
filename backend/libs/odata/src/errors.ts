/**
 * OData error model (OData v4 JSON format §21):
 *   { "error": { "code": "...", "message": "...", "target": "...", "details": [] } }
 */
export interface ODataErrorDetail {
  code: string;
  message: string;
  target?: string | null;
}

export interface ODataErrorBody {
  error: {
    code: string;
    message: string;
    target: string | null;
    details: ODataErrorDetail[];
  };
}

export class ODataError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly target: string | null = null,
    readonly details: ODataErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'ODataError';
  }

  toJSON(): ODataErrorBody {
    return { error: { code: this.code, message: this.message, target: this.target, details: this.details } };
  }

  static badRequest(message: string, target: string | null = null) {
    return new ODataError(400, 'BadRequest', message, target);
  }

  static invalidQuery(option: string, message: string) {
    return new ODataError(400, 'InvalidQueryOption', message, option);
  }

  static notFound(message = 'Resource not found', target: string | null = null) {
    return new ODataError(404, 'NotFound', message, target);
  }

  static notImplemented(message: string, target: string | null = null) {
    return new ODataError(501, 'NotImplemented', message, target);
  }

  static methodNotAllowed(message: string, target: string | null = null) {
    return new ODataError(405, 'MethodNotAllowed', message, target);
  }

  static forbidden(message = 'Forbidden', target: string | null = null) {
    return new ODataError(403, 'Forbidden', message, target);
  }

  static preconditionFailed(message = 'The entity was changed by someone else (ETag mismatch)') {
    return new ODataError(412, 'PreconditionFailed', message);
  }

  static preconditionRequired(message = 'If-Match header with the entity ETag is required') {
    return new ODataError(428, 'PreconditionRequired', message);
  }

  static conflict(message: string, target: string | null = null) {
    return new ODataError(409, 'Conflict', message, target);
  }
}
