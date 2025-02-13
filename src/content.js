// Store our promo codes
const PROMO_CODES = [
    'TEST', 'TEST10', 'TEST20', 'WELCOME10', 'WELCOME20', 'SAVE10', 'SAVE20', 'SAVE50', 
    'DISCOUNT10', 'DISCOUNT20', 'FALL10', 'FALL20', 'WINTER10', 'WINTER20', 'SPRING10', 
    'SPRING20', 'SUMMER10', 'SUMMER20','50PAIR20', 'XMAS15', 'HOLIDAY25', 'FIRSTBUY10', 'NEWCOMER15', 
    'START30', 'NEW10', 'FIRST20', 'FREESHIP50', 'FREESHIPPING', 'SHIPFREE', 'SHIP4FREE', 
    'FREESHIP200', 'FLASHSALE20', 'FLASH50', 'QUICKBUY25', 'LIMITED25', 'COUNTDOWN50', 
    'BUYONEGETONE', 'TWOFORONE', 'FREESECOND', 'HALFPRICE50', 'LOYALTY15', 'REFER10', 
    'FRIEND15', 'SHARE20', 'SORRY10', 'OOPS15', 'EMPLOYEE25', 'MILITARY15', 'BLACKFRIDAY50', 
    'CYBERMONDAY30', 'STUDENT10', 'ADMIN20', 'HELLO15', 'THANKYOU25', 'BONUS30', 'DEAL50', 
    'SPECIAL40', 'MEMBER15', 'EXCLUSIVE20', 'VIP25', 'EARLYBIRD30', 'LASTCHANCE40', 
    'ECOFRIENDLY10', 'GREEN15', 'EVENT30', 'INFLUENCER25', 'SUBSCRIBE20', 'RETARGETED15', 
    'EXITINTENT10', 'ABANDONEDCART5', 'UKDEAL10', 'BRITISH15', 'LONDON20', 'SAVEUK25', 
    'ROYALSAVE', 'QEII10', 'UKONLY', 'POUNDOFF5', 'TEATIME10', 'UKVIP20', 'BRITISHPOUND15', 
    'UKEXPRESS', 'UKFIRST25', 'QUEENUK10', 'UKSHOP30', 'SHOPNOW10', 'NEWUSER20', 'GET50OFF', 
    'INSTA20', 'FBDEAL15', 'TIKTOK25', 'YTSALE10', 'THREADS15', 'SPRINGSALE20', 'UKSAVE10', 
    'ROYALDEAL25'
];

class PromoTester {
    constructor() {
        this.successfulCodes = [];
        this.testedCodes = new Set();
        this.isRunning = false;
        this.debug = true; // Enable debugging
    }

    log(message) {
        if (this.debug) {
            console.log(`PromoTester: ${message}`);
        }
    }

    // Find the promo code input with enhanced detection
    findPromoInput() {
        this.log('Searching for promo input field...');
        
        // Priority patterns for placeholder text and labels
        const PRIORITY_TERMS = [
            'discount code',
            'promo code',
            'coupon code',
            'voucher code',
            'gift card',
            'discount',
            'promo',
            'coupon',
            'voucher'
        ];

        // Terms that indicate we should SKIP this input
        const EXCLUDE_TERMS = [
            'post',
            'postal',
            'zip',
            'postcode',
            'email',
            'phone',
            'address',
            'search'
        ];

        // First try Shopify-specific selectors
        const shopifySelectors = [
            '#discount',  // Common Shopify discount input ID
            'input[name="discount"]',
            'input[autocomplete="off"][aria-label*="discount" i]',
            '[data-discount-field]',
            '#checkout_reduction_code',
            '#checkout_discount_code'
        ];

        for (const selector of shopifySelectors) {
            const input = document.querySelector(selector);
            if (input && this.isVisibleElement(input)) {
                this.log('Found Shopify discount input');
                return input;
            }
        }

        // Get all visible input fields
        const inputs = Array.from(document.getElementsByTagName('input'))
            .filter(input => this.isVisibleElement(input));

        // First pass: Check placeholder text and labels for priority terms
        for (const input of inputs) {
            const textToCheck = [
                input.placeholder?.toLowerCase() || '',
                input.getAttribute('aria-label')?.toLowerCase() || '',
                input.name?.toLowerCase() || '',
                input.id?.toLowerCase() || '',
                this.findLabelText(input)?.toLowerCase() || ''
            ].join(' ');

            // Skip if contains exclude terms
            if (EXCLUDE_TERMS.some(term => textToCheck.includes(term))) {
                this.log(`Skipping input due to exclude term: ${textToCheck}`);
                continue;
            }

            // Check for priority terms
            if (PRIORITY_TERMS.some(term => textToCheck.includes(term))) {
                this.log(`Found input with priority term: ${textToCheck}`);
                return input;
            }
        }

        // Second pass: Check surrounding context
        for (const input of inputs) {
            const nearbyText = this.getNearbyText(input).toLowerCase();
            
            // Skip if contains exclude terms
            if (EXCLUDE_TERMS.some(term => nearbyText.includes(term))) {
                continue;
            }

            // Check for priority terms in nearby text
            if (PRIORITY_TERMS.some(term => nearbyText.includes(term))) {
                this.log(`Found input with nearby priority term: ${nearbyText}`);
                return input;
            }
        }

        this.log('No specific promo input found');
        return null;
    }

