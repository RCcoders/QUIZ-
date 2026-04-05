import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Zap, Shield, Sparkles } from 'lucide-react';
import { TeacherSidebar } from '../components/TeacherSidebar';
import { TeacherHeader } from '../components/TeacherHeader';
import { loadRazorpayScript } from '../utils/razorpay';
import { useAuth } from '../contexts/AuthContext';

const PRICING_PLANS = [
    {
        name: 'Basic',
        description: 'Perfect for getting started with AI quizzes.',
        priceMonthly: 0,
        priceAnnually: 0,
        features: [
            { name: 'Up to 5 active quizzes', included: true },
            { name: 'Basic question types', included: true },
            { name: '50 students per session', included: true },
            { name: 'AI Question Generation', included: false },
            { name: 'Detailed Analytics', included: false },
            { name: 'Priority Support', included: false },
        ],
        buttonText: 'Current Plan',
        buttonVariant: 'outline',
        popular: false,
    },
    {
        name: 'Pro',
        description: 'Unlock full AI capabilities and unlimited access.',
        priceMonthly: 12,
        priceAnnually: 9, // $108/yr
        features: [
            { name: 'Unlimited active quizzes', included: true },
            { name: 'All question types', included: true },
            { name: 'Unlimited students per session', included: true },
            { name: 'AI Question Generation (GPT-4)', included: true },
            { name: 'Detailed Analytics & CSV Exports', included: true },
            { name: 'Priority Support', included: false },
        ],
        buttonText: 'Upgrade to Pro',
        buttonVariant: 'primary',
        popular: true,
    },
    {
        name: 'Enterprise',
        description: 'For schools and large educational institutions.',
        priceMonthly: 49,
        priceAnnually: 39,
        features: [
            { name: 'Everything in Pro', included: true },
            { name: 'Custom Branding', included: true },
            { name: 'Dedicated Account Manager', included: true },
            { name: 'SSO & Advanced Security', included: true },
            { name: 'SLA guarantees', included: true },
            { name: 'Priority 24/7 Support', included: true },
        ],
        buttonText: 'Contact Sales',
        buttonVariant: 'secondary',
        popular: false,
    }
];

