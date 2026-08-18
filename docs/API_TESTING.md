# API Testing Guide

## Fixed Issues

### Dashboard "Getting Started" Progress Tracking
✅ **Fixed**: The homeowner dashboard now dynamically checks if jobs have been created and updates the "Getting Started" steps accordingly.

**Changes made:**
- Added job fetching in `src/app/app/homeowner/dashboard/page.tsx`
- Step 2 ("Create Your First Job") now shows as complete (green checkmark) when jobs exist
- Step 3 ("Get Matched with Contractors") shows as complete when a job has been assigned to a contractor
- Progress messages update dynamically based on actual data

## API Endpoints Status

### ✅ Swagger Documentation
- **Endpoint**: `http://localhost:3003/api-docs`
- **Status**: Working
- **Spec Endpoint**: `http://localhost:3003/api-docs/spec`
- **Status**: Working - Returns valid OpenAPI 3.0 specification

### Available Endpoints

#### 1. Pricing Calculation
- **Endpoint**: `POST /api/pricing/calculate`
- **Auth Required**: No
- **Test Command**:
  ```bash
  curl -X POST http://localhost:3003/api/pricing/calculate \
    -H "Content-Type: application/json" \
    -d '{
      "regionId": "valid-region-uuid",
      "estimatedLengthFeet": 100,
      "complexity": "medium",
      "lightsProvided": false,
      "storageNeeded": false
    }'
  ```
- **Expected Response**: Pricing breakdown with base price, addons, total, and contractor payout

#### 2. Create Job
- **Endpoint**: `POST /api/jobs/create`
- **Auth Required**: Yes (Supabase cookie)
- **Test**: Requires authenticated session
- **Expected Response**: Created job object

#### 3. Accept Job
- **Endpoint**: `POST /api/jobs/{id}/accept`
- **Auth Required**: Yes (Contractor role)
- **Test**: Requires authenticated contractor session
- **Expected Response**: Updated job with contractor assigned

#### 4. Admin Auth
- **Endpoint**: `POST /api/admin/auth`
- **Auth Required**: Admin password
- **Test Command**:
  ```bash
  curl -X POST http://localhost:3003/api/admin/auth \
    -H "Content-Type: application/json" \
    -d '{"password": "your-admin-password"}' \
    -c cookies.txt
  ```

#### 5. Admin Waitlist
- **Endpoint**: `GET /api/admin/waitlist`
- **Auth Required**: Yes (Admin cookie)
- **Test Command** (after admin auth):
  ```bash
  curl http://localhost:3003/api/admin/waitlist \
    -b cookies.txt
  ```

## Testing Recommendations

1. **Use Swagger UI**: Visit `http://localhost:3003/api-docs` for interactive testing
2. **Browser DevTools**: Test authenticated endpoints through the browser with proper cookies
3. **Postman/Insomnia**: Import the OpenAPI spec from `/api-docs/spec` for API testing
4. **Unit Tests**: Consider adding Jest/Vitest tests for API routes

## Next Steps

- ✅ Dashboard progress tracking fixed
- ✅ Swagger documentation set up
- ⏭️ Add integration tests for API endpoints
- ⏭️ Add error handling tests
- ⏭️ Add authentication flow tests

