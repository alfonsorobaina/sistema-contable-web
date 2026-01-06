import { useEffect, useState } from 'react';
import { useInventory, InventoryProvider } from '../context/InventoryContext';
import { useCompany } from '../context/CompanyContext';
import Products from '../components/inventory/Products';
import Warehouses from '../components/inventory/Warehouses';
import StockMoves from '../components/inventory/StockMoves';
import {
    Package,
    Warehouse as WarehouseIcon,
    ArrowLeftRight,
    ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

type Tab = 'products' | 'warehouses' | 'moves';

function InventoryContent() {
    const { activeCompany } = useCompany();
    const { refreshProducts, refreshWarehouses, refreshStockMoves, refreshProductStock } = useInventory();
    const [activeTab, setActiveTab] = useState<Tab>('products');

    useEffect(() => {
        if (activeCompany) {
            refreshProducts();
            refreshWarehouses();
            refreshStockMoves();
            refreshProductStock();
        }
    }, [activeCompany, refreshProducts, refreshWarehouses, refreshStockMoves, refreshProductStock]);

    if (!activeCompany) {
        return (
            <div className="text-center py-16">
                <Package size={48} className="mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-700">No hay empresa seleccionada</h2>
                <p className="text-gray-500 mt-2">Selecciona una empresa para acceder al inventario</p>
            </div>
        );
    }

    const tabs = [
        { id: 'products' as Tab, label: 'Productos', icon: Package },
        { id: 'warehouses' as Tab, label: 'Almacenes', icon: WarehouseIcon },
        { id: 'moves' as Tab, label: 'Movimientos', icon: ArrowLeftRight },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-2"
                    >
                        <ArrowLeft size={16} />
                        Volver al Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
                    <p className="text-gray-500">{activeCompany.name}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-100">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex-1 flex items-center justify-center gap-2 py-4 px-6 font-medium text-sm
                                    transition-all border-b-2
                                    ${activeTab === tab.id
                                        ? 'text-purple-600 border-purple-600 bg-purple-50/50'
                                        : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                                    }
                                `}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'products' && <Products />}
                    {activeTab === 'warehouses' && <Warehouses />}
                    {activeTab === 'moves' && <StockMoves />}
                </div>
            </div>
        </div>
    );
}

export default function Inventory() {
    return (
        <InventoryProvider>
            <InventoryContent />
        </InventoryProvider>
    );
}
