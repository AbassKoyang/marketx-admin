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
};

export type Market = {
  id: number;
  title: string;
  slug: string;
  market_type: MarketType;
  question: string;
  description: string;
  category: MarketCategory;
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
  outcomes: MarketOutcome[];
  created_at: string;
  updated_at: string;
};

// ─── Trading ─────────────────────────────────────────────────────────────────

export type Order = {
  id: number;
  outcome: number;
  side: OrderSide;
  limit_price: number;
  original_quantity: number;
  filled_quantity: number;
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
  price: number;
  price_decimal: number;
  quantity: number;
  created_at: string;
};

export type Position = {
  id: number;
  outcome: number;
  quantity: number;
  reserved_quantity: number;
  cost_basis: number;
  realized_pnl: number;
  average_entry_price: number | null;
  settled_at: string | null;
  updated_at: string;
};

export type PositionSummary = {
  open_positions: number;
  total_cost_basis: number;
  realized_pnl: number;
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

export type MarketStats = {
  latest_price: number;
  total_volume: number;
  trade_count: number;
  first_trade_at: string | null;
  last_trade_at: string | null;
  depth: Record<
    string,
    { bids: OrderBookLevel[]; asks: OrderBookLevel[] }
  >;
};

export type OrderBook = {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
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
  outcome_name: string;
  market_id: number;
  market_title: string;
  market_slug: string;
};

export type AdminPosition = Position & {
  user: AdminUserCompact;
  outcome_name: string;
  market_id: number;
  market_title: string;
  market_slug: string;
};

export type AdminTrade = Trade & {
  buyer: AdminUserCompact;
  seller: AdminUserCompact;
  outcome_name: string;
  market_id: number;
  market_title: string;
  market_slug: string;
};

export type AdminOverview = {
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
    orders: number;
    open_orders: number;
    trades: number;
    trades_24h: number;
    open_positions: number;
  };
};

// ─── Pagination ──────────────────────────────────────────────────────────────

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

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
