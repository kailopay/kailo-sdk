import { KailoPayError, KailoPayTimeoutError } from "./errors.js";
import {
  decodeListOrdersResponse,
  decodeOrderResponse,
  decodeQuotePreviewResponse,
} from "./decoders.js";
import type {
  CreateOfframpRequest,
  CreateOnrampRequest,
  ListOrdersOptions,
  ListOrdersResponse,
  OrderResponse,
  QuotePreviewRequest,
  QuotePreviewResponse,
} from "./types.js";

export interface KailoPayOptions {
  readonly apiKey: string;
  readonly environment: "sandbox";
  readonly baseUrl?: string;
  readonly fetch?: typeof globalThis.fetch;
  readonly timeoutMs?: number;
}

export interface RequestOptions {
  readonly idempotencyKey?: string;
  readonly signal?: AbortSignal;
}

type RequestAuth =
  | { readonly kind: "api-key" }
  | { readonly kind: "bearer"; readonly token: string }
  | { readonly kind: "session-cookie"; readonly value: string }
  | { readonly kind: "none" };

const DEFAULT_BASE_URL = "http://localhost:8080";
const DEFAULT_TIMEOUT_MS = 15_000;

function trimBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function isApiErrorPayload(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function messageFromPayload(payload: Record<string, unknown>, status: number): string {
  const candidate = payload.message ?? payload.error ?? payload.code;
  return typeof candidate === "string" && candidate.length > 0
    ? candidate
    : `kailopay request failed with status ${status}`;
}

export class KailoPay {
  readonly onramp: {
    create: (
      request: CreateOnrampRequest,
      options?: RequestOptions,
    ) => Promise<OrderResponse>;
  };

  readonly offramp: {
    create: (
      request: CreateOfframpRequest,
      options?: RequestOptions,
    ) => Promise<OrderResponse>;
  };

  readonly quotes: {
    preview: (
      request: QuotePreviewRequest,
      options?: Pick<RequestOptions, "signal">,
    ) => Promise<QuotePreviewResponse>;
  };

  readonly orders: {
    get: (id: string, options?: Pick<RequestOptions, "signal">) => Promise<OrderResponse>;
    list: (
      options?: ListOrdersOptions & Pick<RequestOptions, "signal">,
    ) => Promise<ListOrdersResponse>;
  };

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly transport: typeof globalThis.fetch;
  private readonly timeoutMs: number;

  constructor(options: KailoPayOptions) {
    if (options.environment === undefined) {
      throw new Error("environment is required");
    }
    if (options.environment !== "sandbox") {
      throw new Error(`unsupported environment: ${options.environment}`);
    }
    if (options.apiKey.trim().length === 0) {
      throw new Error("apiKey is required");
    }
    if (!options.apiKey.startsWith("pk_test_")) {
      throw new Error("sandbox API key must start with pk_test_");
    }
    if (options.timeoutMs !== undefined && (!Number.isInteger(options.timeoutMs) || options.timeoutMs <= 0)) {
      throw new Error("timeoutMs must be a positive integer");
    }

    this.apiKey = options.apiKey;
    this.baseUrl = trimBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL);
    this.transport = options.fetch ?? globalThis.fetch;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    if (typeof this.transport !== "function") {
      throw new Error("fetch is not available; provide a fetch implementation");
    }

    this.onramp = {
      create: (request, requestOptions) =>
        this.request<OrderResponse>("/v1/onramps", {
          method: "POST",
          body: request,
          ...requestOptions,
        }, decodeOrderResponse),
    };
    this.offramp = {
      create: (request, requestOptions) =>
        this.request<OrderResponse>("/v1/offramps", {
          method: "POST",
          body: request,
          ...requestOptions,
        }, decodeOrderResponse),
    };
    this.quotes = {
      preview: (request, requestOptions) =>
        this.request<QuotePreviewResponse>("/v1/quotes", {
          method: "POST",
          body: request,
          ...requestOptions,
        }, decodeQuotePreviewResponse),
    };
    this.orders = {
      get: (id, requestOptions) =>
        this.request<OrderResponse>(`/v1/orders/${encodeURIComponent(id)}`, {
          method: "GET",
          ...requestOptions,
        }, decodeOrderResponse),
      list: (listOptions) => {
        const query = new URLSearchParams();
        if (listOptions?.limit !== undefined) query.set("limit", String(listOptions.limit));
        if (listOptions?.cursor !== undefined) query.set("cursor", listOptions.cursor);
        const suffix = query.size > 0 ? `?${query.toString()}` : "";
        const requestOptions = listOptions?.signal === undefined
          ? { method: "GET" as const }
          : { method: "GET" as const, signal: listOptions.signal };
        return this.request<ListOrdersResponse>(`/v1/orders${suffix}`, {
          ...requestOptions,
        }, decodeListOrdersResponse);
      },
    };
  }

  private async request<T>(
    path: string,
    options: {
      readonly method: "GET" | "POST";
      readonly body?: unknown;
      readonly idempotencyKey?: string;
      readonly signal?: AbortSignal;
      readonly auth?: RequestAuth;
    },
    decode: (value: unknown) => T,
  ): Promise<T> {
    const controller = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, this.timeoutMs);
    const signal = options.signal === undefined ? controller.signal : this.combineSignals(options.signal, controller.signal);
    const headers = new Headers({
      Accept: "application/json",
    });
    const auth = options.auth ?? { kind: "api-key" as const };
    if (auth.kind === "api-key") headers.set("Authorization", `Bearer ${this.apiKey}`);
    if (auth.kind === "bearer") {
      if (auth.token.trim().length === 0) throw new Error("bearer token is required");
      headers.set("Authorization", `Bearer ${auth.token}`);
    }
    if (auth.kind === "session-cookie") {
      if (auth.value.trim().length === 0) throw new Error("session cookie is required");
      headers.set("Cookie", auth.value);
    }
    if (options.body !== undefined) headers.set("Content-Type", "application/json");
    if (options.idempotencyKey !== undefined) headers.set("Idempotency-Key", options.idempotencyKey);

    try {
      const requestInit: RequestInit = {
        method: options.method,
        headers,
        signal,
      };
      if (options.body !== undefined) requestInit.body = JSON.stringify(options.body);
      const response = await this.transport(`${this.baseUrl}${path}`, requestInit);
      const payload = await this.readPayload(response);
      if (!response.ok) {
        const details = isApiErrorPayload(payload) ? payload : null;
        const code = details !== null && typeof details.code === "string" ? details.code : undefined;
        const requestId = response.headers.get("x-request-id") ?? undefined;
        const errorOptions: {
          status: number;
          details: Record<string, unknown> | null;
          code?: string;
          requestId?: string;
        } = { status: response.status, details };
        if (code !== undefined) errorOptions.code = code;
        if (requestId !== undefined) errorOptions.requestId = requestId;
        throw new KailoPayError(
          details === null ? `kailopay request failed with status ${response.status}` : messageFromPayload(details, response.status),
          errorOptions,
        );
      }
      return decode(payload);
    } catch (error: unknown) {
      if (error instanceof KailoPayError) throw error;
      if (timedOut && error instanceof DOMException && error.name === "AbortError") {
        throw new KailoPayTimeoutError();
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async readPayload(response: Response): Promise<unknown> {
    const text = await response.text();
    if (text.length === 0) return null;
    try {
      const parsed: unknown = JSON.parse(text);
      return parsed;
    } catch {
      return text;
    }
  }

  private combineSignals(first: AbortSignal, second: AbortSignal): AbortSignal {
    const controller = new AbortController();
    const abort = (): void => controller.abort();
    if (first.aborted || second.aborted) {
      controller.abort();
      return controller.signal;
    }
    first.addEventListener("abort", abort, { once: true });
    second.addEventListener("abort", abort, { once: true });
    return controller.signal;
  }
}
