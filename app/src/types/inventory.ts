// Tipos para el módulo de Inventario

export interface Product {
    id: string;
    company_id: string;
    code: string;
    name: string;
    description: string | null;
    category: string | null;
    unit_of_measure: string;
    is_tracked: boolean;
    cost_method: 'average' | 'fifo' | 'standard';
    current_cost: number;
    sale_price: number;
    inventory_account_id: string | null;
    cogs_account_id: string | null;
    is_active: boolean;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateProductData {
    code: string;
    name: string;
    description?: string;
    category?: string;
    unit_of_measure?: string;
    is_tracked?: boolean;
    cost_method?: 'average' | 'fifo' | 'standard';
    sale_price?: number;
    inventory_account_id?: string;
    cogs_account_id?: string;
    notes?: string;
}

export interface Warehouse {
    id: string;
    company_id: string;
    code: string;
    name: string;
    location: string | null;
    is_active: boolean;
    is_default: boolean;
    created_at: string;
}

export interface CreateWarehouseData {
    code: string;
    name: string;
    location?: string;
    is_default?: boolean;
}

export type StockMoveType = 'in' | 'out' | 'adjustment' | 'transfer';

export interface StockMove {
    id: string;
    company_id: string;
    product_id: string;
    warehouse_id: string;
    move_type: StockMoveType;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    reference: string | null;
    notes: string | null;
    move_date: string;
    journal_entry_id: string | null;
    created_by: string;
    created_at: string;
    // Relaciones
    product?: Product;
    warehouse?: Warehouse;
}

export interface ProductStock {
    company_id: string;
    product_id: string;
    warehouse_id: string;
    product_code: string;
    product_name: string;
    warehouse_name: string;
    quantity_on_hand: number;
    average_cost: number;
    total_value: number;
}

export interface StockInData {
    product_id: string;
    warehouse_id: string;
    quantity: number;
    unit_cost: number;
    reference?: string;
    move_date?: string;
}

export interface StockOutData {
    product_id: string;
    warehouse_id: string;
    quantity: number;
    reference?: string;
    move_date?: string;
}

export interface AdjustStockData {
    product_id: string;
    warehouse_id: string;
    new_quantity: number;
    reason: string;
}

// Constantes
export const UNIT_OF_MEASURES = [
    { value: 'UND', label: 'Unidad' },
    { value: 'KG', label: 'Kilogramo' },
    { value: 'LT', label: 'Litro' },
    { value: 'M', label: 'Metro' },
    { value: 'M2', label: 'Metro Cuadrado' },
    { value: 'M3', label: 'Metro Cúbico' },
    { value: 'CAJA', label: 'Caja' },
    { value: 'PAQ', label: 'Paquete' }
];

export const MOVE_TYPE_LABELS: Record<StockMoveType, { label: string; color: string }> = {
    in: { label: 'Entrada', color: 'bg-emerald-100 text-emerald-700' },
    out: { label: 'Salida', color: 'bg-red-100 text-red-600' },
    adjustment: { label: 'Ajuste', color: 'bg-amber-100 text-amber-700' },
    transfer: { label: 'Traslado', color: 'bg-blue-100 text-blue-700' }
};
