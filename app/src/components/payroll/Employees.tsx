import { useState } from 'react';
import { usePayroll } from '../../context/PayrollContext';
import { RISK_LEVELS } from '../../types/payroll';
import type { Employee, CreateEmployeeData } from '../../types/payroll';
import {
    Users,
    Plus,
    Search,
    Edit2,
    Trash2,
    Loader2,
    X,
    Check,
    UserCircle,
    Building2,
    CreditCard
} from 'lucide-react';

export default function Employees() {
    const { employees, loading, createEmployee, refreshEmployees } = usePayroll();
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

    const filteredEmployees = employees.filter(e =>
        e.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.document_id.includes(searchQuery)
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="font-semibold text-gray-800">Empleados</h3>
                    <p className="text-sm text-gray-500">{employees.length} registrados</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar empleado..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none text-sm"
                        />
                    </div>
                    <button
                        onClick={() => { setEditingEmployee(null); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-medium shadow-lg shadow-teal-500/25"
                    >
                        <Plus size={16} />
                        Nuevo
                    </button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    <div className="col-span-full p-8 text-center"><Loader2 className="mx-auto animate-spin" /></div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="col-span-full p-8 text-center text-gray-500">No hay empleados</div>
                ) : (
                    filteredEmployees.map(emp => (
                        <div key={emp.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
                                        {emp.first_name[0]}{emp.last_name[0]}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{emp.first_name} {emp.last_name}</p>
                                        <p className="text-xs text-gray-500">{emp.document_id}</p>
                                    </div>
                                </div>
                                <button onClick={() => { setEditingEmployee(emp); setShowModal(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg">
                                    <Edit2 size={16} className="text-gray-400" />
                                </button>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex justify-between">
                                    <span>Cargo:</span>
                                    <span className="font-medium">{emp.position || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Salario Base:</span>
                                    <span className="font-medium text-emerald-600">${emp.base_salary.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Riesgo IVSS:</span>
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                                        {RISK_LEVELS.find(r => r.value === emp.risk_level)?.label}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Estado:</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${emp.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {emp.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <EmployeeFormModal
                    employee={editingEmployee}
                    onClose={() => setShowModal(false)}
                    onSave={async (data) => {
                        // Logic handled inside
                        return createEmployee(data); // Simple version
                    }}
                />
            )}
        </div>
    );
}

function EmployeeFormModal({ employee, onClose, onSave }: any) {
    // Simplified form for brevity, includes necessary fields
    const { createEmployee, updateEmployee } = usePayroll();
    const [formData, setFormData] = useState<CreateEmployeeData>({
        first_name: employee?.first_name || '',
        last_name: employee?.last_name || '',
        document_id: employee?.document_id || '',
        email: employee?.email || '',
        hire_date: employee?.hire_date || new Date().toISOString().split('T')[0],
        position: employee?.position || '',
        base_salary: employee?.base_salary || 0,
        risk_level: employee?.risk_level || 'minimum',
        payment_method: employee?.payment_method || 'transfer',
        status: employee?.status || 'active'
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        let res;
        if (employee) {
            res = await updateEmployee(employee.id, formData);
        } else {
            res = await createEmployee(formData);
        }
        setLoading(false);
        if (res.success) onClose();
        else alert(res.error);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <h2 className="text-xl font-bold mb-4">{employee ? 'Editar Empleado' : 'Nuevo Empleado'}</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Nombres</label>
                            <input required className="w-full border rounded-lg p-2" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Apellidos</label>
                            <input required className="w-full border rounded-lg p-2" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Cédula</label>
                            <input required className="w-full border rounded-lg p-2" value={formData.document_id} onChange={e => setFormData({ ...formData, document_id: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input type="email" className="w-full border rounded-lg p-2" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Cargo</label>
                            <input className="w-full border rounded-lg p-2" value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Fecha Ingreso</label>
                            <input type="date" required className="w-full border rounded-lg p-2" value={formData.hire_date} onChange={e => setFormData({ ...formData, hire_date: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Salario Base (Mensual)</label>
                            <input type="number" required className="w-full border rounded-lg p-2" value={formData.base_salary} onChange={e => setFormData({ ...formData, base_salary: parseFloat(e.target.value) })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Riesgo IVSS</label>
                            <select className="w-full border rounded-lg p-2" value={formData.risk_level} onChange={e => setFormData({ ...formData, risk_level: e.target.value as any })}>
                                {RISK_LEVELS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-4 justify-end">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-teal-600 text-white rounded-lg">{loading ? 'Guardando...' : 'Guardar'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
