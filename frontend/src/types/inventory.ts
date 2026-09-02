import { DecimalOrString } from '../utils/decimal';

export interface Warehouse {
  _id: string;
  organizationId: string;
  firmId: { _id: string; name: string; code: string } | string;
  name: string;
  code: string;
  address?: {
    line1?: string;
    city?: string;
    district?: string;
    province?: string;
  };
  isDefault: boolean;
  isActive: boolean;
}

export interface StockBalance {
  _id: string;
  organizationId: string;
  warehouseId: { _id: string; name: string; code: string } | string;
  itemId: {
    _id: string;
    name: string;
    code: string;
    barcode?: string;
    minimumStock?: DecimalOrString;
    primaryUnitId?: { _id: string; abbreviation: string };
    salePrice?: DecimalOrString;
  };
  quantity: DecimalOrString;
  averageCost: DecimalOrString;
  totalValuation: DecimalOrString;
  lastMovementDate: string;
}

export interface StockMovement {
  _id: string;
  organizationId: string;
  warehouseId: { _id: string; name: string; code: string };
  itemId: string;
  type: string;
  direction: 'IN' | 'OUT';
  quantity: DecimalOrString;
  costRate: DecimalOrString;
  totalCost: DecimalOrString;
  date: string;
  remarks?: string;
}

export interface ValuationReport {
  totalValuation: string;
  totalPositions: number;
  breakdown: StockBalance[];
}

export interface LowStockItem {
  item: {
    _id: string;
    name: string;
    code: string;
    minimumStock: DecimalOrString;
  };
  currentQuantity: number;
  minimumStock: number;
  deficit: number;
}
