// List of promo codes to test
const PROMO_CODES = [
    'TEST', 'TEST10', 'TEST20', 'WELCOME10', 'WELCOME20', 'SAVE10', 'SAVE20', 'SAVE50', 
    'DISCOUNT10', 'DISCOUNT20', 'FALL10', 'FALL20', 'WINTER10', 'WINTER20', 'SPRING10', 
    'SPRING20', 'SUMMER10', 'SUMMER20', 'XMAS15', 'HOLIDAY25', 'FIRSTBUY10', 'NEWCOMER15', 
    'START30', 'NEW10', 'FIRST20', 'FREESHIP50', 'FREESHIPPING', 'SHIPFREE', 'SHIP4FREE'
];

class PromoTester {
    constructor() {
        this.successfulCodes = [];
        this.isRunning = false;
        this.debug = true;
    }

    log(message) {
        if (this.debug) {
            console.log(`PromoTester: ${message}`);
        }
    }

    findPromoInput() {
        this.log('Searching for promo input field...');
        
        const promoTerms = [
            'promo', 'coupon', 'discount', 'voucher', 
            'code', 'gift', 'offer', 'promotional'
        ];

        const excludeTerms = [
            'post', 'postal', 'zip', 'postcode', 'email',
            'phone', 'address', 'search', 'password'
        ];

        const shopifySelectors = [
            '#discount',
            'input[name="discount"]',
            '[data-discount-field]',
            '#checkout_reduction_code'
        ];

        for (const selector of shopifySelectors) {
            const input = document.querySelector(selector);
            if (input && this.isVisibleElement(input)) {
                this.log('Found Shopify discount input');
                return input;
            }
        }

        const inputs = Array.from(document.getElementsByTagName('input'))
            .filter(input => this.isVisibleElement(input));
        
        for (const input of inputs) {
            const attrs = {
                placeholder: (input.placeholder || '').toLowerCase(),
                name: (input.name || '').toLowerCase(),
                id: (input.id || '').toLowerCase(),
                type: (input.type || '').toLowerCase()
            };

            if (excludeTerms.some(term => 
                Object.values(attrs).some(attr => attr.includes(term)))) {
                continue;
            }

            if (promoTerms.some(term => 
                Object.values(attrs).some(attr => attr.includes(term)))) {
                this.log('Found promo input through attributes');
                return input;
            }

            const labelText = this.findLabelText(input).toLowerCase();
            if (promoTerms.some(term => labelText.includes(term))) {
                this.log('Found promo input through label');
                return input;
            }

            const nearbyText = this.getNearbyText(input).toLowerCase();
            if (promoTerms.some(term => nearbyText.includes(term))) {
                this.log('Found promo input through nearby text');
                return input;
            }
        }

        this.log('No promo input found');
        return null;
    }

    isVisibleElement(element) {
        if (!element) return false;
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               element.offsetParent !== null;
    }

    findLabelText(input) {
        let labelText = '';
        
        if (input.getAttribute('aria-label')) {
            labelText += ' ' + input.getAttribute('aria-label');
        }

        if (input.id) {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (label) {
                labelText += ' ' + label.textContent;
            }
        }

        const parentLabel = input.closest('label');
        if (parentLabel) {
            labelText += ' ' + parentLabel.textContent;
        }

        return labelText.trim();
    }

    getNearbyText(element) {
        let text = '';
        const parent = element.parentElement;
        if (parent) {
            text += ' ' + parent.textContent;
            const siblings = Array.from(parent.children);
            for (const sibling of siblings) {
                if (sibling !== element) {
                    text += ' ' + sibling.textContent;
                }
            }
        }
        return text.trim();
    }