    // Get label text for an input
    findLabelText(input) {
        let labelText = '';
        
        // Check for aria-label
        if (input.getAttribute('aria-label')) {
            labelText += ' ' + input.getAttribute('aria-label');
        }

        // Check for explicit label
        if (input.id) {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (label) {
                labelText += ' ' + label.textContent;
            }
        }

        // Check parent label
        const parentLabel = input.closest('label');
        if (parentLabel) {
            labelText += ' ' + parentLabel.textContent;
        }

        // Check for aria-labelledby
        const labelledBy = input.getAttribute('aria-labelledby');
        if (labelledBy) {
            labelledBy.split(' ').forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    labelText += ' ' + element.textContent;
                }
            });
        }

        return labelText.trim();
    }

    // Get text from nearby elements
    getNearbyText(element) {
        let text = '';
        
        // Look at parent and siblings
        const parent = element.parentElement;
        if (parent) {
            // Get text from parent
            text += ' ' + parent.textContent;
            
            // Look at previous and next siblings
            const prevSibling = element.previousElementSibling;
            const nextSibling = element.nextElementSibling;
            
            if (prevSibling) text += ' ' + prevSibling.textContent;
            if (nextSibling) text += ' ' + nextSibling.textContent;
        }

        return text.trim();
    }

    // Find label text for an input
    findLabelText(input) {
        // Check for explicit label
        if (input.id) {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (label) return label.textContent;
        }

        // Check parent label
        const parentLabel = input.closest('label');
        if (parentLabel) return parentLabel.textContent;

        return '';
    }

    // Get text from nearby elements
    getNearbyText(element) {
        let text = '';
        const range = 2; // Look within 2 elements up and around
        
        // Look up the parent chain
        let current = element.parentElement;
        for (let i = 0; i < range && current; i++) {
            text += ' ' + current.textContent;
            current = current.parentElement;
        }

        // Look at siblings
        const parent = element.parentElement;
        if (parent) {
            Array.from(parent.children).forEach(child => {
                if (child !== element) {
                    text += ' ' + child.textContent;
                }
            });
        }

        return text;
    }

    // Check if an element is visible
    isVisibleElement(element) {
        if (!element) return false;
        
        const style = window.getComputedStyle(element);
        const isVisible = style.display !== 'none' && 
                         style.visibility !== 'hidden' && 
                         element.offsetParent !== null;
        
        this.log(`Checking visibility of element: ${element.tagName} - Visible: ${isVisible}`);
        return isVisible;
    }

    // Test a single promo code
    // Find submit button for promo code
    findSubmitButton(input) {
        const submitTerms = ['apply', 'submit', 'ok', 'verify', 'check', 'redeem'];
        
        // Look for button in same form first
        const form = input.closest('form');
        if (form) {
            // Try submit button
            const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
            if (submitBtn && this.isVisibleElement(submitBtn)) {
                return submitBtn;
            }
        }

        // Look for nearby buttons
        const buttons = Array.from(document.querySelectorAll('button, input[type="button"], [role="button"]'))
            .filter(btn => this.isVisibleElement(btn));

        for (const button of buttons) {
            const buttonText = button.textContent.toLowerCase();
            if (submitTerms.some(term => buttonText.includes(term))) {
                return button;
            }
        }

        return null;
    }

    async submitCode(input, code, submitButton) {
        // Try multiple submission methods
        let submitted = false;

        // 1. Try submit button if found
        if (submitButton) {
            this.log('Clicking submit button');
            submitButton.click();
            submitted = true;
        }

        // 2. Try form submission
        const form = input.closest('form');
        if (form && !submitted) {
            this.log('Submitting form');
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            submitted = true;
        }

        // 3. Try Enter key as last resort
        if (!submitted) {
            this.log('Simulating Enter key');
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
            input.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', bubbles: true }));
            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));
        }
    }

    async testPromoCode(code) {
        this.log(`Testing code: ${code}`);
        
        try {
            // Find promo input field
            const input = this.findPromoInput();
            if (!input) {
                this.log('No promo input field found');
                return false;
            }

            // Find submit button
            const submitButton = this.findSubmitButton(input);
            if (submitButton) {
                this.log('Found submit button');
            }

            // Highlight the input
            const originalStyle = input.style.cssText;
            input.style.backgroundColor = '#fff3cd';
            input.style.border = '2px solid #ffc107';
            
            // Type the code
            this.log(`Typing code: ${code}`);
            input.value = code;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Submit the code
            await this.submitCode(input, code, submitButton);

            // Wait for response
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Reset style
            input.style.cssText = originalStyle;
            
            // Add visual feedback
            this.showFeedback(code, false);
            
            return false;
        } catch (error) {
            this.log(`Error testing code ${code}: ${error.message}`);
            return false;
        }
    }

    // Check for success messages
    checkSuccess() {
        const successPatterns = [
            /success/i,
            /applied/i,
            /valid/i,
            /accepted/i,
            /discount.*added/i,
            /coupon.*added/i,
            /promo.*added/i,
            /discount.*applied/i,
            /coupon.*applied/i,
            /promo.*applied/i,
            /discount.*success/i,
            /coupon.*success/i,
            /promo.*success/i
        ];

        // Get all visible text on the page
        const pageText = Array.from(document.getElementsByTagName('*'))
            .filter(element => this.isVisibleElement(element))
            .map(element => element.textContent)
            .join(' ');

        // Check for success patterns
        return successPatterns.some(pattern => pattern.test(pageText));
    }

    // Show feedback on the page
    showFeedback(code, isSuccess) {
        const feedbackDiv = document.createElement('div');
        Object.assign(feedbackDiv.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '10px 20px',
            backgroundColor: isSuccess ? '#d4edda' : '#f8d7da',
            color: isSuccess ? '#155724' : '#721c24',
            borderRadius: '5px',
            zIndex: '10000',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        });
        
        feedbackDiv.textContent = isSuccess ? 
            `✓ Code "${code}" tested` : 
            `Testing: "${code}"`;
        
        document.body.appendChild(feedbackDiv);
        
        setTimeout(() => {
            feedbackDiv.style.opacity = '0';
            setTimeout(() => feedbackDiv.remove(), 500);
        }, 2000);
    }

    // Main testing function
    async startTesting() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.log('Starting promo code testing...');

        for (const code of PROMO_CODES) {
            if (!this.isRunning) break;
            
            chrome.runtime.sendMessage({ 
                type: 'progress', 
                message: `Testing code: ${code}`,
                code: code
            });

            await this.testPromoCode(code);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        this.log('Testing complete');
        
        // Show completion notification
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
            fontWeight: 'bold'
        });
        
        const successCount = this.successfulCodes.length;
        completionDiv.textContent = successCount > 0 
            ? `Testing complete! Found ${successCount} working code${successCount > 1 ? 's' : ''}!` 
            : 'Testing complete.';
        
        document.body.appendChild(completionDiv);
        
        // Remove after 5 seconds
        setTimeout(() => {
            completionDiv.style.opacity = '0';
            completionDiv.style.transition = 'opacity 0.5s';
            setTimeout(() => completionDiv.remove(), 500);
        }, 5000);

        chrome.runtime.sendMessage({ 
            type: 'complete',
            successfulCodes: this.successfulCodes,
            message: `Testing complete! ${successCount > 0 
                ? `Found ${successCount} working code${successCount > 1 ? 's' : ''}!` 
                : 'Stopping process.'}`
        });
        
        this.isRunning = false;
    }

    stopTesting() {
        this.log('Stopping tests...');
        this.isRunning = false;
    }
}

// Create instance and listen for messages
const promoTester = new PromoTester();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startTesting') {
        promoTester.startTesting();
    } else if (request.action === 'stopTesting') {
        promoTester.stopTesting();
    }
    return true;
});

// Log that the script has loaded
console.log('PromoTester script loaded and ready');