// Global Payments Template JavaScript
class GPTemplate {
    constructor() {
        this.config = null;
        this.cardForms = {};
        this.init();
    }

    async init() {
        await this.loadConfig();
        this.initTabs();
        this.initPaymentForms();
    }

    async loadConfig() {
        try {
            // In a real implementation, this would fetch from your backend
            // For demo purposes, we'll use a placeholder
            this.config = {
                publicApiKey: 'your-public-api-key-here'
            };
            
            if (typeof GlobalPayments !== 'undefined') {
                GlobalPayments.configure({
                    publicApiKey: this.config.publicApiKey
                });
            }
        } catch (error) {
            console.error('Failed to load configuration:', error);
            this.showAlert('error', 'Failed to initialize payment system. Please refresh the page.');
        }
    }

    initTabs() {
        const tabButtons = document.querySelectorAll('.gp-tab-button');
        const tabContents = document.querySelectorAll('.gp-tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;
                
                // Update active button
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update active content
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === targetTab) {
                        content.classList.add('active');
                    }
                });

                // Initialize card form for the active tab if needed
                this.initCardFormForTab(targetTab);
            });
        });
    }

    async initPaymentForms() {
        // Initialize the default active tab
        await this.initCardFormForTab('payment-form');
    }

    async initCardFormForTab(tabId) {
        if (this.cardForms[tabId] || typeof GlobalPayments === 'undefined') {
            return;
        }

        let containerId;
        switch (tabId) {
            case 'payment-form':
                containerId = '#credit-card';
                break;
            case 'tokenization':
                containerId = '#credit-card-token';
                break;
            case 'recurring':
                containerId = '#credit-card-recurring';
                break;
            default:
                return;
        }

        try {
            const cardForm = GlobalPayments.creditCard.form(containerId, { 
                style: "gp-default" 
            });

            cardForm.on('token-success', (resp) => {
                this.handleTokenSuccess(resp, tabId);
            });

            cardForm.on('token-error', (error) => {
                this.handleTokenError(error, tabId);
            });

            this.cardForms[tabId] = cardForm;

            // Set up form submission handlers
            this.setupFormHandler(tabId);

        } catch (error) {
            console.error(`Failed to initialize card form for ${tabId}:`, error);
        }
    }

    setupFormHandler(tabId) {
        let formId;
        switch (tabId) {
            case 'payment-form':
                formId = 'payment-form';
                break;
            case 'tokenization':
                formId = 'tokenization-form';
                break;
            case 'recurring':
                formId = 'recurring-form';
                break;
            default:
                return;
        }

        const form = document.getElementById(formId);
        if (form && !form.dataset.handlerSet) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit(tabId, form);
            });
            form.dataset.handlerSet = 'true';
        }
    }

    handleFormSubmit(tabId, form) {
        this.setLoading(form, true);
        
        // Trigger tokenization
        const cardForm = this.cardForms[tabId];
        if (cardForm) {
            cardForm.tokenize();
        } else {
            this.setLoading(form, false);
            this.showAlert('error', 'Payment form not initialized. Please refresh the page.');
        }
    }

    handleTokenSuccess(resp, tabId) {
        const form = document.getElementById(this.getFormIdForTab(tabId));
        this.setLoading(form, false);

        if (tabId === 'tokenization') {
            // Show token result
            this.displayToken(resp.paymentReference);
            this.showAlert('success', 'Card tokenized successfully!');
        } else {
            // Add token to form and submit
            this.addTokenToForm(form, resp.paymentReference);
            this.showAlert('success', 'Payment processed successfully!');
            
            // In a real implementation, you would submit to your backend
            // form.submit();
        }
    }

    handleTokenError(error, tabId) {
        const form = document.getElementById(this.getFormIdForTab(tabId));
        this.setLoading(form, false);
        this.showAlert('error', `Error: ${error.message}`);
    }

    getFormIdForTab(tabId) {
        const formMap = {
            'payment-form': 'payment-form',
            'tokenization': 'tokenization-form',
            'recurring': 'recurring-form'
        };
        return formMap[tabId];
    }

    addTokenToForm(form, token) {
        // Remove existing token input
        const existingToken = form.querySelector('input[name="payment_token"]');
        if (existingToken) {
            existingToken.remove();
        }

        // Add new token input
        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'payment_token';
        tokenInput.value = token;
        form.appendChild(tokenInput);
    }

    displayToken(token) {
        const tokenResult = document.getElementById('token-result');
        const tokenDisplay = document.getElementById('token-display');
        
        tokenDisplay.textContent = token;
        tokenResult.classList.remove('gp-hidden');
    }

    setLoading(element, isLoading) {
        if (isLoading) {
            element.classList.add('gp-loading');
        } else {
            element.classList.remove('gp-loading');
        }
    }

    showAlert(type, message) {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.gp-alert');
        existingAlerts.forEach(alert => {
            if (!alert.classList.contains('gp-alert-info') || alert.textContent.includes('Info:')) {
                return; // Keep static info alerts
            }
            alert.remove();
        });

        // Create new alert
        const alert = document.createElement('div');
        alert.className = `gp-alert gp-alert-${type}`;
        alert.textContent = message;

        // Insert after the first card header
        const firstCard = document.querySelector('.gp-tab-content.active .gp-card');
        if (firstCard) {
            const cardHeader = firstCard.querySelector('.gp-card-header');
            if (cardHeader) {
                cardHeader.after(alert);
            }
        }

        // Auto-remove after 5 seconds
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
}

// Initialize template when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new GPTemplate();
});