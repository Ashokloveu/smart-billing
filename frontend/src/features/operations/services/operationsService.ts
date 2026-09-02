import { apiClient } from '../../../services/apiClient';
import {
  StockTransfer,
  StockBatch,
  PurchaseRequisition,
  PurchaseOrder,
  GoodsReceipt,
  SalesOrder,
  NotificationItem,
} from '../types/operations';

export const operationsService = {
  // Transfers
  getTransfers: async (orgId: string, params?: any): Promise<StockTransfer[]> => {
    const res = await apiClient.get(`/organizations/${orgId}/operations/transfers`, { params });
    return res.data.data;
  },

  createTransfer: async (orgId: string, payload: any): Promise<StockTransfer> => {
    const res = await apiClient.post(`/organizations/${orgId}/operations/transfers`, payload);
    return res.data.data;
  },

  dispatchTransfer: async (orgId: string, id: string): Promise<StockTransfer> => {
    const res = await apiClient.post(`/organizations/${orgId}/operations/transfers/${id}/dispatch`);
    return res.data.data;
  },

  receiveTransfer: async (orgId: string, id: string): Promise<StockTransfer> => {
    const res = await apiClient.post(`/organizations/${orgId}/operations/transfers/${id}/receive`);
    return res.data.data;
  },

  // Batches
  getBatches: async (orgId: string, params?: any): Promise<StockBatch[]> => {
    const res = await apiClient.get(`/organizations/${orgId}/operations/batches`, { params });
    return res.data.data;
  },

  createBatch: async (orgId: string, payload: any): Promise<StockBatch> => {
    const res = await apiClient.post(`/organizations/${orgId}/operations/batches`, payload);
    return res.data.data;
  },

  // Procurement
  getRequisitions: async (orgId: string): Promise<PurchaseRequisition[]> => {
    const res = await apiClient.get(`/organizations/${orgId}/operations/requisitions`);
    return res.data.data;
  },

  createRequisition: async (orgId: string, payload: any): Promise<PurchaseRequisition> => {
    const res = await apiClient.post(`/organizations/${orgId}/operations/requisitions`, payload);
    return res.data.data;
  },

  getPurchaseOrders: async (orgId: string): Promise<PurchaseOrder[]> => {
    const res = await apiClient.get(`/organizations/${orgId}/operations/purchase-orders`);
    return res.data.data;
  },

  createPurchaseOrder: async (orgId: string, payload: any): Promise<PurchaseOrder> => {
    const res = await apiClient.post(`/organizations/${orgId}/operations/purchase-orders`, payload);
    return res.data.data;
  },

  getGoodsReceipts: async (orgId: string): Promise<GoodsReceipt[]> => {
    const res = await apiClient.get(`/organizations/${orgId}/operations/goods-receipts`);
    return res.data.data;
  },

  createGoodsReceipt: async (orgId: string, payload: any): Promise<GoodsReceipt> => {
    const res = await apiClient.post(`/organizations/${orgId}/operations/goods-receipts`, payload);
    return res.data.data;
  },

  // Sales Orders
  getSalesOrders: async (orgId: string): Promise<SalesOrder[]> => {
    const res = await apiClient.get(`/organizations/${orgId}/operations/sales-orders`);
    return res.data.data;
  },

  createSalesOrder: async (orgId: string, payload: any): Promise<SalesOrder> => {
    const res = await apiClient.post(`/organizations/${orgId}/operations/sales-orders`, payload);
    return res.data.data;
  },

  // Stock Adjustments
  adjustStock: async (orgId: string, payload: any) => {
    const res = await apiClient.post(`/organizations/${orgId}/operations/adjustments`, payload);
    return res.data.data;
  },

  // Approvals
  approveDocument: async (orgId: string, docType: string, id: string) => {
    const res = await apiClient.post(`/organizations/${orgId}/operations/approvals/${docType}/${id}`);
    return res.data.data;
  },

  // Notifications
  getNotifications: async (orgId: string): Promise<{ items: NotificationItem[]; unreadCount: number }> => {
    const res = await apiClient.get(`/organizations/${orgId}/notifications`);
    return res.data.data;
  },

  markNotificationsAsRead: async (orgId: string) => {
    const res = await apiClient.post(`/organizations/${orgId}/notifications/read-all`);
    return res.data.data;
  },
};
