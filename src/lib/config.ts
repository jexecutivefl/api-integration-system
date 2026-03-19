export const config = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'API Integration System',
  nodeEnv: process.env.NODE_ENV || 'development',

  connectors: {
    crm: {
      apiKey: process.env.CRM_API_KEY || 'mock_crm_key_xxx',
      baseUrl: process.env.CRM_BASE_URL || 'https://api.example-crm.com/v2',
    },
    payment: {
      apiKey: process.env.PAYMENT_API_KEY || 'mock_payment_key_xxx',
      baseUrl: process.env.PAYMENT_BASE_URL || 'https://api.example-payments.com/v1',
    },
    form: {
      webhookSecret: process.env.FORM_WEBHOOK_SECRET || 'mock_webhook_secret_xxx',
    },
    support: {
      apiKey: process.env.SUPPORT_API_KEY || 'mock_support_key_xxx',
      baseUrl: process.env.SUPPORT_BASE_URL || 'https://api.example-support.com/v1',
    },
  },

  retry: {
    maxAttempts: parseInt(process.env.RETRY_MAX_ATTEMPTS || '3', 10),
    initialDelayMs: parseInt(process.env.RETRY_INITIAL_DELAY_MS || '30000', 10),
  },
} as const;
