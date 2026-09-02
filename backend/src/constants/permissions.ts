export const PERMISSIONS = {
  // Sales
  SALE_VIEW: 'sale:view',
  SALE_CREATE: 'sale:create',
  SALE_UPDATE: 'sale:update',
  SALE_DELETE: 'sale:delete',
  SALE_POST: 'sale:post',
  SALE_REVERSE: 'sale:reverse',

  // Purchases
  PURCHASE_VIEW: 'purchase:view',
  PURCHASE_CREATE: 'purchase:create',
  PURCHASE_UPDATE: 'purchase:update',
  PURCHASE_DELETE: 'purchase:delete',
  PURCHASE_POST: 'purchase:post',

  // Inventory
  INVENTORY_VIEW: 'inventory:view',
  INVENTORY_ADJUST: 'inventory:adjust',
  INVENTORY_TRANSFER: 'inventory:transfer',

  // Master Data
  PARTY_VIEW: 'party:view',
  PARTY_CREATE: 'party:create',
  PARTY_UPDATE: 'party:update',
  PARTY_DELETE: 'party:delete',

  ITEM_VIEW: 'item:view',
  ITEM_CREATE: 'item:create',
  ITEM_UPDATE: 'item:update',
  ITEM_DELETE: 'item:delete',

  // Accounting
  JOURNAL_VIEW: 'journal:view',
  JOURNAL_CREATE: 'journal:create',
  JOURNAL_POST: 'journal:post',
  JOURNAL_APPROVE: 'journal:approve',
  JOURNAL_CANCEL: 'journal:cancel',
  ACCOUNTING_VIEW: 'accounting:view',

  // Reports
  REPORT_VAT_VIEW: 'report:vat:view',
  REPORT_PNL_VIEW: 'report:pnl:view',
  REPORT_BALANCE_SHEET_VIEW: 'report:balance_sheet:view',
  REPORT_CASHFLOW_VIEW: 'report:cashflow:view',
  REPORT_STOCK_VIEW: 'report:stock:view',

  // Administration
  ORGANIZATION_VIEW: 'organization:view',
  USERS_MANAGE: 'users:manage',
  SETTINGS_UPDATE: 'settings:update',
  AUDIT_VIEW: 'audit:view',
  BACKUP_CREATE: 'backup:create',

  // All Access Wildcard
  ALL: '*',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