export function Billing() {
    const [isAnnual, setIsAnnual] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const { user } = useAuth();

    const handleUpgrade = async (plan: typeof PRICING_PLANS[0]) => {
        if (plan.buttonVariant !== 'primary') return; // Only process 'Pro' explicitly for now

        setIsProcessing(true);

        try {
            const isLoaded = await loadRazorpayScript();

            if (!isLoaded) {
                alert("Payment system is currently unavailable. Please check your connection.");
                setIsProcessing(false);
                return;
            }

            const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

            if (!razorpayKeyId) {
                alert("⚠️ Missing Developer Key! Please add VITE_RAZORPAY_KEY_ID=your_test_key_id in your frontend .env file, then restart the Vite server.");
                setIsProcessing(false);
                return;
            }

            // Calculate the payment amount dynamically (Razorpay expects subunit format, so multiply by 100 for INR)
            const amountInINR = (isAnnual ? plan.priceAnnually * 12 : plan.priceMonthly) * 80; // approximate USD to INR conversion since the base values are visually in $
            const amountInPaise = amountInINR * 100;

            const options = {
                key: razorpayKeyId, // Securely loads from `.env`
                amount: amountInPaise.toString(),
                currency: "INR",
                name: "Quizly Pro",
                description: `${plan.name} Subscription (${isAnnual ? 'Annually' : 'Monthly'})`,
                image: "https://quizly.app/logo.png", // Ideal brand logo
                handler: function (response: any) {
                    alert(`Success! Upgraded to ${plan.name} Premium.`);
                },
                prefill: {
                    name: (user as any)?.name || (user as any)?.username || "Premium Educator",
                    email: user?.email || "educator@example.com",
                    contact: "9999999999" // Dummy contact required by Razorpay UI usually
                },
                config: {
                    display: {
                        blocks: {
                            paymentMethods: {
                                name: 'Pay using UPI, Card or Wallet',
                                instruments: [
                                    { method: 'upi' },
                                    { method: 'card' },
                                    { method: 'wallet' }
                                ]
                            }
                        },
                        sequence: ['block.paymentMethods'],
                        preferences: {
                            show_default_blocks: false
                        }
                    }
                },
                theme: {
                    color: "#FF5C1A", // matches Quizly brand primary
                },
            };

            const rzp = new (window as any).Razorpay(options);

            rzp.on('payment.failed', function (response: any) {
                console.error("Payment Failed", response.error);
                alert(`Payment Failed: ${response.error.description}`);
            });

            rzp.open();
        } catch (error) {
            console.error("Failed to initialize payment gateway:", error);
            alert("Something went wrong while initializing checkout.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleContactSales = (plan: typeof PRICING_PLANS[0]) => {
        if (plan.buttonVariant === 'secondary') {
            setShowContactModal(true);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#F5F5F5] overflow-x-hidden">
            <TeacherSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="flex-1 lg:ml-[240px] p-4 sm:p-8 transition-all duration-300 min-w-0">
                <TeacherHeader
                    title="Billing & Subscription"
                    showSearch={false}
                    onMenuClick={() => setIsSidebarOpen(true)}
                />
                {/* Header Section */}
                <div className="text-center pt-16 pb-12 px-6">
                    <div className="inline-flex items-center gap-2 bg-[#FFF3EE] px-4 py-1.5 rounded-full mb-6">
                        <Sparkles size={16} className="text-[#FF5C1A]" />
                        <span className="text-[#FF5C1A] text-[13px] font-bold tracking-widest uppercase">Pricing Plans</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">
                        Upgrade to Quizly <span className="text-[#FF5C1A]">Pro</span>
                    </h1>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Unlock advanced AI generation, unlimited classrooms, and deep analytics to supercharge your teaching experience.
                    </p>

                    {/* Toggle */}
                    <div className="inline-flex items-center bg-gray-200 p-1 rounded-2xl gap-1">
                        <button
                            onClick={() => setIsAnnual(false)}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all
                                ${!isAnnual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setIsAnnual(true)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all
                                ${isAnnual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Annually <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-black uppercase">SAVE 25%</span>
                        </button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                    {PRICING_PLANS.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`bg-white rounded-[2rem] p-8 relative flex flex-col transition-all duration-300
                                ${plan.popular ? 'ring-2 ring-[#FF5C1A] shadow-xl md:scale-105 z-10' : 'border border-gray-100 shadow-sm'}`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#FF5C1A] text-white px-4 py-1.5 rounded-full text-[11px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-lg shadow-[#FF5C1A]/20">
                                    <Zap size={14} fill="currentColor" />
                                    Most Popular
                                </div>
                            )}

                            <h3 className="text-xl font-black text-gray-900 mb-2">{plan.name}</h3>
                            <p className="text-sm text-gray-500 mb-6 leading-relaxed min-h-[42px]">{plan.description}</p>

                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-5xl font-black text-gray-900 tracking-tight">
                                    ${isAnnual ? plan.priceAnnually : plan.priceMonthly}
                                </span>
                                <span className="text-base text-gray-400 font-bold">/ month</span>
                            </div>

                            {isAnnual && plan.priceAnnually > 0 ? (
                                <p className="text-[13px] text-emerald-500 font-black mb-6">
                                    Billed ${plan.priceAnnually * 12} yearly
                                </p>
                            ) : (
                                <div className="h-[37px] mb-2" />
                            )}

                            <button
                                onClick={() => {
                                    if (plan.buttonVariant === 'primary') handleUpgrade(plan);
                                    if (plan.buttonVariant === 'secondary') handleContactSales(plan);
                                }}
                                disabled={isProcessing}
                                className={`w-full py-4 rounded-2xl text-base font-black transition-all mb-8
                                    ${plan.buttonVariant === 'primary' ? 'bg-[#FF5C1A] text-white hover:bg-[#e65317] shadow-lg shadow-[#FF5C1A]/20' :
                                        plan.buttonVariant === 'secondary' ? 'bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-900/10' :
                                            'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'}
                                    ${isProcessing ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
                            >
                                {isProcessing && plan.buttonVariant === 'primary' ? 'Processing...' : plan.buttonText}
                            </button>

                            <div className="space-y-4 flex-1">
                                <div className="text-[11px] font-black text-gray-400 tracking-widest uppercase mb-4">
                                    What's included
                                </div>
                                {plan.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5
                                            ${feature.included ? (plan.popular ? 'bg-orange-50' : 'bg-emerald-50') : 'bg-gray-50'}`}>
                                            {feature.included ? (
                                                <Check size={12} className={plan.popular ? 'text-[#FF5C1A]' : 'text-emerald-500'} strokeWidth={4} />
                                            ) : (
                                                <X size={12} className="text-gray-300" strokeWidth={4} />
                                            )}
                                        </div>
                                        <span className={`text-[14px] leading-snug ${feature.included ? 'text-gray-700 font-bold' : 'text-gray-300 font-medium line-through'}`}>
                                            {feature.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* FAQ/Trust Badge */}
                <div className="max-w-2xl mx-auto mt-24 text-center px-6">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Shield size={24} className="text-gray-400" />
                    </div>
                    <h4 className="text-lg font-black text-gray-900 mb-2">Secure Payments & Guaranteed Satisfaction</h4>
                    <p className="text-sm text-gray-500 leading-relaxed font-bold">
                        You can securely upgrade or downgrade your plan at any time. We use PCI-compliant systems for completely secure, encrypted payment processing. Educational discounts are available for accredited institutions.
                    </p>
                </div>
            </main>

            {/* Contact Sales Modal */}
            {showContactModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)'
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            background: '#FFFFFF', borderRadius: '24px', padding: '40px',
                            maxWidth: '500px', width: '90%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            position: 'relative'
                        }}
                    >
                        <button
                            onClick={() => setShowContactModal(false)}
                            style={{
                                position: 'absolute', top: '24px', right: '24px', background: 'transparent',
                                border: 'none', cursor: 'pointer', color: '#6B7280'
                            }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <div style={{
                                width: '56px', height: '56px', background: '#FFF3EE', borderRadius: '16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
                            }}>
                                <Sparkles size={28} color="#FF5C1A" />
                            </div>
                            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>
                                Enterprise Demo Request
                            </h2>
                            <p style={{ fontSize: '15px', color: '#6B7280', margin: 0 }}>
                                Tell us about your institution and we'll build a custom plan for you.
                            </p>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            setIsProcessing(true);
                            setTimeout(() => {
                                setIsProcessing(false);
                                setShowContactModal(false);
                                alert("Request sent! Our sales team will contact you shortly.");
                            }, 1500);
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        defaultValue={(user as any)?.name || (user as any)?.username || ''}
                                        style={{
                                            padding: '12px 16px', borderRadius: '10px',
                                            border: '1px solid #E5E7EB', fontSize: '15px', outline: 'none'
                                        }}
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Institution Name</label>
                                    <input
                                        type="text"
                                        required
                                        style={{
                                            padding: '12px 16px', borderRadius: '10px',
                                            border: '1px solid #E5E7EB', fontSize: '15px', outline: 'none'
                                        }}
                                        placeholder="e.g. Stanford University"
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Expected Students</label>
                                    <select
                                        style={{
                                            padding: '12px 16px', borderRadius: '10px',
                                            border: '1px solid #E5E7EB', fontSize: '15px', outline: 'none',
                                            background: '#FFFFFF'
                                        }}
                                    >
                                        <option>100 - 500</option>
                                        <option>500 - 2000</option>
                                        <option>2000+</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Notes (Optional)</label>
                                    <textarea
                                        style={{
                                            padding: '12px 16px', borderRadius: '10px',
                                            border: '1px solid #E5E7EB', fontSize: '15px', outline: 'none',
                                            minHeight: '80px', resize: 'vertical'
                                        }}
                                        placeholder="Specific requirements or questions..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isProcessing}
                                    style={{
                                        width: '100%', padding: '14px 0', borderRadius: '12px',
                                        background: '#111827', color: '#FFFFFF', fontSize: '16px',
                                        fontWeight: 700, cursor: isProcessing ? 'not-allowed' : 'pointer',
                                        marginTop: '12px', border: 'none', transition: 'opacity 0.2s',
                                        opacity: isProcessing ? 0.7 : 1
                                    }}
                                >
                                    {isProcessing ? 'Sending Request...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
