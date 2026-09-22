export type SEP24AssetCode = "XLM";
export type SEP24AmountUnit = "XLM" | "idr_minor";
export type SEP24TransactionKind = "deposit" | "withdrawal";
export type SEP24TransactionStatus =
  | "pending_user_transfer_start"
  | "pending_anchor"
  | "pending_external"
  | "completed"
  | "expired"
  | "error";

export interface SEP24AssetInfo {
  readonly enabled: boolean;
  readonly min_amount: number;
  readonly max_amount: number;
  readonly amount_unit: SEP24AmountUnit;
  readonly fiat_currency: "IDR";
}

export interface SEP24InfoResponse {
  readonly deposit: { readonly XLM: SEP24AssetInfo };
  readonly withdraw: { readonly XLM: SEP24AssetInfo };
  readonly fee: Record<string, unknown>;
}

export interface SEP24DepositRequest {
  readonly asset_code: SEP24AssetCode;
  readonly amount_minor?: string;
  readonly account: string;
  readonly memo?: string;
  readonly memo_type?: "text";
  readonly payment_method?: "xendit" | "qris" | "bri_va";
  readonly quote_id?: string;
}

export interface SEP24WithdrawRequest {
  readonly asset_code: SEP24AssetCode;
  readonly amount: string;
  readonly destination_token: string;
  readonly quote_id?: string;
}

export interface SEP24StartOptions {
  readonly sep10Token: string;
  readonly idempotencyKey: string;
  readonly signal?: AbortSignal;
}

export interface SEP24StartResponse {
  readonly type: "interactive_customer_info_needed";
  readonly url: string;
  readonly id: string;
  readonly kyc_required: boolean;
  readonly environment: "sandbox";
  readonly network: "stellar_testnet";
  readonly payment_link_url?: string;
}

export interface SEP24Transaction {
  readonly id: string;
  readonly kind: SEP24TransactionKind;
  readonly status: SEP24TransactionStatus;
  readonly started_at: string;
  readonly updated_at: string;
  readonly stellar_transaction_id?: string;
  readonly withdraw_anchor_account?: string;
  readonly withdraw_memo?: string;
  readonly withdraw_memo_type?: "text";
  readonly amount_in?: string;
  readonly amount_out?: string;
  readonly quote_id?: string;
  readonly external_transaction_id?: string;
  readonly sandbox_disclosure?: string;
  readonly more_info_url?: string;
}

export interface SEP24TransactionListResponse {
  readonly transactions: readonly SEP24Transaction[];
}

export interface SEP24TransactionResponse {
  readonly transaction: SEP24Transaction;
}

export interface SEP24TransactionListOptions {
  readonly sep10Token: string;
  readonly limit?: number;
  readonly asset_code?: SEP24AssetCode;
  readonly kind?: SEP24TransactionKind;
  readonly no_older_than?: string;
  readonly paging_id?: string;
  readonly lang?: string;
  readonly signal?: AbortSignal;
}

export type SEP24TransactionLookup =
  | {
      readonly sep10Token: string;
      readonly id: string;
      readonly stellar_transaction_id?: never;
      readonly external_transaction_id?: never;
      readonly signal?: AbortSignal;
    }
  | {
      readonly sep10Token: string;
      readonly id?: never;
      readonly stellar_transaction_id: string;
      readonly external_transaction_id?: never;
      readonly signal?: AbortSignal;
    }
  | {
      readonly sep10Token: string;
      readonly id?: never;
      readonly stellar_transaction_id?: never;
      readonly external_transaction_id: string;
      readonly signal?: AbortSignal;
    };

export interface SEP24InteractiveOptions {
  readonly sessionCookie: string;
  readonly signal?: AbortSignal;
}

export interface SEP24InteractiveCompleteOptions extends SEP24InteractiveOptions {
  readonly destination_token?: string;
}

export interface SEP24InteractiveResponse {
  readonly environment: "sandbox";
  readonly network: "stellar_testnet";
  readonly kyc_required: boolean;
  readonly interactive?: Record<string, unknown>;
  readonly transaction?: SEP24Transaction;
}

export interface SEP24Client {
  readonly info: (options?: { readonly signal?: AbortSignal }) => Promise<SEP24InfoResponse>;
  readonly deposit: {
    readonly start: (
      request: SEP24DepositRequest,
      options: SEP24StartOptions,
    ) => Promise<SEP24StartResponse>;
  };
  readonly withdraw: {
    readonly start: (
      request: SEP24WithdrawRequest,
      options: SEP24StartOptions,
    ) => Promise<SEP24StartResponse>;
  };
  readonly transactions: {
    readonly list: (options: SEP24TransactionListOptions) => Promise<SEP24TransactionListResponse>;
    readonly get: (options: SEP24TransactionLookup) => Promise<SEP24TransactionResponse>;
  };
  readonly interactive: {
    readonly get: (
      id: string,
      options: SEP24InteractiveOptions,
    ) => Promise<SEP24InteractiveResponse>;
    readonly complete: (
      id: string,
      options: SEP24InteractiveCompleteOptions,
    ) => Promise<SEP24TransactionResponse>;
  };
}

