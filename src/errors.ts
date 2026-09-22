import type { ApiErrorPayload } from "./types.js";

export class KailoPayError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly requestId: string | undefined;
  readonly details: ApiErrorPayload | null;

  constructor(
    message: string,
    options: {
      readonly status: number;
      readonly code?: string;
      readonly requestId?: string;
      readonly details?: ApiErrorPayload | null;
    },
  ) {
    super(message);
    this.name = "KailoPayError";
    this.status = options.status;
    this.code = options.code;
    this.requestId = options.requestId;
    this.details = options.details ?? null;
  }
}

export class KailoPayTimeoutError extends Error {
  constructor(message = "kailopay request timed out") {
    super(message);
    this.name = "KailoPayTimeoutError";
  }
}
