// ─── Core Domain Types ───────────────────────────────────────────────────────

export type MarketStatus = "draft" | "open" | "closed" | "resolved" | "void";
export type MarketType = "binary" | "multi_outcome";
export type OrderSide = "buy" | "sell";
export type OrderStatus =
  | "open"
  | "partially_filled"
  | "filled"
  | "cancelled";

// ─── Auth ────────────────────────────────────────────────────────────────────

export type UserProfile = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  avatar: string | null;
  is_onboarded: boolean;
  is_verified: boolean;
  is_staff?: boolean;
};

// ─── Markets ─────────────────────────────────────────────────────────────────

export type MarketCategory = {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  is_active: boolean;
  display_order: number;
};

export type MarketOutcome = {
  id: number;
  market: number;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  /** Net shares the LMSR market maker has sold for this outcome. */
  net_shares: number;
  /** @deprecated Alias for `current_price` on market detail. */
  latest_price: number | null;
  /** Integer tick, 0..10000. `null` when the outcome is inactive. */
  current_price: number | null;
  /** Decimal probability, 0..1. `null` when the outcome is inactive. */
  current_price_decimal: number | null;
};

export type MarketPrice = {
  outcome_id: number;
  name: string;
  slug: string;
  /** Integer tick, 0..10000. */
  price: number;
  /** Decimal probability, 0..1. */
  price_decimal: number;
};

export type MarketResolution = {
  winning_outcome: number | null;
  is_void: boolean;
  evidence_summary: string;
  evidence_url: string;
  resolved_at: string;
};

export type Market = {
  id: number;
  title: string;
  slug: string;
  market_type: MarketType;
  question: string;
  description: string;
  category: MarketCategory;
  /** Write-only on create/update; responses use `category`. */
  category_id?: number;
  resolution_criteria: string;
  resolution_source_description: string;
  resolution_source_url: string;
  image_url: string;
  image_public_id: string;
  status: MarketStatus;
  opens_at: string;
  closes_at: string;
  resolution_deadline: string;
  is_featured: boolean;
  /** Read-only. Caps minted complete sets. */
  issuance_limit: number;
  /** Read-only. Complete sets minted so far. */
  issued_quantity: number;
  /** LMSR depth parameter. Changing it reprices every outcome immediately. */
  liquidity_b: number;
  outcomes: MarketOutcome[];
  current_prices: MarketPrice[];
  resolution: MarketResolution | null;
  created_at: string;
  updated_at: string;
};

// ─── Trading ─────────────────────────────────────────────────────────────────

