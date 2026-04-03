const GP_PROJECTS = [
  {
    title: "Online Card Payments",
    repo_name: "online-card-payments",
    url: "https://github.com/globalpayments-samples/online-card-payments",
    category: "gp-api",
    description: "Drop-in card payment UI using GP-API hosted fields. Pre-built, PCI-compliant payment forms with tokenization for rapid integration.",
    languages: ["php", "nodejs", "java", "dotnet"],
    language_labels: ["PHP", "Node.js", "Java", ".NET"],
    feature_tags: ["hosted-fields", "tokenization"]
  },
  {
    title: "Online Check Payments",
    repo_name: "online-check-payments",
    url: "https://github.com/globalpayments-samples/online-check-payments",
    category: "gp-api",
    description: "ACH/eCheck payment processing for GP-API. Handle direct bank account entry with routing number validation and electronic check flows.",
    languages: ["php", "nodejs", "java", "dotnet"],
    language_labels: ["PHP", "Node.js", "Java", ".NET"],
    feature_tags: ["ach"]
  },
  {
    title: "Online Recurring Payments",
    repo_name: "online-recurring-payments",
    url: "https://github.com/globalpayments-samples/online-recurring-payments",
    category: "gp-api",
    description: "Recurring payment and subscription billing for GP-API. Configure automated payment schedules and manage customer vault entries.",
    languages: ["php", "nodejs", "java", "dotnet", "python", "go"],
    language_labels: ["PHP", "Node.js", "Java", ".NET", "Python", "Go"],
    feature_tags: ["recurring", "vault"]
  },
  {
    title: "Online Payments Auth & Delayed Capture",
    repo_name: "online-payments-auth-and-delayed-capture",
    url: "https://github.com/globalpayments-samples/online-payments-auth-and-delayed-capture",
    category: "gp-api",
    description: "Two-step payment processing with authorization and delayed capture for GP-API. Demonstrates hold-and-capture workflows for deferred payment scenarios.",
    languages: ["php", "nodejs", "java", "dotnet"],
    language_labels: ["PHP", "Node.js", "Java", ".NET"],
    feature_tags: ["auth-capture"]
  },
  {
    title: "Save & Reuse Payment Methods",
    repo_name: "save-and-reuse-payment-methods",
    url: "https://github.com/globalpayments-samples/save-and-reuse-payment-methods",
    category: "gp-api",
    description: "Customer vault and one-click checkout for GP-API. Securely store payment methods as multi-use tokens and enable instant repeat purchases.",
    languages: ["php", "java", "dotnet"],
    language_labels: ["PHP", "Java", ".NET"],
    feature_tags: ["vault"]
  },
  {
    title: "Google Pay Payments",
    repo_name: "google-pay-payments",
    url: "https://github.com/globalpayments-samples/google-pay-payments",
    category: "gp-api",
    description: "Google Pay integration for GP-API. Process encrypted mobile wallet tokens with secure server-side decryption and payment authorization.",
    languages: ["php", "java", "dotnet"],
    language_labels: ["PHP", "Java", ".NET"],
    feature_tags: ["google-pay", "wallets"]
  },
  {
    title: "Wallet Management",
    repo_name: "wallet-management",
    url: "https://github.com/globalpayments-samples/wallet-management",
    category: "gp-api",
    description: "Digital wallet payment management for GP-API. Process Apple Pay and Google Pay transactions with token handling and payment method storage.",
    languages: ["php", "nodejs", "java", "dotnet"],
    language_labels: ["PHP", "Node.js", "Java", ".NET"],
    feature_tags: ["wallets"]
  },
  {
    title: "Pay By Link",
    repo_name: "pay-by-link",
    url: "https://github.com/globalpayments-samples/pay-by-link",
    category: "gp-api",
    description: "Secure payment link generation with GP-API. Create shareable links for remote transactions with multi-currency support and link lifecycle management.",
    languages: ["php", "nodejs", "java", "dotnet", "python", "go"],
    language_labels: ["PHP", "Node.js", "Java", ".NET", "Python", "Go"],
    feature_tags: ["multi-currency", "pay-by-link"]
  },
  {
    title: "Localized Checkout Experience",
    repo_name: "localized-checkout-experience",
    url: "https://github.com/globalpayments-samples/localized-checkout-experience",
    category: "gp-api",
    description: "Localized checkout experience powered by GP-API. Serve region-specific payment forms, currencies, and language preferences from a single integration.",
    languages: ["php", "nodejs", "java", "dotnet"],
    language_labels: ["PHP", "Node.js", "Java", ".NET"],
    feature_tags: ["localization"]
  },
  {
    title: "GP-API 3DS2 Authentication",
    repo_name: "gpapi-3ds2",
    url: "https://github.com/globalpayments-samples/gpapi-3ds2",
    category: "gp-api",
    description: "3D Secure 2 (EMV 3DS) authentication using GP-API. Covers frictionless and challenge flows with device fingerprinting and ACS redirection.",
    languages: ["php", "nodejs", "java", "dotnet"],
    language_labels: ["PHP", "Node.js", "Java", ".NET"],
    feature_tags: ["3ds"]
  },
  {
    title: "Donation Form — One-Time & Recurring",
    repo_name: "donation-form-one-time-recurring-payments",
    url: "https://github.com/globalpayments-samples/donation-form-one-time-recurring-payments",
    category: "gp-api",
    description: "Donation form supporting both one-time and recurring gifts via GP-API. Configurable amounts, donor management, and automated billing schedules.",
    languages: ["php", "nodejs", "java", "dotnet"],
    language_labels: ["PHP", "Node.js", "Java", ".NET"],
    feature_tags: ["recurring"]
  },
  {
    title: "Integrated Partner Payments",
    repo_name: "integrated-partner-online-payments-with-hosted-fields-api",
    url: "https://github.com/globalpayments-samples/integrated-partner-online-payments-with-hosted-fields-api",
    category: "gp-api",
    description: "Integrated partner payment flows using GP-API Hosted Fields. Demonstrates multi-merchant, fee-splitting, and partner credential injection patterns.",
    languages: ["php", "nodejs", "java", "dotnet", "python", "go"],
    language_labels: ["PHP", "Node.js", "Java", ".NET", "Python", "Go"],
    feature_tags: ["hosted-fields", "multi-merchant"]
  },
  {
    title: "Embedded Payments Fee Splitting",
    repo_name: "embedded-payments-fee-splitting",
    url: "https://github.com/globalpayments-samples/embedded-payments-fee-splitting",
    category: "gp-api",
    description: "Embedded payment processing with fee-splitting via GP-API. Route funds across sub-merchants and configure split payment rules programmatically.",
    languages: ["php", "nodejs", "java", "dotnet"],
    language_labels: ["PHP", "Node.js", "Java", ".NET"],
    feature_tags: ["fee-splitting"]
  },
  {
    title: "Online Card Payments",
    repo_name: "portico-online-card-payments",
    url: "https://github.com/globalpayments-samples/portico-online-card-payments",
    category: "portico",
    description: "Card payment processing examples for the Portico Gateway. Demonstrates tokenization, hosted fields, and complete charge flows across multiple languages.",
    languages: ["php", "nodejs", "java", "dotnet", "python", "go"],
    language_labels: ["PHP", "Node.js", "Java", ".NET", "Python", "Go"],
    feature_tags: ["tokenization"]
  },
  {
    title: "Online Check Payments",
    repo_name: "portico-online-check-payments",
    url: "https://github.com/globalpayments-samples/portico-online-check-payments",
    category: "portico",
    description: "ACH/eCheck payment processing for the Portico Gateway. Covers direct bank account entry, routing number validation, and electronic check processing.",
    languages: ["php", "nodejs", "java", "dotnet"],
    language_labels: ["PHP", "Node.js", "Java", ".NET"],
    feature_tags: ["ach"]
  },
  {
    title: "Online Recurring Payments",
    repo_name: "portico-online-recurring-payments",
    url: "https://github.com/globalpayments-samples/portico-online-recurring-payments",
    category: "portico",
    description: "Recurring billing and subscription setup for the Portico Gateway. Manage customers, store payment methods, and automate billing schedules.",
    languages: ["php", "nodejs", "java", "dotnet"],
    language_labels: ["PHP", "Node.js", "Java", ".NET"],
    feature_tags: ["recurring", "vault"]
  },
  {
    title: "Save & Reuse Payment Methods",
    repo_name: "portico-save-and-reuse-payment-methods",
    url: "https://github.com/globalpayments-samples/portico-save-and-reuse-payment-methods",
    category: "portico",
    description: "Vault-based one-click checkout for the Portico Gateway. Create multi-use tokens, manage stored payment methods, and streamline repeat purchases.",
    languages: ["php", "nodejs", "java", "dotnet", "go"],
    language_labels: ["PHP", "Node.js", "Java", ".NET", "Go"],
    feature_tags: ["vault"]
  },
  {
    title: "Google Pay Payments",
    repo_name: "portico-google-pay-payments",
    url: "https://github.com/globalpayments-samples/portico-google-pay-payments",
    category: "portico",
    description: "Google Pay integration for the Portico Gateway. Decrypt and process Google Pay tokens with a complete end-to-end payment flow.",
    languages: ["php", "nodejs", "dotnet"],
    language_labels: ["PHP", "Node.js", ".NET"],
    feature_tags: ["google-pay", "wallets"]
  },
  {
    title: "Wallet Management",
    repo_name: "portico-wallet-management",
    url: "https://github.com/globalpayments-samples/portico-wallet-management",
    category: "portico",
    description: "Digital wallet (Apple Pay & Google Pay) management for the Portico Gateway. End-to-end wallet token processing with Portico-specific configuration.",
    languages: ["php", "nodejs", "java", "dotnet", "go"],
    language_labels: ["PHP", "Node.js", "Java", ".NET", "Go"],
    feature_tags: ["wallets"]
  },
  {
    title: "Donation Form — One-Time & Recurring",
    repo_name: "portico-donation-form-one-time-recurring-payments",
    url: "https://github.com/globalpayments-samples/portico-donation-form-one-time-recurring-payments",
    category: "portico",
    description: "Donation form for one-time and recurring contributions via the Portico Gateway. Donor vault, scheduled billing, and flexible amount selection.",
    languages: ["php", "nodejs", "java", "dotnet"],
    language_labels: ["PHP", "Node.js", "Java", ".NET"],
    feature_tags: ["recurring"]
  },
  {
    title: "Online Recurring Payments",
    repo_name: "gpecom-online-recurring-payments",
    url: "https://github.com/globalpayments-samples/gpecom-online-recurring-payments",
    category: "gpecom",
    description: "Recurring payment setup using the GP Ecom XML gateway. Schedule automated billing with customer and payment profile management.",
    languages: ["php", "nodejs", "java", "dotnet"],
    language_labels: ["PHP", "Node.js", "Java", ".NET"],
    feature_tags: ["recurring"]
  },
  {
    title: "3DS2 Authentication",
    repo_name: "gpecom-3ds2",
    url: "https://github.com/globalpayments-samples/gpecom-3ds2",
    category: "gpecom",
    description: "3D Secure 2 (EMV 3DS) authentication flow using the GP Ecom gateway. Step-up and frictionless challenge scenarios with full cardholder authentication.",
    languages: ["php", "nodejs", "java", "dotnet", "python"],
    language_labels: ["PHP", "Node.js", "Java", ".NET", "Python"],
    feature_tags: ["3ds"]
  },
  {
    title: "Basic Refund Tool",
    repo_name: "basic-refund-tool",
    url: "https://github.com/globalpayments-samples/basic-refund-tool",
    category: "tools",
    description: "Refund processing tool built on the Global Payments SDK. Retrieve transactions and issue full or partial refunds with environment-based configuration.",
    languages: ["php", "nodejs", "java", "dotnet"],
    language_labels: ["PHP", "Node.js", "Java", ".NET"],
    feature_tags: ["refunds"]
  },
  {
    title: "Reporting Service",
    repo_name: "reporting-service",
    url: "https://github.com/globalpayments-samples/reporting-service",
    category: "tools",
    description: "Transaction reporting and analytics dashboard for GP-API. Search, filter, and export transaction data (CSV/JSON/XML) with real-time visualization.",
    languages: ["php", "nodejs", "java", "dotnet", "python", "go"],
    language_labels: ["PHP", "Node.js", "Java", ".NET", "Python", "Go"],
    feature_tags: ["reporting"]
  },
  {
    title: "PHP Payments & Reporting",
    repo_name: "php-payments-and-reporting",
    url: "https://github.com/globalpayments-samples/php-payments-and-reporting",
    category: "tools",
    description: "Card authentication and verification with comprehensive transaction reporting using the Global Payments PHP SDK. Includes AVS/CVV checks and PCI-compliant implementation.",
    languages: ["php"],
    language_labels: ["PHP"],
    feature_tags: ["avs", "card-verification", "reporting"]
  },
  {
    title: "Starter Template",
    repo_name: "starter-template",
    url: "https://github.com/globalpayments-samples/starter-template",
    category: "tools",
    description: "Customizable multi-language starter scaffold for Global Payments SDK integration. Foundation for new payment projects with configuration management and placeholder endpoints.",
    languages: ["php", "nodejs", "java", "dotnet", "python", "go"],
    language_labels: ["PHP", "Node.js", "Java", ".NET", "Python", "Go"],
    feature_tags: []
  }
];
