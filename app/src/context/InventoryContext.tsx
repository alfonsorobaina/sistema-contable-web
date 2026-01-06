import { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useCompany } from './CompanyContext';
import type {
    Product,
    CreateProductData,
    Warehouse,
    CreateWarehouseData,
    StockMove,
    ProductStock,
    StockInData,
    StockOutData,
    AdjustStockData
} from '../types/inventory';

interface InventoryContextType {
    products: Product[];
    warehouses: Warehouse[];
    stockMoves: StockMove[];
    productStock: ProductStock[];
    loading: boolean;

    // Products
    refreshProducts: () => Promise<void>;
    createProduct: (data: CreateProductData) => Promise<{ success: boolean; error?: string; id?: string }>;
    updateProduct: (id: string, data: Partial<CreateProductData>) => Promise<{ success: boolean; error?: string }>;
    deleteProduct: (id: string) => Promise<{ success: boolean; error?: string }>;

    // Warehouses
    refreshWarehouses: () => Promise<void>;
    createWarehouse: (data: CreateWarehouseData) => Promise<{ success: boolean; error?: string; id?: string }>;
    updateWarehouse: (id: string, data: Partial<CreateWarehouseData>) => Promise<{ success: boolean; error?: string }>;
    deleteWarehouse: (id: string) => Promise<{ success: boolean; error?: string }>;

    // Stock Moves
    refreshStockMoves: () => Promise<void>;
    stockIn: (data: StockInData) => Promise<{ success: boolean; error?: string }>;
    stockOut: (data: StockOutData) => Promise<{ success: boolean; error?: string }>;
    adjustStock: (data: AdjustStockData) => Promise<{ success: boolean; error?: string }>;

