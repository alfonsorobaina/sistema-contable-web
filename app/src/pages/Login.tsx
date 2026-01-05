import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import {
    Mail,
    Lock,
    Loader2,
    ArrowRight,
    Shield,
    Zap,
    BarChart3,
    Building2,
    Users,
    FileText,
    CheckCircle,
    ChevronDown
} from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [showLogin, setShowLogin] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            navigate('/');
        }
    };

    const handleSignUp = async () => {
        if (!email || !password) {
            setError('Ingresa email y contraseña');
            return;
        }
        setLoading(true);
        setError(null);
        setMessage(null);

        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            setError(error.message);
        } else {
            setMessage("¡Cuenta creada! Revisa tu correo para confirmar.");
        }
        setLoading(false);
    };

    const features = [
        { icon: Building2, title: 'Multi-Empresa', desc: 'Gestiona múltiples empresas desde una sola cuenta' },
        { icon: FileText, title: 'Facturación', desc: 'Crea y envía facturas profesionales al instante' },
        { icon: BarChart3, title: 'Contabilidad', desc: 'Libro diario, mayor y estados financieros automáticos' },
        { icon: Users, title: 'Colaboración', desc: 'Invita a tu equipo con roles y permisos' },
        { icon: Shield, title: 'Seguridad', desc: 'Datos encriptados y respaldos automáticos' },
        { icon: Zap, title: 'Tiempo Real', desc: 'Sincronización instantánea en todos tus dispositivos' },
    ];

    const testimonials = [
        { name: 'María García', role: 'CEO, Comercial García', text: 'YOT transformó la forma en que manejamos nuestra contabilidad. Es increíblemente intuitivo.' },
        { name: 'Carlos Rodríguez', role: 'Contador, Servicios CR', text: 'Ahora puedo gestionar 20 empresas desde un solo lugar. El ahorro de tiempo es enorme.' },
        { name: 'Ana Martínez', role: 'Directora, PyME Solutions', text: 'Los reportes automáticos nos ayudan a tomar mejores decisiones de negocio.' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
                                <span className="text-white font-bold text-lg">Y</span>
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                Sistema YOT
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowLogin(true)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                            >
                                Iniciar Sesión
                            </button>
                            <button
                                onClick={() => setShowLogin(true)}
                                className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 transition-all"
                            >
                                Comenzar Gratis
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-100 text-teal-700 text-sm font-medium mb-6">
                                <Zap size={16} />
                                Nuevo: Facturación Electrónica
                            </div>
                            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                                Gestiona tu empresa{' '}
                                <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                                    de forma inteligente
                                </span>
                            </h1>
                            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                                Sistema administrativo y contable diseñado para PyMEs.
                                Simple, potente y siempre disponible en la nube.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 mb-12">
                                <button
                                    onClick={() => setShowLogin(true)}
                                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold text-lg shadow-2xl shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-105 transition-all flex items-center justify-center gap-2"
                                >
                                    Comenzar Gratis
                                    <ArrowRight size={20} />
                                </button>
                                <button className="px-8 py-4 rounded-2xl border-2 border-gray-200 text-gray-700 font-semibold text-lg hover:border-teal-300 hover:bg-teal-50 transition-all">
                                    Ver Demo
                                </button>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex -space-x-3">
                                    {['bg-amber-400', 'bg-rose-400', 'bg-violet-400', 'bg-emerald-400', 'bg-sky-400'].map((color, i) => (
                                        <div key={i} className={`w-10 h-10 rounded-full ${color} border-3 border-white flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">+500 empresas</p>
                                    <p className="text-sm text-gray-500">confían en YOT</p>
                                </div>
                            </div>
                        </div>

                        {/* Dashboard Preview */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-3xl blur-3xl opacity-20 transform rotate-6"></div>
                            <div className="relative bg-white rounded-3xl shadow-2xl p-6 border border-gray-100">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-8 bg-gradient-to-r from-teal-100 to-cyan-100 rounded-lg w-3/4"></div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="h-20 bg-gray-50 rounded-xl p-3">
                                                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                                                <div className="h-6 bg-gradient-to-r from-teal-200 to-cyan-200 rounded w-1/2"></div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="h-32 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="flex justify-center mt-16">
                    <button
                        onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                        className="flex flex-col items-center gap-2 text-gray-400 hover:text-teal-500 transition-colors"
                    >
                        <span className="text-sm">Descubre más</span>
                        <ChevronDown size={24} className="animate-bounce" />
                    </button>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 px-4 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Todo lo que necesitas para{' '}
                            <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                                triunfar
                            </span>
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Herramientas poderosas diseñadas para simplificar la gestión de tu negocio
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={index}
                                    className="group p-8 rounded-3xl bg-gray-50 hover:bg-gradient-to-br hover:from-teal-500 hover:to-cyan-500 transition-all duration-500 cursor-pointer"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center mb-6 group-hover:shadow-xl transition-shadow">
                                        <Icon size={28} className="text-teal-500 group-hover:text-teal-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-white mb-3 transition-colors">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-600 group-hover:text-teal-100 transition-colors">
                                        {feature.desc}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 px-4 bg-gradient-to-br from-gray-900 to-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            Lo que dicen nuestros clientes
                        </h2>
                        <p className="text-xl text-gray-400">
                            Empresas reales, resultados reales
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={index}
                                className="p-8 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all"
                            >
                                <div className="flex items-center gap-1 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <p className="text-gray-300 mb-6 leading-relaxed">
                                    "{testimonial.text}"
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center text-white font-bold">
                                        {testimonial.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold">{testimonial.name}</p>
                                        <p className="text-gray-400 text-sm">{testimonial.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section className="py-24 px-4 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Planes simples y transparentes
                        </h2>
                        <p className="text-xl text-gray-600">
                            Comienza gratis, escala cuando lo necesites
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {/* Free Plan */}
                        <div className="p-8 rounded-3xl border-2 border-gray-200 hover:border-teal-300 transition-colors">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Starter</h3>
                            <p className="text-gray-500 mb-6">Para emprendedores</p>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-gray-900">$0</span>
                                <span className="text-gray-500">/mes</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                {['1 empresa', '100 facturas/mes', 'Reportes básicos', 'Soporte por email'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-gray-600">
                                        <CheckCircle size={18} className="text-teal-500" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => setShowLogin(true)}
                                className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:border-teal-400 hover:text-teal-600 transition-all"
                            >
                                Comenzar Gratis
                            </button>
                        </div>

                        {/* Pro Plan */}
                        <div className="p-8 rounded-3xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white relative transform scale-105 shadow-2xl shadow-teal-500/30">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-amber-900 text-sm font-bold rounded-full">
                                Más Popular
                            </div>
                            <h3 className="text-xl font-bold mb-2">Profesional</h3>
                            <p className="text-teal-100 mb-6">Para PyMEs en crecimiento</p>
                            <div className="mb-6">
                                <span className="text-4xl font-bold">$29</span>
                                <span className="text-teal-100">/mes</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                {['5 empresas', 'Facturas ilimitadas', 'Reportes avanzados', 'Usuarios ilimitados', 'Soporte prioritario'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <CheckCircle size={18} />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => setShowLogin(true)}
                                className="w-full py-3 rounded-xl bg-white text-teal-600 font-semibold hover:bg-teal-50 transition-colors"
                            >
                                Probar 14 días gratis
                            </button>
                        </div>

                        {/* Enterprise */}
                        <div className="p-8 rounded-3xl border-2 border-gray-200 hover:border-teal-300 transition-colors">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
                            <p className="text-gray-500 mb-6">Para grandes empresas</p>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-gray-900">$99</span>
                                <span className="text-gray-500">/mes</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                {['Empresas ilimitadas', 'API completa', 'Integraciones custom', 'Gerente de cuenta', 'SLA garantizado'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-gray-600">
                                        <CheckCircle size={18} className="text-teal-500" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <button className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:border-teal-400 hover:text-teal-600 transition-all">
                                Contactar Ventas
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-4 bg-gradient-to-r from-teal-500 to-cyan-500">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        ¿Listo para transformar tu negocio?
                    </h2>
                    <p className="text-xl text-teal-100 mb-8">
                        Únete a más de 500 empresas que ya confían en YOT
                    </p>
                    <button
                        onClick={() => setShowLogin(true)}
                        className="px-10 py-4 rounded-2xl bg-white text-teal-600 font-bold text-lg shadow-2xl hover:shadow-white/30 hover:scale-105 transition-all"
                    >
                        Comenzar Ahora — Es Gratis
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 bg-gray-900">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                                <span className="text-white font-bold">Y</span>
                            </div>
                            <span className="text-white font-bold">Sistema YOT</span>
                        </div>
                        <p className="text-gray-500 text-sm">
                            © 2026 Sistema YOT. Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            </footer>

            {/* Login Modal */}
            {showLogin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowLogin(false)}
                    />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95">
                        <button
                            onClick={() => setShowLogin(false)}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                        >
                            ×
                        </button>

                        <div className="text-center mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/30">
                                <span className="text-white font-bold text-2xl">Y</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                Bienvenido a YOT
                            </h2>
                            <p className="text-gray-500 mt-1">
                                Ingresa tus credenciales para continuar
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        {message && (
                            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-sm">
                                {message}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Correo Electrónico
                                </label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10 outline-none transition-all"
                                        placeholder="tu@email.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-400" />
                                    <span className="text-gray-600">Recordarme</span>
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="text-teal-600 hover:text-teal-700 font-medium"
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Ingresando...
                                    </>
                                ) : (
                                    <>
                                        Iniciar Sesión
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                            <p className="text-sm text-gray-500 mb-2">
                                ¿Primera vez aquí?
                            </p>
                            <button
                                type="button"
                                onClick={handleSignUp}
                                disabled={loading}
                                className="text-teal-600 hover:text-teal-700 font-semibold disabled:opacity-50"
                            >
                                Crear cuenta con este correo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
