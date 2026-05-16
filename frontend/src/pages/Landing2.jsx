import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    MapPin,
    Utensils,
    Calendar,
    CreditCard,
    Truck,
    CheckCircle,
    Check,
    Share2,
    MessageCircle,
    Phone,
    Mail,
    Menu,
    X,
    ArrowRight,
    ArrowLeft,
    Shield,
    Upload,
    AlertCircle,
    Smartphone,
    CheckCircle2,
    User,
    Heart,
    Download
} from 'lucide-react';
import api from '../services/api';
import * as turf from '@turf/turf';

// ─── Button ──────────────────────────────────────────────────────────────────

function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
    const base =
        'inline-flex items-center justify-center rounded-lg transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-arcilla text-crema hover:bg-arcilla/90 focus:ring-arcilla disabled:bg-arcilla/50',
        secondary: 'bg-secundario text-carbon hover:bg-arena focus:ring-secundario disabled:opacity-50',
        outline:
            'border-2 border-arcilla text-arcilla hover:bg-arcilla hover:text-crema focus:ring-arcilla disabled:opacity-30',
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3',
        lg: 'px-8 py-4 text-lg',
    };

    return (
        <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
            {children}
        </button>
    );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar(props) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (sectionId) => {
        const section = document.getElementById(sectionId);
        section?.scrollIntoView({ behavior: 'smooth' });
        setIsMobileMenuOpen(false);
    };

    const navLinks = [
        { label: 'Inicio', id: 'hero' },
        { label: 'Cómo Funciona', id: 'como-funciona' },
        { label: 'Menú', id: 'menu' },
        { label: 'Planes', id: 'planes' },
    ];

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                    ? 'bg-crema/95 backdrop-blur-md shadow-lg border-b border-carbon/10'
                    : 'bg-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 sm:h-20">
                    <a href="#" className="flex items-center gap-3 no-underline group">
                        {/* Image - Hidden on Mobile, visible from LG */}
                        <div className="relative hidden lg:block">
                            <img
                                src="/logoLaCoca.svg"
                                alt="Logo"
                                className="object-contain rounded-full border-2 border-white shadow-xl group-hover:scale-105 transition-transform duration-500 h-16 w-16"
                            />
                            <div className="absolute -inset-1 bg-white/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        {/* Title - Always visible */}
                        <div className="flex flex-col">
                            <span className={`text-arcilla font-bold leading-[0.7] tracking-tight transition-all ${isScrolled ? 'text-xl md:text-3xl' : 'text-2xl md:text-3xl'}`} style={{ fontFamily: 'Fredoka, sans-serif' }}>
                                La Coca
                            </span>
                            <span className={`text-arcilla self-end transition-all ${isScrolled ? 'text-sm md:text-2xl' : 'text-xl md:text-2xl'}`} style={{ fontFamily: 'Alex Brush, cursive' }}>
                                de Jacks
                            </span>
                        </div>
                    </a>

                    {/* Desktop Nav */}
                    <div className="hidden lg:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <button
                                key={link.id}
                                onClick={() => scrollToSection(link.id)}
                                className={`text-sm font-medium transition-colors hover:text-arcilla ${isScrolled ? 'text-carbon/80' : 'text-carbon/90'
                                    }`}
                            >
                                {link.label}
                            </button>
                        ))}
                    </div>

                    {/* Desktop CTAs */}
                    <div className="hidden lg:flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            className={
                                isScrolled
                                    ? 'border-arcilla text-arcilla'
                                    : 'border-arcilla text-arcilla hover:bg-arcilla hover:text-crema'
                            }
                        >
                            Ingresar
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => props.onOpenWizard?.()}>
                            Reservar
                        </Button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className={`lg:hidden p-2 rounded-lg transition-colors ${isScrolled
                                ? 'text-carbon hover:bg-arena/20'
                                : 'text-carbon hover:bg-carbon/10'
                            }`}
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden border-t border-carbon/10 bg-crema/95 backdrop-blur-md">
                        <div className="px-4 py-6 space-y-4">
                            {navLinks.map((link) => (
                                <button
                                    key={link.id}
                                    onClick={() => scrollToSection(link.id)}
                                    className="block w-full text-left py-2 text-base font-medium text-[#030213]/80 hover:text-[#030213] transition-colors"
                                >
                                    {link.label}
                                </button>
                            ))}
                            <div className="pt-4 space-y-3 border-t border-carbon/10">
                                <Button variant="outline" className="w-full" size="md">
                                    Ingresar
                                </Button>
                                <Button variant="primary" className="w-full" size="md" onClick={() => props.onOpenWizard?.()}>
                                    Reservar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero(props) {
    const handleVerPlanes = () => {
        document.getElementById('planes')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section
            id="hero"
            className="relative overflow-hidden bg-crema text-carbon pt-16 sm:pt-20"
        >
            {/* Subtle pattern overlay */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage:
                        "url(\"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTZ6TTI0IDQyYzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNnoiIGZpbGw9IiNDNDU4MUYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvZz48L3N2Zz4=\")",
                }}
            />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-28">
                <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
                    <div className="space-y-6 sm:space-y-8">
                        <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-arcilla/5 backdrop-blur-sm border border-arcilla/10">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-arcilla" />
                            <span className="text-xs sm:text-sm font-medium">Servicio en Medellín</span>
                        </div>

                        <div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-3 sm:mb-4 leading-tight font-serif font-medium tracking-tight text-carbon">
                                Almuerzos deliciosos, directo a tu oficina
                            </h1>
                            <p className="text-base sm:text-lg lg:text-xl text-atenuado max-w-xl">
                                Olvídate de cocinar o salir a buscar almuerzo. Recibe cocas caseras de alta calidad
                                todos los días laborales.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-lg shadow-arcilla/20" onClick={() => props.onOpenWizard?.()}>
                                Reservar Ahora
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={handleVerPlanes}
                                className="w-full sm:w-auto"
                            >
                                Ver Planes
                            </Button>
                        </div>

                        <div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-6 sm:pt-8 border-t border-arcilla/10">
                                <div className="flex items-center gap-2 text-atenuado">
                                    <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-arcilla" />
                                    <span className="text-xs sm:text-sm">Comida Casera</span>
                                </div>
                                <div className="flex items-center gap-2 text-atenuado">
                                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-arcilla" />
                                    <span className="text-xs sm:text-sm">Entrega Diaria</span>
                                </div>
                                <div className="flex items-center gap-2 text-atenuado">
                                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-arcilla" />
                                    <span className="text-xs sm:text-sm">Medellin, Colombia</span>
                                </div>
                            </div>
                            
                            <button 
                                className="group flex sm:hidden items-center justify-between w-full mt-6 py-3.5 px-5 rounded-2xl bg-white border border-carbon/5 shadow-sm text-carbon font-medium text-sm transition-all active:scale-[0.98]" 
                                onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
                            >
                                <span className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-arcilla/10 flex items-center justify-center">
                                        <Utensils className="w-3.5 h-3.5 text-arcilla" />
                                    </div>
                                    Explorar Menú Semanal
                                </span>
                                <ArrowRight className="w-4 h-4 text-arcilla group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    <div className="relative hidden md:block">
                        <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                            <img
                                src="/la_coca_hero_1778889326328.png"
                                alt="La Coca de Jack's"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-arena/30 rounded-full blur-3xl -z-10" />
                        <div className="absolute -top-10 -left-10 w-64 h-64 bg-arcilla/10 rounded-full blur-3xl -z-10" />
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─── HowItWorks ───────────────────────────────────────────────────────────────

const steps = [
    {
        icon: Calendar,
        title: 'Elige tu Plan',
        description:
            'Escoge el plan que mejor se ajuste a tus necesidades y preferencias.',
    },
    {
        icon: CreditCard,
        title: 'Realiza tu Pago',
        description:
            'Paga fácilmente por Bancolombia o transferencia. Sube tu comprobante y recibe confirmación automática por WhatsApp.',
    },
    {
        icon: Truck,
        title: 'Recibe tu Coca',
        description:
            'Todos los días recibirás tu almuerzo fresco y delicioso directamente en tu oficina u hogar.',
    },
    {
        icon: CheckCircle,
        title: 'Disfruta',
        description:
            'Menús variados cada semana, preparados con ingredientes frescos y ese toque casero que te encanta.',
    },
];

function HowItWorks() {
    return (
        <section id="como-funciona" className="py-12 sm:py-16 md:py-20 bg-apagado">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10 sm:mb-12 md:mb-16">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl mb-3 sm:mb-4 font-serif font-medium tracking-tight">
                        ¿Cómo Funciona?
                    </h2>
                    <p className="text-base sm:text-lg text-atenuado max-w-2xl mx-auto px-4">
                        Un proceso simple y profesional para que tengas tu almuerzo sin complicaciones
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        return (
                            <div key={index} className="relative">
                                <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
                                    <div className="relative">
                                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-arcilla/10 flex items-center justify-center">
                                            <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-arcilla" />
                                        </div>
                                        <div className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-arcilla text-crema flex items-center justify-center text-xs sm:text-sm font-semibold">
                                            {index + 1}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg sm:text-xl font-serif font-medium tracking-tight">
                                            {step.title}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-[#717182] leading-relaxed px-2">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>

                                {index < steps.length - 1 && (
                                    <div className="hidden lg:block absolute top-7 sm:top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-[#030213]/30 to-transparent" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

// ─── WeeklyMenu ───────────────────────────────────────────────────────────────

function WeeklyMenu() {
    return (
        <section id="menu" className="py-12 sm:py-16 md:py-20 bg-crema">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8 sm:mb-10 md:mb-12">
                    <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-arcilla/10 text-arcilla mb-3 sm:mb-4">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        <span className="text-xs sm:text-sm font-medium">Actualizado Semanalmente</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl mb-3 sm:mb-4 font-serif font-medium tracking-tight px-4">
                        Menú de la Semana
                    </h2>
                    <p className="text-base sm:text-lg text-atenuado max-w-2xl mx-auto px-4">
                        Cada semana preparamos opciones deliciosas y variadas para que disfrutes almuerzos
                        diferentes todos los días
                    </p>
                </div>

                <div className="max-w-4xl mx-auto">
                    <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-xl border-2 sm:border-4 border-borde bg-crema">
                        {/* Placeholder when no image is available */}
                        <div className="w-full h-64 sm:h-80 md:h-96 bg-apagado flex items-center justify-center">
                            <div className="text-center text-atenuado">
                                <Utensils className="w-16 h-16 mx-auto mb-3 opacity-20" />
                                <p className="text-sm font-medium">Menú Semanal</p>
                                <p className="text-xs opacity-70">La Coca de Jack's</p>
                            </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end">
                            <div className="p-4 sm:p-6 text-white">
                                <p className="text-xs sm:text-sm opacity-90">
                                    Menú sujeto a disponibilidad de ingredientes frescos
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-apagado rounded-xl">
                        <div className="flex items-start gap-2 sm:gap-3">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-arcilla mt-1.5 sm:mt-2 flex-shrink-0" />
                            <p className="text-xs sm:text-sm text-atenuado leading-relaxed">
                                <strong className="text-carbon">Nota:</strong> El menú se actualiza cada miercoles para la semana siguiente. Todos nuestros platos incluyen proteína, carbohidrato, sopa,
                                ensalada y jugo natural.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

const plans = [
    {
        name: 'Semanal',
        description: 'Para quienes prefieren libertad',
        price: '18.000',
        period: 'semana (5 cocas)',
        features: [
            'Una semana de 5 cocas',
            'Sin compromisos semanales',
            'Menú completo',
            'Entrega a todo medellin',
            'Confirmación por WhatsApp',
        ],
        highlighted: false,
    },
    {
        name: 'Quincenal',
        description: 'El favorito de nuestros clientes',
        price: '80.000',
        period: 'quincenal (10 cocas)',
        features: [
            '10 cocas quincenales',
            'Ahorra $10.000/quincena',
            'Menú completo diario',
            'Entrega garantizada',
            'Confirmación por WhatsApp',
            'Prioridad en pedidos',
        ],
        highlighted: true,
    },
    {
        name: 'Mensual',
        description: 'Máximo ahorro',
        price: '300.000',
        period: 'mes (20 cocas)',
        features: [
            '20 cocas al mes',
            'Ahorra $60.000/mes',
            'Menú completo diario',
            'Entrega garantizada',
            'Confirmación por WhatsApp',
            'Prioridad VIP',
            'Entregas híbridas, según día',
        ],
        highlighted: false,
    },
];

function Pricing(props) {
    const [activePlan, setActivePlan] = useState(0);

    const handleScroll = (e) => {
        const container = e.target;
        const scrollPosition = container.scrollLeft;
        const cardWidth = container.offsetWidth * 0.85; // matching w-[85vw]
        const index = Math.round(scrollPosition / cardWidth);
        if (index !== activePlan && index < plans.length) {
            setActivePlan(index);
        }
    };

    return (
        <section id="planes" className="py-12 sm:py-16 md:py-20 bg-apagado">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10 sm:mb-12 md:mb-16">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl mb-3 sm:mb-4 font-serif font-medium tracking-tight px-4 text-carbon">
                        Planes y Precios
                    </h2>
                    <p className="text-base sm:text-lg text-atenuado max-w-2xl mx-auto px-4">
                        Elige el plan que mejor se adapte a tu rutina y presupuesto
                    </p>
                </div>

                <div
                    onScroll={handleScroll}
                    className="flex items-stretch lg:grid lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto overflow-x-auto py-12 lg:py-16 snap-x snap-mandatory no-scrollbar px-4 lg:px-0"
                >
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`relative flex-shrink-0 w-[85vw] sm:w-[350px] lg:w-auto snap-center rounded-xl sm:rounded-2xl p-6 sm:p-8 flex flex-col transition-all duration-300 ${plan.highlighted
                                    ? 'bg-arcilla text-crema shadow-2xl md:scale-105 border-2 sm:border-4 border-arcilla'
                                    : 'bg-crema border-2 border-borde hover:border-arcilla/50 hover:shadow-lg'
                                }`}
                        >
                            {plan.highlighted && (
                                <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-0.5 sm:py-1 bg-acento text-carbon rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
                                    Más Popular
                                </div>
                            )}

                            <div className="space-y-4 sm:space-y-6">
                                <div>
                                    <h3
                                        className={`text-xl sm:text-2xl mb-2 font-serif font-medium tracking-tight ${plan.highlighted ? 'text-crema' : 'text-carbon'
                                            }`}
                                    >
                                        {plan.name}
                                    </h3>
                                    <p
                                        className={`text-xs sm:text-sm ${plan.highlighted ? 'text-crema/80' : 'text-atenuado'
                                            }`}
                                    >
                                        {plan.description}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-3xl sm:text-4xl font-semibold">${plan.price}</span>
                                    <p
                                        className={`text-xs sm:text-sm mt-1 ${plan.highlighted ? 'text-crema/80' : 'text-atenuado'
                                            }`}
                                    >
                                        {plan.period}
                                    </p>
                                </div>

                                <Button
                                    variant={plan.highlighted ? 'secondary' : 'outline'}
                                    className="w-full"
                                    size="lg"
                                    onClick={() => props.onOpenWizard?.(plan.name.toLowerCase())}
                                >
                                    Seleccionar Plan
                                </Button>

                                <div className="space-y-2 sm:space-y-3 pt-4 sm:pt-6 border-t border-current/20">
                                    {plan.features.map((feature, featureIndex) => (
                                        <div key={featureIndex} className="flex items-start gap-2 sm:gap-3">
                                            <Check
                                                className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 ${plan.highlighted ? 'text-crema' : 'text-arcilla'
                                                    }`}
                                            />
                                            <span
                                                className={`text-xs sm:text-sm ${plan.highlighted ? 'text-crema/90' : 'text-carbon/90'
                                                    }`}
                                            >
                                                {feature}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 sm:mt-12 text-center px-4">
                    {/* Mobile Scroll Indicators */}
                    <div className="flex justify-center gap-2 mb-6 lg:hidden">
                        {plans.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-300 ${activePlan === i ? 'w-6 bg-arcilla' : 'w-1.5 bg-arcilla/20'
                                    }`}
                            />
                        ))}
                    </div>

                    <div className="flex items-center justify-center gap-2 text-atenuado mb-4 lg:hidden animate-pulse">
                        <span className="text-xs font-medium uppercase tracking-wider">Desliza para ver planes</span>
                        <div className="flex gap-1">
                            <div className="w-1 h-1 rounded-full bg-arcilla" />
                            <div className="w-1 h-1 rounded-full bg-arcilla opacity-60" />
                            <div className="w-1 h-1 rounded-full bg-arcilla opacity-30" />
                        </div>
                    </div>

                    <p className="text-xs sm:text-sm text-atenuado">
                        Todos los planes incluyen menú completo con proteína, carbohidrato, ensalada y jugo
                        natural
                    </p>
                </div>
            </div>
        </section>
    );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
    return (
        <footer className="bg-carbon text-crema">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
                    <div className="space-y-3 sm:space-y-4">
                        <h3 className="text-lg sm:text-xl font-semibold font-serif">La Coca de Jack's</h3>
                        <p className="text-xs sm:text-sm text-crema/80">
                            Almuerzos caseros de calidad, directo a tu oficina en El Poblado.
                        </p>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                        <h4 className="font-medium font-serif">Contacto</h4>
                        <div className="space-y-2 text-xs sm:text-sm text-crema/80">
                            <a
                                href="tel:+573001234567"
                                className="flex items-center gap-2 hover:text-crema transition-colors"
                            >
                                <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>+57 300 123 4567</span>
                            </a>
                            <a
                                href="mailto:hola@lacocadejacks.com"
                                className="flex items-center gap-2 hover:text-crema transition-colors"
                            >
                                <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>hola@lacocadejacks.com</span>
                            </a>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>Medellín, Colombia</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                        <h4 className="font-medium font-serif">Horarios</h4>
                        <div className="space-y-2 text-xs sm:text-sm text-crema/80">
                            <p>Lunes a Viernes</p>
                            <p className="font-medium text-crema">11:30 AM - 1:30 PM</p>
                            <p className="text-xs mt-2">*Entregas en horario de almuerzo</p>
                        </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                        <h4 className="font-medium font-serif">Síguenos</h4>
                        <div className="flex gap-4">
                            <a
                                href="https://instagram.com/lacocadejacks"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-crema/10 hover:bg-crema/20 flex items-center justify-center transition-colors"
                            >
                                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </a>
                            <a
                                href="https://facebook.com/lacocadejacks"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-crema/10 hover:bg-crema/20 flex items-center justify-center transition-colors"
                            >
                                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-crema/20 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-crema/60">
                    <p>&copy; {new Date().getFullYear()} La Coca de Jack's. Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>
    );
}

// ─── LandingPage ──────────────────────────────────────────────────────────────

export default function LandingPage() {
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('quincenal');

    const openWizard = (planId) => {
        if (planId) setSelectedPlan(planId);
        setIsWizardOpen(true);
    };

    return (
        <>
            <Navbar onOpenWizard={openWizard} />
            <Hero onOpenWizard={openWizard} />
            <HowItWorks />
            <WeeklyMenu />
            <Pricing onOpenWizard={openWizard} />
            <Footer />
            <RegistrationWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                initialPlan={selectedPlan}
            />
        </>
    );
}



// ─── RegistrationWizard ────────────────────────────────────────────────────────
/**
 * @name RegistrationWizard
 * @description A multi-step modal for new user registration with coverage check.
 */
function RegistrationWizard({ isOpen, onClose, initialPlan = 'quincenal' }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [coberturaData, setCoberturaData] = useState(null);
    const [isQrExpanded, setIsQrExpanded] = useState(false);
    const fileInputRef = useRef(null);

    // Form State
    const [formData, setFormData] = useState({
        plan: initialPlan,
        fecha_inicio: '',
        tieneCocas: false,
        nombre: '',
        whatsapp: '',
        email: '',
        cedula: '',
        tipoEntrega: 'fija',
        direccion1: '',
        barrio1: '',
        direccion2: '',
        barrio2: '',
        metodoPago: 'bancolombia',
        comprobante: null,
        comprobanteName: '',
    });

    const [availability, setAvailability] = useState([]);
    const [coverageStatus1, setCoverageStatus1] = useState({ status: 'pending', zone: null });
    const [coverageStatus2, setCoverageStatus2] = useState({ status: 'pending', zone: null });

    const planOptions = {
        semanal: { name: 'Semanal', price: 75000, displayPrice: '75.000', label: '5 Cocas' },
        quincenal: { name: 'Quincenal', price: 150000, displayPrice: '150.000', label: '10 Cocas' },
        mensual: { name: 'Mensual', price: 285000, displayPrice: '285.000', label: '20 Cocas' },
    };

    const calculateTotal = () => {
        const p = planOptions[formData.plan]?.price || 0;
        const kit = formData.tieneCocas ? 0 : 70000;
        return p + kit;
    };

    useEffect(() => {
        if (!isOpen) return;
        const fetchData = async () => {
            try {
                const [availRes, cobRes] = await Promise.all([
                    api.get('/availability'),
                    api.get('/cobertura')
                ]);
                if (availRes.data?.success) {
                    setAvailability(availRes.data.availability);
                    const first = availRes.data.availability.find(a => a.disponible);
                    if (first && !formData.fecha_inicio) setFormData(v => ({ ...v, fecha_inicio: first.fecha }));
                }
                if (cobRes.data) setCoberturaData(cobRes.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
        setStep(1);
    }, [isOpen]);

    useEffect(() => {
        setFormData(prev => ({ ...prev, plan: initialPlan }));
    }, [initialPlan]);

    const checkCoverage = async (address, barrio, setStatus) => {
        if (!address || address.length < 5 || !coberturaData) return;
        setStatus({ status: 'loading', zone: null });
        const query = `${address.replace(/[#-]/g, ' ')}, ${barrio}, Medellín, Colombia`;
        try {
            const res = await api.get('/geocode', { params: { q: query } });
            if (res.data?.[0]) {
                const { lat, lon } = res.data[0];
                const pt = turf.point([parseFloat(lon), parseFloat(lat)]);
                const zone = coberturaData.features.find(f => turf.booleanPointInPolygon(pt, f));
                setStatus(zone ? { status: 'ok', zone: zone.properties.name } : { status: 'no_coverage', zone: null });
            } else {
                setStatus({ status: 'not_found', zone: null });
            }
        } catch (err) {
            setStatus({ status: 'error', zone: null });
        }
    };

    const handleNext = () => setStep(s => Math.min(s + 1, 4));
    const handleBack = () => setStep(s => Math.max(s - 1, 1));

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const data = new FormData();
            const payload = {
                nombre: formData.nombre,
                cedula: formData.cedula,
                email: formData.email,
                celular: formData.whatsapp,
                plan: formData.plan.charAt(0).toUpperCase() + formData.plan.slice(1),
                needs_cocas: !formData.tieneCocas,
                delivery_type: formData.tipoEntrega === 'fija' ? 'Fija' : 'Hibrida',
                address_1: formData.direccion1,
                barrio_1: formData.barrio1,
                fecha_inicio: formData.fecha_inicio,
            };
            if (formData.tipoEntrega === 'hibrida') {
                payload.address_2 = formData.direccion2;
                payload.barrio_2 = formData.barrio2;
            }
            Object.entries(payload).forEach(([k, v]) => data.append(k, v));
            if (formData.comprobante) data.append('comprobante', formData.comprobante);
            const res = await api.post('/orders', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (res.data.success) {
                alert("¡Reserva exitosa! Te contactaremos pronto.");
                onClose();
            }
        } catch (err) {
            alert("Error al procesar reserva");
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { title: 'Plan', desc: 'Configura tu suscripción y fecha de inicio' },
        { title: 'Datos', desc: 'Información básica para tu cuenta' },
        { title: 'Entrega', desc: '¿A dónde llevamos tus almuerzos?' },
        { title: 'Pago', desc: 'Confirma tu pedido con el comprobante' }
    ];

    const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isPhoneValid = (phone) => phone.length === 10;

    const canAdvance = () => {
        if (step === 1) return formData.plan && formData.fecha_inicio;
        if (step === 2) return formData.nombre.length > 3 && isPhoneValid(formData.whatsapp) && isEmailValid(formData.email) && formData.cedula.length > 5;
        if (step === 3) {
            const base = formData.direccion1.length > 5 && formData.barrio1.length > 2 && coverageStatus1.status === 'ok';
            if (formData.tipoEntrega === 'hibrida') return base && formData.direccion2.length > 5 && formData.barrio2.length > 2 && coverageStatus2.status === 'ok';
            return base;
        }
        if (step === 4) return !!formData.comprobante;
        return false;
    };

    const Label = ({ children, required, valid }) => (
        <label className="text-[11px] font-black text-carbon uppercase tracking-wider flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5">
                {children} {required && <span className="text-arcilla">*</span>}
            </span>
            {valid ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-exito animate-in zoom-in" />
            ) : required ? (
                <AlertCircle className="w-3.5 h-3.5 text-atenuado/30" />
            ) : null}
        </label>
    );

    const BackgroundParticles = () => (
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
            {/* Irregular downward lines */}
            {[...Array(8)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-[1px] bg-gradient-to-b from-transparent via-arcilla/10 to-transparent"
                    style={{
                        height: Math.random() * 150 + 100,
                        left: `${(i + 1) * 12}%`,
                        top: -200,
                    }}
                    animate={{
                        y: [0, 1000],
                        opacity: [0, 0.5, 0],
                    }}
                    transition={{
                        duration: Math.random() * 4 + 3,
                        repeat: Infinity,
                        ease: "linear",
                        delay: Math.random() * 5,
                    }}
                />
            ))}

            {/* Subtle orbs */}
            {[...Array(4)].map((_, i) => (
                <motion.div
                    key={`orb-${i}`}
                    className="absolute rounded-full bg-arena/10 blur-3xl"
                    style={{
                        width: 300,
                        height: 300,
                        left: `${Math.random() * 80}%`,
                        top: `${Math.random() * 80}%`,
                    }}
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    );

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-carbon/60 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20, boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)" }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        boxShadow: [
                            "0px 25px 50px -12px rgba(43,37,32,0.25)",
                            "0px 25px 50px -12px rgba(196,88,31,0.15)",
                            "0px 25px 50px -12px rgba(43,37,32,0.25)"
                        ]
                    }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{
                        duration: 0.3, // Entrance duration
                        boxShadow: {
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }
                    }}
                    className="bg-crema w-full max-w-2xl rounded-[2.5rem] overflow-hidden border border-carbon/5 flex flex-col h-[800px] max-h-[95vh] relative"
                >
                    <BackgroundParticles />
                    {/* Header Section */}
                    <div className="p-6 pb-0 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-arcilla/10 flex items-center justify-center">
                                <Smartphone className="w-5 h-5 text-arcilla" />
                            </div>
                            <div>
                                <h2 className="text-xl font-serif font-medium text-carbon leading-tight">Configuración de Cupo</h2>
                                <p className="text-xs text-atenuado">Proceso rápido y seguro</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-carbon/5 text-atenuado transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Dynamic Steps Indicator */}
                    <div className="px-6 pt-6">
                        <div className="flex items-center justify-between relative mb-8">
                            <div className="absolute top-4 left-0 w-full h-[2px] bg-carbon/5 -z-10" />
                            <motion.div
                                className="absolute top-4 left-0 h-[2px] bg-arcilla -z-10"
                                initial={{ width: '0%' }}
                                animate={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                            />
                            {steps.map((s, i) => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step > i + 1 ? 'bg-arcilla text-white' : step === i + 1 ? 'bg-arcilla text-white shadow-lg shadow-arcilla/30 scale-110' : 'bg-white border-2 border-carbon/5 text-atenuado'
                                        }`}>
                                        {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${step === i + 1 ? 'text-arcilla' : 'text-atenuado'}`}>
                                        {s.title}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white/50 p-4 rounded-2xl border border-carbon/5 mb-6">
                            <h3 className="text-sm font-bold text-carbon mb-1">{steps[step - 1].title}: {steps[step - 1].desc}</h3>
                            <p className="text-xs text-atenuado">Completa los campos para avanzar al siguiente paso.</p>
                        </div>
                    </div>

                    {/* Content Area - Fixed Height with Scroll */}
                    <div className="flex-1 overflow-y-auto px-6 md:px-8 no-scrollbar pb-6">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                    <div className="space-y-3">
                                        <Label required valid={!!formData.plan}>¿Qué plan prefieres?</Label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {Object.entries(planOptions).map(([id, p]) => (
                                                <button key={id} onClick={() => setFormData({ ...formData, plan: id })} className={`p-4 rounded-2xl border-2 transition-all text-left ${formData.plan === id ? 'border-arcilla bg-arcilla/5' : 'border-carbon/5 bg-white hover:border-arcilla/20'}`}>
                                                    <div className="text-[10px] font-bold text-atenuado uppercase mb-1">{p.name}</div>
                                                    <div className="text-lg font-bold text-arcilla">${p.displayPrice}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label required valid={!!formData.fecha_inicio}>
                                            <Calendar className="w-3 h-3 text-arcilla" /> Fecha de Inicio
                                        </Label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {availability.map((a) => (
                                                <button key={a.fecha} disabled={!a.disponible} onClick={() => setFormData({ ...formData, fecha_inicio: a.fecha })} className={`py-2 px-1 rounded-xl border-2 text-[10px] font-bold transition-all ${formData.fecha_inicio === a.fecha ? 'border-arcilla bg-arcilla text-white' : 'border-carbon/5 bg-white'}`}>
                                                    {new Date(a.fecha + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-arena/20 border border-arena flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Utensils className="w-5 h-5 text-arcilla" />
                                            <div>
                                                <div className="text-xs font-bold text-carbon">¿Ya tienes tus cocas?</div>
                                                <div className="text-[10px] text-atenuado">Kit inicial: $70.000</div>
                                            </div>
                                        </div>
                                        <button onClick={() => setFormData(v => ({ ...v, tieneCocas: !v.tieneCocas }))} className={`w-10 h-5 rounded-full relative transition-all ${formData.tieneCocas ? 'bg-arcilla' : 'bg-carbon/20'}`}>
                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${formData.tieneCocas ? 'left-6' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                                    <div className="space-y-2">
                                        <Label required valid={formData.nombre.length > 3}>Nombre Completo</Label>
                                        <input type="text" className="w-full bg-white border border-carbon/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-arcilla outline-none font-medium text-carbon" placeholder="Tu nombre..." value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label required valid={isPhoneValid(formData.whatsapp)}>WhatsApp</Label>
                                            <input type="tel" className="w-full bg-white border border-carbon/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-arcilla outline-none font-medium text-carbon" placeholder="300..." value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value.replace(/\D/g, '') })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label required valid={isEmailValid(formData.email)}>Email</Label>
                                            <input type="email" className="w-full bg-white border border-carbon/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-arcilla outline-none font-medium text-carbon" placeholder="correo@..." value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label required valid={formData.cedula.length > 5}>Cédula (Para el seguro)</Label>
                                        <input type="text" className="w-full bg-white border border-carbon/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-arcilla outline-none font-medium text-carbon" placeholder="Documento..." value={formData.cedula} onChange={e => setFormData({ ...formData, cedula: e.target.value.replace(/\D/g, '') })} />
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                                    <div className="flex p-1 bg-carbon/5 rounded-xl">
                                        {['fija', 'hibrida'].map(t => (
                                            <button key={t} onClick={() => setFormData({ ...formData, tipoEntrega: t })} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${formData.tipoEntrega === t ? 'bg-white text-arcilla shadow-sm' : 'text-atenuado'}`}>Modo {t}</button>
                                        ))}
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label required valid={coverageStatus1.status === 'ok'}>Dirección Principal</Label>
                                            <div className="flex gap-2">
                                                <input type="text" className="flex-1 bg-white border border-carbon/10 rounded-xl px-4 py-3 text-sm outline-none font-medium text-carbon" placeholder="Dirección..." value={formData.direccion1} onChange={e => setFormData({ ...formData, direccion1: e.target.value })} />
                                                <input type="text" className="w-1/3 bg-white border border-carbon/10 rounded-xl px-4 py-3 text-sm outline-none font-medium text-carbon" placeholder="Barrio" value={formData.barrio1} onChange={e => setFormData({ ...formData, barrio1: e.target.value })} onBlur={() => checkCoverage(formData.direccion1, formData.barrio1, setCoverageStatus1)} />
                                            </div>
                                            {coverageStatus1.status === 'ok' && <p className="text-[10px] font-bold text-exito animate-pulse">¡Listo! Llegamos a tu zona 🛵</p>}
                                        </div>
                                        {formData.tipoEntrega === 'hibrida' && (
                                            <div className="space-y-2 pt-4 border-t border-carbon/5">
                                                <Label required valid={coverageStatus2.status === 'ok'}>Dirección 2</Label>
                                                <div className="flex gap-2">
                                                    <input type="text" className="flex-1 bg-white border border-carbon/10 rounded-xl px-4 py-3 text-sm outline-none font-medium text-carbon" value={formData.direccion2} onChange={e => setFormData({ ...formData, direccion2: e.target.value })} />
                                                    <input type="text" className="w-1/3 bg-white border border-carbon/10 rounded-xl px-4 py-3 text-sm outline-none font-medium text-carbon" value={formData.barrio2} onChange={e => setFormData({ ...formData, barrio2: e.target.value })} onBlur={() => checkCoverage(formData.direccion2, formData.barrio2, setCoverageStatus2)} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {step === 4 && (
                                <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                                    <div className="bg-arcilla p-4 rounded-2xl text-crema text-center shadow-lg">
                                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">Total a Transferir</div>
                                        <div className="text-3xl font-bold">${calculateTotal().toLocaleString('es-CO')}</div>
                                        <div className="text-[10px] opacity-60">Plan {formData.plan} + {formData.tieneCocas ? 'Cocas propias' : 'Kit Cocas'}</div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white p-4 rounded-2xl border border-carbon/10 space-y-2">
                                            <div className="text-[10px] font-bold uppercase text-atenuado">Cuenta Bancolombia</div>
                                            <div className="text-sm font-bold text-carbon">Ahorros</div>
                                            <div className="text-base font-bold text-arcilla">238-000045-84</div>
                                            <button onClick={() => { navigator.clipboard.writeText('23800004584'); alert("Copiado"); }} className="text-[10px] font-bold text-arcilla hover:underline flex items-center gap-1">
                                                <Share2 className="w-3 h-3" /> Copiar Número
                                            </button>
                                        </div>
                                        <div className="bg-white p-2 rounded-2xl border border-carbon/10 flex flex-col items-center justify-center gap-1">
                                            <img src="/qr_bancolombia.png" alt="QR" className="w-16 h-16 object-contain cursor-zoom-in hover:scale-105 transition-all" onClick={() => setIsQrExpanded(true)} />
                                            <button onClick={() => { const link = document.createElement('a'); link.href = '/qr_bancolombia.png'; link.download = 'QR_LaCoca.png'; link.click(); }} className="text-[9px] font-bold text-atenuado flex items-center gap-1">
                                                <Download className="w-2.5 h-2.5" /> Descargar QR
                                            </button>
                                        </div>
                                    </div>

                                    <a href="https://www.bancolombia.com/personas/apps/app-personas" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 w-full py-3 bg-yellow-400 text-slate-900 rounded-xl text-xs font-bold hover:bg-yellow-500 transition-all">
                                        <Smartphone className="w-4 h-4" /> Ir a App Bancolombia
                                    </a>

                                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-carbon/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 bg-white hover:border-arcilla/30 cursor-pointer">
                                        <Upload className="w-6 h-6 text-arcilla opacity-40" />
                                        <div className="text-center text-[10px] font-bold text-carbon">
                                            {formData.comprobanteName || "Subir Comprobante (Captura o PDF)"}
                                        </div>
                                        <input type="file" ref={fileInputRef} className="hidden" onChange={e => { const f = e.target.files[0]; if (f) setFormData({ ...formData, comprobante: f, comprobanteName: f.name }) }} />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer controls */}
                    <div className="p-6 bg-white/80 border-t border-carbon/5 flex items-center justify-between relative z-10">
                        <button onClick={handleBack} className={`flex items-center gap-2 text-xs font-bold text-atenuado hover:text-carbon ${step === 1 ? 'invisible' : ''}`}>
                            <ArrowLeft className="w-4 h-4" /> Anterior
                        </button>
                        <div className="flex gap-3">
                            {step < 4 ? (
                                <Button
                                    variant={canAdvance() ? "primary" : "outline"}
                                    size="lg"
                                    className={`min-w-[140px] transition-all duration-300 ${!canAdvance() && 'opacity-50 grayscale hover:grayscale-0'}`}
                                    onClick={handleNext}
                                >
                                    Siguiente <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            ) : (
                                <Button
                                    variant={canAdvance() ? "primary" : "outline"}
                                    size="lg"
                                    className={`min-w-[140px] transition-all duration-300 ${!canAdvance() && 'opacity-50'}`}
                                    onClick={handleSubmit}
                                    disabled={loading || !formData.comprobante}
                                >
                                    {loading ? "Enviando..." : "Finalizar Reserva"}
                                </Button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* QR Expansion Modal */}
            {isQrExpanded && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-carbon/90" onClick={() => setIsQrExpanded(false)}>
                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white p-4 rounded-3xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
                        <img src="/qr_bancolombia.png" alt="QR" className="w-full h-auto" />
                        <button onClick={() => setIsQrExpanded(false)} className="w-full mt-4 py-3 bg-carbon text-crema rounded-xl font-bold">Cerrar</button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

// WIZZAR
