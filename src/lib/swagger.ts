import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Lighter Up API',
      version: '1.0.0',
      description: 'API documentation for Lighter Up marketplace application',
      contact: {
        name: 'Lighter Up API Support',
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'sb-access-token',
          description: 'Supabase authentication cookie',
        },
        adminCookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'admin_authenticated',
          description: 'Admin authentication cookie',
        },
      },
      schemas: {
        PricingInputs: {
          type: 'object',
          required: ['regionId', 'estimatedLengthFeet', 'complexity'],
          properties: {
            regionId: {
              type: 'string',
              description: 'UUID of the region',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            estimatedLengthFeet: {
              type: 'number',
              description: 'Estimated length of lights in feet',
              example: 100,
            },
            complexity: {
              type: 'string',
              enum: ['simple', 'medium', 'complex'],
              description: 'Complexity level of the job',
              example: 'medium',
            },
            lightsProvided: {
              type: 'boolean',
              description: 'Whether homeowner provides lights',
              default: false,
            },
            storageNeeded: {
              type: 'boolean',
              description: 'Whether storage is needed',
              default: false,
            },
            tipAmountCents: {
              type: 'number',
              description: 'Optional tip amount in cents',
              example: 1000,
            },
          },
        },
        PricingResult: {
          type: 'object',
          properties: {
            basePriceCents: {
              type: 'number',
              description: 'Base price in cents',
              example: 50000,
            },
            complexityAddonCents: {
              type: 'number',
              description: 'Complexity addon in cents',
              example: 10000,
            },
            optionsAddonCents: {
              type: 'number',
              description: 'Options addon in cents',
              example: 5000,
            },
            totalPriceCents: {
              type: 'number',
              description: 'Total price in cents',
              example: 65000,
            },
            contractorPayoutCents: {
              type: 'number',
              description: 'Contractor payout in cents (80% of total)',
              example: 52000,
            },
          },
        },
        Job: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            homeowner_id: {
              type: 'string',
              format: 'uuid',
            },
            contractor_id: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            region_id: {
              type: 'string',
              format: 'uuid',
            },
            address: {
              type: 'string',
            },
            city: {
              type: 'string',
            },
            state: {
              type: 'string',
            },
            zip: {
              type: 'string',
            },
            latitude: {
              type: 'number',
              nullable: true,
            },
            longitude: {
              type: 'number',
              nullable: true,
            },
            description: {
              type: 'string',
            },
            num_stories: {
              type: 'number',
            },
            house_size: {
              type: 'string',
            },
            estimated_length_feet: {
              type: 'number',
            },
            complexity: {
              type: 'string',
              enum: ['simple', 'medium', 'complex'],
            },
            lights_provided: {
              type: 'boolean',
            },
            storage_needed: {
              type: 'boolean',
            },
            tip_amount_cents: {
              type: 'number',
            },
            requested_date_start: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            requested_date_end: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            base_price_cents: {
              type: 'number',
            },
            complexity_addon_cents: {
              type: 'number',
            },
            options_addon_cents: {
              type: 'number',
            },
            total_price_cents: {
              type: 'number',
            },
            contractor_payout_cents: {
              type: 'number',
            },
            status: {
              type: 'string',
              enum: ['open', 'assigned', 'completed', 'cancelled'],
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CreateJobRequest: {
          type: 'object',
          required: [
            'regionId',
            'address',
            'city',
            'state',
            'zip',
            'description',
            'numStories',
            'houseSize',
            'estimatedLengthFeet',
            'complexity',
            'lightsProvided',
            'storageNeeded',
          ],
          properties: {
            regionId: {
              type: 'string',
              format: 'uuid',
            },
            address: {
              type: 'string',
            },
            city: {
              type: 'string',
            },
            state: {
              type: 'string',
            },
            zip: {
              type: 'string',
            },
            latitude: {
              type: 'number',
              nullable: true,
            },
            longitude: {
              type: 'number',
              nullable: true,
            },
            description: {
              type: 'string',
            },
            numStories: {
              type: 'number',
            },
            houseSize: {
              type: 'string',
            },
            estimatedLengthFeet: {
              type: 'number',
            },
            complexity: {
              type: 'string',
              enum: ['simple', 'medium', 'complex'],
            },
            lightsProvided: {
              type: 'boolean',
            },
            storageNeeded: {
              type: 'boolean',
            },
            tipAmountCents: {
              type: 'number',
              default: 0,
            },
            requestedDateStart: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            requestedDateEnd: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
        WaitlistEntry: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Conversation: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            job_id: {
              type: 'string',
              format: 'uuid',
            },
            homeowner_id: {
              type: 'string',
              format: 'uuid',
            },
            contractor_id: {
              type: 'string',
              format: 'uuid',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
            last_message_at: {
              type: 'string',
              format: 'date-time',
            },
            unread_count: {
              type: 'number',
              description: 'Number of unread messages',
            },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            conversation_id: {
              type: 'string',
              format: 'uuid',
            },
            sender_id: {
              type: 'string',
              format: 'uuid',
            },
            content: {
              type: 'string',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            read_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            edited_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            deleted_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
          },
        },
      },
    },
  },
  apis: ['./src/app/api/**/*.ts'], // Path to the API files
};

export const swaggerSpec = swaggerJsdoc(options);

