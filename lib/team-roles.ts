// Client-safe team role/permission constants (no server-only imports).

export type Role = "OWNER" | "ADMIN" | "MANAGER" | "STAFF";
export type Permission =
  | "products" | "orders" | "customize" | "discounts"
  | "analytics" | "campaigns" | "team" | "settings";

export const ALL_PERMISSIONS: Permission[] = [
  "products", "orders", "customize", "discounts", "analytics", "campaigns", "team", "settings",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: ALL_PERMISSIONS,
  ADMIN: ALL_PERMISSIONS,
  MANAGER: ["products", "orders", "customize", "discounts", "analytics", "campaigns"],
  STAFF: ["orders"],
};

export const ASSIGNABLE_ROLES: Role[] = ["ADMIN", "MANAGER", "STAFF"];

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MANAGER: "Manager",
  STAFF: "Staff",
};

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  ADMIN: "Full access except transferring ownership",
  MANAGER: "Products, orders, store design, discounts & analytics, no team or billing",
  STAFF: "View and fulfill orders only",
};

export const ACCOUNT_COOKIE = "sellora_acct";
