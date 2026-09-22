export type Environment = "sandbox";
export type Network = "stellar_testnet";
export type AssetCode = "XLM";
export type FiatCurrency = "IDR";
export type Direction = "buy" | "sell";
export type PaymentMethod = "xendit" | "qris" | "bri_va";
export type OrderStatus =
  | "created"
  | "payment_pending"
  | "payment_confirmed"
  | "stellar_processing"
  | "completed"
  | "expired"
  | "payment_failed"
  | "stellar_failed"
  | "cancelled"
  | "asset_pending"
  | "asset_received"
  | "asset_invalid"
  | "retirement_processing"
  | "withdrawal_processing"
  | "retirement_failed"
  | "withdrawal_failed";

export type ExactAmount = string & { readonly __brand: "ExactAmount" };
export type MinorAmount = string & { readonly __brand: "MinorAmount" };

export function exactAmount(value: string): ExactAmount {
  if (!/^\d+\.\d{1,7}$/.test(value)) {
    throw new Error("XLM amount must be a decimal string with up to 7 fraction digits");
  }
  return value as ExactAmount;
}

export function minorAmount(value: string): MinorAmount {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new Error("minor amount must be a positive integer string");
  }
  return value as MinorAmount;
}

export interface FiatAmount {
  readonly currency: FiatCurrency;
  readonly amount_minor: MinorAmount;
}

export interface StellarAsset {
  readonly network: Network;
  readonly code: AssetCode;
  readonly amount: ExactAmount;
}

export interface StellarDestination {
  readonly account: string;
  readonly memo?: string | null;
}

export interface CreateOnrampRequest {
  readonly fiat: FiatAmount;
  readonly payment_method?: PaymentMethod;
  readonly stellar_destination: StellarDestination;
}

export interface CreateOfframpRequest {
  readonly asset: StellarAsset;
  readonly withdrawal: {
    readonly currency: FiatCurrency;
    readonly method: "sandbox_bank_transfer";
    readonly destination_token?: string;
  };
}

export interface BuyQuotePreviewRequest {
  readonly direction: "buy";
  readonly fiat: FiatAmount;
  readonly asset: Omit<StellarAsset, "amount"> & { readonly amount?: ExactAmount };
}

export interface SellQuotePreviewRequest {
  readonly direction: "sell";
  readonly fiat: {
    readonly currency: FiatCurrency;
    readonly amount_minor?: MinorAmount;
  };
  readonly asset: StellarAsset;
}

export type QuotePreviewRequest = BuyQuotePreviewRequest | SellQuotePreviewRequest;

export interface Quote {
  readonly direction: Direction;
  readonly environment: Environment;
  readonly network: Network;
  readonly fiat: FiatAmount;
  readonly asset: {
    readonly code: AssetCode;
    readonly amount: ExactAmount;
  };
  readonly rate: string;
  readonly adjusted_rate: string;
  readonly spread_bps: number;
  readonly source_at: string;
  readonly expires_at: string;
}

export interface QuotePreviewResponse {
  readonly quote: Quote;
}

export interface Checkout {
  readonly id: string;
  readonly status: string;
  readonly presentation_type: "PAYMENT_LINK" | "QR_STRING" | "VIRTUAL_ACCOUNT_NUMBER";
  readonly presentation_value: string;
  readonly payment_link_url?: string;
  readonly expires_at?: string | null;
}

export interface Payout {
  readonly reference: string;
  readonly method: "sandbox_bank_transfer";
  readonly amount_minor: MinorAmount;
  readonly state: "pending" | "completed" | "failed";
  readonly simulated: boolean;
  readonly disclosure: string;
}

export interface Order {
  readonly id: string;
  readonly status: OrderStatus;
  readonly environment: Environment;
  readonly network: Network;
  readonly fiat: FiatAmount;
  readonly asset: StellarAsset;
  readonly quote: Pick<Quote, "rate" | "adjusted_rate" | "spread_bps" | "source_at" | "expires_at">;
  readonly payment_method?: PaymentMethod;
  readonly stellar_destination: StellarDestination;
  readonly checkout?: Checkout;
  readonly stellar_transaction_hash?: string;
  readonly deposit_transaction_hash?: string;
  readonly payout?: Payout;
  readonly failure_code?: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface OrderResponse {
  readonly order: Order;
}

export interface ListOrdersOptions {
  readonly limit?: number;
  readonly cursor?: string;
}

export interface ListOrdersResponse {
  readonly orders: readonly Order[];
  readonly next_cursor: string;
}

export interface ApiErrorPayload {
  readonly code?: string;
  readonly message?: string;
  readonly error?: string;
  readonly [key: string]: unknown;
}