    // Stock Info
    refreshProductStock: () => Promise<void>;
    getStock: (productId: string, warehouseId?: string) => Promise<ProductStock[]>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
    const { activeCompany } = useCompany();
    const [products, setProducts] = useState<Product[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [stockMoves, setStockMoves] = useState<StockMove[]>([]);
    const [productStock, setProductStock] = useState<ProductStock[]>([]);
    const [loading, setLoading] = useState(false);

    // ==================== PRODUCTS ====================
    const refreshProducts = useCallback(async () => {
        if (!activeCompany) {
            setProducts([]);
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('code');
            if (!error) setProducts((data || []) as Product[]);
        } finally {
            setLoading(false);
        }
    }, [activeCompany]);

    const createProduct = async (data: CreateProductData) => {
        if (!activeCompany) return { success: false, error: 'No hay empresa activa' };
        try {
            const { data: result, error } = await supabase
                .from('products')
                .insert({ company_id: activeCompany.id, ...data })
                .select('id')
                .single();
            if (error) return { success: false, error: error.message };
            await refreshProducts();
            return { success: true, id: result.id };
        } catch {
            return { success: false, error: 'Error al crear producto' };
        }
    };

    const updateProduct = async (id: string, data: Partial<CreateProductData>) => {
        try {
            const { error } = await supabase
                .from('products')
                .update({ ...data, updated_at: new Date().toISOString() })
                .eq('id', id);
            if (error) return { success: false, error: error.message };
            await refreshProducts();
            return { success: true };
        } catch {
            return { success: false, error: 'Error al actualizar' };
        }
    };

    const deleteProduct = async (id: string) => {
        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) return { success: false, error: error.message };
            await refreshProducts();
            return { success: true };
        } catch {
            return { success: false, error: 'Error al eliminar' };
        }
    };

    // ==================== WAREHOUSES ====================
    const refreshWarehouses = useCallback(async () => {
        if (!activeCompany) {
            setWarehouses([]);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('warehouses')
                .select('*')
                .order('code');
            if (!error) setWarehouses((data || []) as Warehouse[]);
        } catch { }
    }, [activeCompany]);

    const createWarehouse = async (data: CreateWarehouseData) => {
        if (!activeCompany) return { success: false, error: 'No hay empresa activa' };
        try {
            const { data: result, error } = await supabase
                .from('warehouses')
                .insert({ company_id: activeCompany.id, ...data })
                .select('id')
                .single();
            if (error) return { success: false, error: error.message };
            await refreshWarehouses();
            return { success: true, id: result.id };
        } catch {
            return { success: false, error: 'Error al crear almacén' };
        }
    };

    const updateWarehouse = async (id: string, data: Partial<CreateWarehouseData>) => {
        try {
            const { error } = await supabase.from('warehouses').update(data).eq('id', id);
            if (error) return { success: false, error: error.message };
            await refreshWarehouses();
            return { success: true };
        } catch {
            return { success: false, error: 'Error al actualizar' };
        }
    };

    const deleteWarehouse = async (id: string) => {
        try {
            const { error } = await supabase.from('warehouses').delete().eq('id', id);
            if (error) return { success: false, error: error.message };
            await refreshWarehouses();
            return { success: true };
        } catch {
            return { success: false, error: 'Error al eliminar' };
        }
    };

    // ==================== STOCK MOVES ====================
    const refreshStockMoves = useCallback(async () => {
        if (!activeCompany) {
            setStockMoves([]);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('stock_moves')
                .select(`
                    *,
                    product:products(code, name),
                    warehouse:warehouses(name)
                `)
                .order('created_at', { ascending: false })
                .limit(100);
            if (!error) setStockMoves((data || []) as StockMove[]);
        } catch { }
    }, [activeCompany]);

    const stockIn = async (data: StockInData) => {
        try {
            const { data: result, error } = await supabase.rpc('stock_in', {
                p_product_id: data.product_id,
                p_warehouse_id: data.warehouse_id,
                p_quantity: data.quantity,
                p_unit_cost: data.unit_cost,
                p_reference: data.reference || null,
                p_move_date: data.move_date || new Date().toISOString().split('T')[0]
            });
            if (error) return { success: false, error: error.message };
            if (result?.success) {
                await refreshStockMoves();
                await refreshProductStock();
                await refreshProducts();
                return { success: true };
            }
            return { success: false, error: result?.error || 'Error desconocido' };
        } catch {
            return { success: false, error: 'Error al registrar entrada' };
        }
    };

    const stockOut = async (data: StockOutData) => {
        try {
            const { data: result, error } = await supabase.rpc('stock_out', {
                p_product_id: data.product_id,
                p_warehouse_id: data.warehouse_id,
                p_quantity: data.quantity,
                p_reference: data.reference || null,
                p_move_date: data.move_date || new Date().toISOString().split('T')[0]
            });
            if (error) return { success: false, error: error.message };
            if (result?.success) {
                await refreshStockMoves();
                await refreshProductStock();
                return { success: true };
            }
            return { success: false, error: result?.error || 'Error desconocido' };
        } catch {
            return { success: false, error: 'Error al registrar salida' };
        }
    };

    const adjustStock = async (data: AdjustStockData) => {
        try {
            const { data: result, error } = await supabase.rpc('adjust_stock', {
                p_product_id: data.product_id,
                p_warehouse_id: data.warehouse_id,
                p_new_quantity: data.new_quantity,
                p_reason: data.reason
            });
            if (error) return { success: false, error: error.message };
            if (result?.success) {
                await refreshStockMoves();
                await refreshProductStock();
                return { success: true };
            }
            return { success: false, error: result?.error || 'Error desconocido' };
        } catch {
            return { success: false, error: 'Error al ajustar stock' };
        }
    };

    // ==================== STOCK INFO ====================
    const refreshProductStock = useCallback(async () => {
        if (!activeCompany) {
            setProductStock([]);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('product_stock')
                .select('*')
                .eq('company_id', activeCompany.id);
            if (!error) setProductStock((data || []) as ProductStock[]);
        } catch { }
    }, [activeCompany]);

    const getStock = async (productId: string, warehouseId?: string): Promise<ProductStock[]> => {
        try {
            const { data, error } = await supabase.rpc('get_stock', {
                p_product_id: productId,
                p_warehouse_id: warehouseId || null
            });
            if (error) return [];
            return (data || []) as ProductStock[];
        } catch {
            return [];
        }
    };

    const value: InventoryContextType = {
        products,
        warehouses,
        stockMoves,
        productStock,
        loading,
        refreshProducts,
        createProduct,
        updateProduct,
        deleteProduct,
        refreshWarehouses,
        createWarehouse,
        updateWarehouse,
        deleteWarehouse,
        refreshStockMoves,
        stockIn,
        stockOut,
        adjustStock,
        refreshProductStock,
        getStock
    };

    return (
        <InventoryContext.Provider value={value}>
            {children}
        </InventoryContext.Provider>
    );
}

export function useInventory() {
    const context = useContext(InventoryContext);
    if (context === undefined) {
        throw new Error('useInventory must be used within an InventoryProvider');
    }
    return context;
}
