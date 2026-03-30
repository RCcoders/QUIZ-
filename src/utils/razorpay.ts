export const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
        const scriptId = 'razorpay-checkout-script';

        // If already loaded
        if (document.getElementById(scriptId)) {
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';

        script.onload = () => {
            resolve(true);
        };

        script.onerror = () => {
            console.error('Failed to load Razorpay SDK');
            resolve(false);
        };

        document.body.appendChild(script);
    });
};