    findSubmitButton(input) {
        const submitTerms = ['apply', 'submit', 'ok', 'verify', 'redeem'];
        
        const form = input.closest('form');
        if (form) {
            const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
            if (submitBtn && this.isVisibleElement(submitBtn)) {
                this.log('Found submit button in form');
                return submitBtn;
            }
        }

        const buttons = Array.from(document.querySelectorAll(
            'button, input[type="button"], [role="button"]'
        )).filter(btn => this.isVisibleElement(btn));

        for (const button of buttons) {
            const buttonText = button.textContent.toLowerCase();
            if (submitTerms.some(term => buttonText.includes(term))) {
                this.log('Found submit button by text');
                return button;
            }
        }

        this.log('No submit button found');
        return null;
    }

    async startTesting() {
        if (this.isRunning) {
            this.log('Already running tests');
            return;
        }

        this.isRunning = true;
        this.log('Starting promo code testing...');

        try {
            for (const code of PROMO_CODES) {
                if (!this.isRunning) {
                    this.log('Testing stopped by user');
                    this.showStoppedNotification();
                    return;
                }

                chrome.runtime.sendMessage({ 
                    type: 'progress', 
                    message: `Testing code: ${code}`
                });

                const isSuccess = await this.testPromoCode(code);
                
                if (!this.isRunning) {
                    this.log('Testing stopped by user');
                    this.showStoppedNotification();
                    return;
                }

                if (this.isRunning) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            if (this.isRunning) {
                this.showCompletionNotification();
            }
        } catch (error) {
            this.log('Error during testing:', error);
            chrome.runtime.sendMessage({ 
                type: 'error',
                message: `Error: ${error.message}`
            });
        } finally {
            this.isRunning = false;
        }
    }

    async testPromoCode(code) {
        if (!this.isRunning) {
            return false;
        }

        this.log(`Testing code: ${code}`);
        
        try {
            const input = this.findPromoInput();
            if (!input) {
                this.log('No promo input field found');
                return false;
            }

            if (!this.isRunning) return false;

            const submitButton = this.findSubmitButton(input);
            
            input.value = code;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            
            if (submitButton) {
                submitButton.click();
            } else {
                input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            }

            await this.waitWithStopCheck(2000);
            
            return false;
        } catch (error) {
            this.log(`Error testing code ${code}: ${error.message}`);
            return false;
        }
    }

    async waitWithStopCheck(ms) {
        return new Promise(resolve => {
            const timer = setTimeout(resolve, ms);
            if (!this.isRunning) {
                clearTimeout(timer);
                resolve();
            }
        });
    }

    stopTesting() {
        this.log('Stop command received');
        this.isRunning = false;
        this.showStoppedNotification();
    }

    showStoppedNotification() {
        const stoppedDiv = document.createElement('div');
        Object.assign(stoppedDiv.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 25px',
            backgroundColor: '#f44336',
            color: 'white',
            borderRadius: '5px',
            zIndex: '10000',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            fontSize: '16px',
            fontWeight: 'bold'
        });
        
        stoppedDiv.textContent = 'Testing stopped';
        document.body.appendChild(stoppedDiv);
        
        setTimeout(() => {
            stoppedDiv.style.opacity = '0';
            stoppedDiv.style.transition = 'opacity 0.5s';
            setTimeout(() => stoppedDiv.remove(), 500);
        }, 3000);

        chrome.runtime.sendMessage({ 
            type: 'complete',
            message: 'Testing stopped'
        });
    }

    showCompletionNotification() {
        const completionDiv = document.createElement('div');
        Object.assign(completionDiv.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 25px',
            backgroundColor: '#4CAF50',
            color: 'white',
            borderRadius: '5px',
            zIndex: '10000',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'opacity 0.5s'
        });
        
        completionDiv.textContent = 'Testing completed!';
        document.body.appendChild(completionDiv);
        
        setTimeout(() => {
            completionDiv.style.opacity = '0';
            setTimeout(() => completionDiv.remove(), 500);
        }, 3000);

        chrome.runtime.sendMessage({ 
            type: 'complete',
            message: 'Testing completed!'
        });
    }
}

const promoTester = new PromoTester();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received:', request);
    if (request.action === 'startTesting') {
        promoTester.startTesting();
    } else if (request.action === 'stopTesting') {
        promoTester.stopTesting();
    }
    return true;
});

console.log('PromoTester script loaded and ready');