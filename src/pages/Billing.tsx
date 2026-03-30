import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Zap, Shield, Sparkles } from 'lucide-react';
import { TeacherSidebar } from '../components/TeacherSidebar';
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
                    console.log(`Payment successful. Payment ID: ${response.razorpay_payment_id}`);
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
        <div style={{ display: 'flex', minHeight: '100vh', background: '#F9FAFB' }}>
            <TeacherSidebar />
            <main style={{ flex: 1, marginLeft: '240px', padding: '0 2rem 4rem', minWidth: 0 }}>

                {/* Header Section */}
                <div style={{ textAlign: 'center', padding: '64px 24px 48px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#FFF3EE', padding: '6px 16px', borderRadius: 'full', marginBottom: '24px' }}>
                        <Sparkles size={16} color="#FF5C1A" />
                        <span style={{ color: '#FF5C1A', fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Pricing Plans</span>
                    </div>
                    <h1 style={{ fontSize: '42px', fontWeight: 800, color: '#111827', margin: '0 0 16px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                        Upgrade to Quizly <span style={{ color: '#FF5C1A' }}>Pro</span>
                    </h1>
                    <p style={{ fontSize: '18px', color: '#6B7280', margin: '0 auto 40px', maxWidth: '600px', lineHeight: 1.5 }}>
                        Unlock advanced AI generation, unlimited classrooms, and deep analytics to supercharge your teaching experience.
                    </p>

                    {/* Toggle */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', background: '#E5E7EB', padding: '4px', borderRadius: '12px', gap: '4px' }}>
                        <button
                            onClick={() => setIsAnnual(false)}
                            style={{
                                padding: '10px 24px', borderRadius: '8px', border: 'none',
                                background: !isAnnual ? '#FFFFFF' : 'transparent',
                                color: !isAnnual ? '#111827' : '#6B7280',
                                fontSize: '15px', fontWeight: !isAnnual ? 700 : 500,
                                boxShadow: !isAnnual ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setIsAnnual(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '10px 24px', borderRadius: '8px', border: 'none',
                                background: isAnnual ? '#FFFFFF' : 'transparent',
                                color: isAnnual ? '#111827' : '#6B7280',
                                fontSize: '15px', fontWeight: isAnnual ? 700 : 500,
                                boxShadow: isAnnual ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            Annually <span style={{ background: '#DCFCE7', color: '#166534', fontSize: '11px', padding: '2px 8px', borderRadius: 'full', fontWeight: 800 }}>SAVE 25%</span>
                        </button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', padding: '0 24px' }}>
                    {PRICING_PLANS.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            style={{
                                background: '#FFFFFF',
                                borderRadius: '24px',
                                padding: '32px',
                                position: 'relative',
                                border: plan.popular ? '2px solid #FF5C1A' : '1px solid #E5E7EB',
                                boxShadow: plan.popular ? '0 20px 25px -5px rgba(255, 92, 26, 0.1), 0 10px 10px -5px rgba(255, 92, 26, 0.04)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                display: 'flex',
                                flexDirection: 'column',
                                transform: plan.popular ? 'scale(1.03)' : 'scale(1)',
                                zIndex: plan.popular ? 10 : 1
                            }}
                        >
                            {plan.popular && (
                                <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: '#FF5C1A', color: '#FFFFFF', padding: '6px 16px', borderRadius: 'full', fontSize: '12px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Zap size={14} fill="currentColor" />
                                    Most Popular
                                </div>
                            )}

                            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>{plan.name}</h3>
                            <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 24px', lineHeight: 1.5, minHeight: '42px' }}>{plan.description}</p>

                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                                <span style={{ fontSize: '42px', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
                                    ${isAnnual ? plan.priceAnnually : plan.priceMonthly}
                                </span>
                                <span style={{ fontSize: '15px', color: '#6B7280', fontWeight: 500 }}>/ month</span>
                            </div>

                            {isAnnual && plan.priceAnnually > 0 && (
                                <p style={{ fontSize: '13px', color: '#10B981', margin: '0 0 24px', fontWeight: 600 }}>
                                    Billed ${plan.priceAnnually * 12} yearly
                                </p>
                            )}
                            {(!isAnnual || plan.priceAnnually === 0) && (
                                <div style={{ height: '37px', marginBottom: '8px' }} /> // Spacer if no annual text
                            )}

                            <button
                                onClick={() => {
                                    if (plan.buttonVariant === 'primary') handleUpgrade(plan);
                                    if (plan.buttonVariant === 'secondary') handleContactSales(plan);
                                }}
                                disabled={isProcessing}
                                style={{
                                    width: '100%',
                                    padding: '12px 0',
                                    borderRadius: '12px',
                                    fontSize: '15px',
                                    fontWeight: 700,
                                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                                    opacity: isProcessing && plan.buttonVariant === 'primary' ? 0.7 : 1,
                                    border: plan.buttonVariant === 'primary' ? 'none' : '1px solid #E5E7EB',
                                    background: plan.buttonVariant === 'primary' ? '#FF5C1A' : plan.buttonVariant === 'secondary' ? '#111827' : '#F9FAFB',
                                    color: plan.buttonVariant === 'primary' ? '#FFFFFF' : plan.buttonVariant === 'secondary' ? '#FFFFFF' : '#374151',
                                    transition: 'background 0.2s',
                                    marginBottom: '32px'
                                }}
                            >
                                {isProcessing && plan.buttonVariant === 'primary' ? 'Processing...' : plan.buttonText}
                            </button>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                                    What's included
                                </div>
                                {plan.features.map((feature, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                        <div style={{
                                            width: '20px', height: '20px', borderRadius: '50%',
                                            background: feature.included ? (plan.popular ? '#FFF3EE' : '#ECFDF5') : '#F3F4F6',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                        }}>
                                            {feature.included ? (
                                                <Check size={12} color={plan.popular ? '#FF5C1A' : '#10B981'} strokeWidth={3} />
                                            ) : (
                                                <X size={12} color="#9CA3AF" strokeWidth={3} />
                                            )}
                                        </div>
                                        <span style={{ fontSize: '14px', color: feature.included ? '#374151' : '#9CA3AF', fontWeight: feature.included ? 500 : 400, lineHeight: 1.4 }}>
                                            {feature.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* FAQ or Trust Badge (Optional but adds to realistic UI) */}
                <div style={{ maxWidth: '800px', margin: '64px auto 0', textAlign: 'center' }}>
                    <Shield size={32} color="#9CA3AF" style={{ margin: '0 auto 16px' }} />
                    <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Secure Payments & Guaranteed Satisfaction</h4>
                    <p style={{ fontSize: '14px', color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
                        You can securely upgrade or downgrade your plan at any time. We use Stripe for completely secure, encrypted payment processing. Educational discounts are available for accredited institutions.
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
