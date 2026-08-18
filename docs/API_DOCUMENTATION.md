# API Documentation

This project uses Swagger/OpenAPI for API documentation. The interactive API documentation is available at `/api-docs` when the development server is running.

## Accessing the Documentation

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3003/api-docs` in your browser

3. You'll see an interactive Swagger UI with all available API endpoints

## Available Endpoints

### Pricing
- **POST** `/api/pricing/calculate` - Calculate job pricing based on region, length, complexity, and options

### Jobs
- **POST** `/api/jobs/create` - Create a new job posting (requires authentication)
- **POST** `/api/jobs/{id}/accept` - Accept a job as a contractor (requires authentication, contractor role)

### Admin
- **POST** `/api/admin/auth` - Authenticate as admin
- **GET** `/api/admin/waitlist` - Get all waitlist entries (requires admin authentication)

## Testing Endpoints

The Swagger UI provides an interactive interface where you can:
1. View all available endpoints
2. See request/response schemas
3. Test endpoints directly from the browser
4. View example requests and responses

## Authentication

### User Authentication
Most endpoints require user authentication via Supabase. The authentication is handled via cookies (`sb-access-token`).

### Admin Authentication
Admin endpoints require a separate admin cookie (`admin_authenticated`). First authenticate via `/api/admin/auth` with the admin password.

## How It Works

1. **JSDoc Comments**: Each API route file contains JSDoc comments with `@swagger` tags that describe the endpoint
2. **Swagger Configuration**: The `src/lib/swagger.ts` file configures the OpenAPI specification
3. **Automatic Generation**: `swagger-jsdoc` scans the API files and generates the OpenAPI spec
4. **Interactive UI**: Swagger UI is loaded from CDN (standalone version) to avoid React compatibility issues

## Adding New Endpoints

When adding a new API endpoint:

1. Create your route handler in `src/app/api/`
2. Add JSDoc comments with `@swagger` tags above your route handler:

```typescript
/**
 * @swagger
 * /api/your-endpoint:
 *   post:
 *     summary: Your endpoint summary
 *     description: Detailed description
 *     tags: [YourTag]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success response
 */
export async function POST(req: NextRequest) {
  // Your implementation
}
```

3. The endpoint will automatically appear in the Swagger UI after restarting the dev server

## Benefits for AI Development

This setup helps AI assistants (like me!) understand your API by:
- Providing a machine-readable OpenAPI specification
- Showing clear request/response schemas
- Documenting authentication requirements
- Enabling programmatic understanding of your API structure

I can read the OpenAPI spec and use it to:
- Understand endpoint structures
- Generate test requests
- Verify API contracts
- Help debug API issues