export type Order = {
  id: number;
  outcome: number;
  outcome_name: string;
  market_id: number;
  market_title: string;
  market_slug: string;
  side: OrderSide;
  /**
   * Slippage cap, not an execution price. Market BUY stores 9999 and market
   * SELL stores 1.
   */
  limit_price: number;
  original_quantity: number;
  filled_quantity: number;
  /** Cancelled remainder for new partial fills. */
  remaining_quantity: number;
  status: OrderStatus;
  client_order_id: string;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Trade = {
  id: number;
  execution_id: string;
  outcome: number;
  outcome_name: string;
  market_id: number;
  market_title: string;
  market_slug: string;
  /** Average execution tick. */
  price: number;
  price_decimal: number;
  quantity: number;
  /** Exact LMSR cash amount in credit units. May be 0 on legacy rows. */
  notional: number;
  notional_decimal: number;
  created_at: string;
};

export type Position = {
  id: number;
  outcome: number;
  outcome_name: string;
  market_id: number;
  market_title: string;
  market_slug: string;
  market_status: MarketStatus;
  market_closes_at: string;
  quantity: number;
  reserved_quantity: number;
  cost_basis: number;
  realized_pnl: number;
  /** Decimal average entry price. */
  average_entry_price: number | null;
  /** @deprecated Alias for `current_price`. */
  last_price: number | null;
  current_price: number | null;
  current_price_decimal: number | null;
  market_value: number | null;
  unrealized_pnl: number | null;
  settled_at: string | null;
  updated_at: string;
};

export type PositionSummary = {
  open_positions: number;
  total_cost_basis: number;
  realized_pnl: number;
};

export type Quote = {
  outcome: number;
  outcome_name: string;
  market_id: number;
  market_slug: string;
  side: OrderSide;
  requested_quantity: number;
  fillable_quantity: number;
  notional: number;
  notional_decimal: number;
  average_price: number | null;
  average_price_decimal: number | null;
  current_price: number;
  current_price_decimal: number;
  /** Keyed by string outcome ID. */
  prices_after: Record<string, number>;
  prices_after_decimal: Record<string, number>;
  limited_by: "limit" | "balance" | "position" | "liquidity" | null;
};

// ─── Wallet ──────────────────────────────────────────────────────────────────

export type Wallet = {
  available_balance: number;
  reserved_balance: number;
  created_at: string;
  updated_at: string;
};

export type WalletLedgerEntry = {
  id: number;
  entry_type: string;
  available_delta: number;
  reserved_delta: number;
  reference_type: string;
  reference_id: string;
  description: string;
  created_at: string;
};

// ─── Market Stats ─────────────────────────────────────────────────────────────

export type OrderBookLevel = { price: number; quantity: number };

export type DepthLevel = OrderBookLevel;

export type OrderBook = {
  current_price: number | null;
  current_price_decimal: number | null;
  /** AMM buy-back levels. Synthetic, not resting user orders. */
  bids: OrderBookLevel[];
  /** AMM sell levels. Synthetic, not resting user orders. */
  asks: OrderBookLevel[];
};

export type MarketStats = {
  /** @deprecated Last trade average price, not current probability. */
  latest_price: number | null;
  /** Current LMSR vector as decimals, keyed by outcome slug. Sums to 1.0. */
  prices: Record<string, number>;
  liquidity_b: number;
  /** Sum of trade quantities (shares), not credits. */
  total_volume: number;
  trade_count: number;
  first_trade_at: string | null;
  last_trade_at: string | null;
  /** Synthetic AMM depth, keyed by outcome slug. */
  depth: Record<string, OrderBook>;
};

export type PriceHistoryPoint = {
  timestamp: number;
  price: number;
  resolution_seconds: number;
  volume: number;
};

export type PriceHistoryRange = "1H" | "6H" | "1D" | "1W" | "1M" | "ALL";

export type PriceHistoryResponse = {
  data: PriceHistoryPoint[];
  pagination: {
    limit: number;
    offset: number;
    has_more: boolean;
    next_cursor: string | null;
  };
};

// ─── Activity ────────────────────────────────────────────────────────────────

export type ActivityEventType =
  | "order_placed"
  | "order_cancelled"
  | "order_filled"
  | "trade_executed"
  | "position_settled";

export type NotificationDevice = {
  id: number;
  token: string;
  platform: "web" | "android" | "ios";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ActivityEvent = {
  id: number;
  event_type: ActivityEventType;
  visibility: "public" | "private";
  outcome: number;
  payload: Record<string, unknown>;
  created_at: string;
};

// ─── Admin (staff-wide) ──────────────────────────────────────────────────────

export type AdminUserCompact = {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar: string | null;
  is_market_maker?: boolean;
};

export type AdminUserWallet = {
  available_balance: number;
  reserved_balance: number;
  total_balance: number;
};

export type AdminUser = {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar: string | null;
  is_active: boolean;
  is_staff: boolean;
  is_onboarded: boolean;
  is_verified: boolean;
  is_market_maker: boolean;
  auth_provider: string;
  created_at: string;
  last_login: string | null;
  wallet: AdminUserWallet;
  orders_count: number;
  open_positions_count: number;
  trades_count: number;
  realized_pnl: number;
  cost_basis: number;
};

export type AdminWallet = {
  id: number;
  user: AdminUserCompact;
  available_balance: number;
  reserved_balance: number;
  total_balance: number;
  created_at: string;
  updated_at: string;
};

export type AdminOrder = Order & {
  user: AdminUserCompact;
  /** Synthetic AMM fill (`amm:*`) or an order owned by the house account. */
  is_market_maker_order: boolean;
};

export type AdminPosition = Position & {
  user: AdminUserCompact;
};

export type AdminTrade = Trade & {
  buyer: AdminUserCompact;
  seller: AdminUserCompact;
};

export type AdminOverview = {
  /** Customer counts exclude the market-maker liquidity account. */
  users: { total: number; staff: number; active: number; new_7d: number };
  wallets: {
    total: number;
    available: number;
    reserved: number;
  };
  markets: {
    total: number;
    open: number;
    draft: number;
    closed: number;
    resolved: number;
    void: number;
  };
  trading: {
    /** Includes market-maker activity. */
    orders: number;
    /** Legacy resting orders only; cancelled remainders are excluded. */
    open_orders: number;
    trades: number;
    trades_24h: number;
    /** Customer positions only; house inventory is excluded. */
    open_positions: number;
  };
  market_maker: {
    user_id: number | null;
    email: string;
    username: string | null;
    /** Number of house accounts contributing to these totals. */
    accounts: number;
    available_balance: number;
    reserved_balance: number;
    orders: number;
    trades: number;
    open_positions: number;
  };
};

// ─── Pagination ──────────────────────────────────────────────────────────────

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

// ─── Market Write Payloads ──────────────────────────────────────────────────

export type MarketWritePayload = {
  title: string;
  market_type: MarketType;
  question: string;
  description: string;
  category_id: number;
  resolution_criteria: string;
  resolution_source_description: string;
  resolution_source_url: string;
  opens_at: string;
  closes_at: string;
  resolution_deadline: string;
  is_featured: boolean;
  /** Changing this after trading reprices every outcome. */
  liquidity_b?: number;
};

export type OutcomeWritePayload = {
  market: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  display_order?: number;
  is_active?: boolean;
};
