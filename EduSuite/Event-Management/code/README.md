# EduSuite Event Management Module

The EduSuite Event Management Module is a full-stack module developed for managing institutional events, resources, bookings, and related event operations within the EduSuite ecosystem.

## Module Status

The module has been developed and tested successfully.

Implemented and tested functionality includes:

- Event Management Dashboard
- Event Listing
- Event Creation
- Event Editing
- Event Details
- Event Status Management
- Resource Management
- Resource Availability
- Resource Booking Integration
- Booking Management Interface
- RSVP Module Structure
- Settings Page
- Help & Support Page
- Responsive Sidebar and Navigation
- Global Search Interface
- Dark / Light Theme
- Loading States
- Empty States
- Error Handling
- Backend API Integration
- Database Integration
- JWT Authentication Middleware
- Permission-Based Backend Routes
- Responsive UI
- UI Animations and Transitions

## Technology Stack

### Frontend
- React
- Vite
- React Router
- JavaScript / JSX
- CSS
- Lucide React
- REST API Integration

### Backend
- Node.js
- Express.js
- MySQL
- JWT
- Joi Validation
- REST APIs

## Authentication Note

The backend APIs are protected using JWT authentication.

All module functionality and API integration have been tested successfully using a valid development JWT.

For standalone testing, a valid JWT must be supplied to the frontend.

Example API header:

Authorization: Bearer <valid_token>

Temporary development JWTs are intentionally NOT included in this repository because tokens expire and must not be committed to source control.

During final EduSuite integration, authentication should be provided by the main EduSuite authentication system. The Event Management frontend is designed to send the authenticated user's token with protected API requests.

Therefore, if the module is run independently without a valid token, protected endpoints may return:

401 Unauthorized

This is expected authentication behavior and does not indicate failure of the Event Management APIs.

## Environment Configuration

Environment variables and credentials are intentionally excluded from Git.

Configure the required frontend and backend `.env` files before running the project.

Do not commit:

- `.env`
- JWT tokens
- JWT secrets
- Database passwords
- Other credentials

## Running the Project

### Backend

cd backend
npm install
npm run dev

### Frontend

Open another terminal:

cd frontend
npm install
npm run dev

## API Structure

The Event Management module contains APIs for:

- Events
- Event Details
- Event Creation
- Event Updates
- Event Status
- Resources
- Resource Availability
- Resource Booking
- RSVP-related operations

Resource APIs follow the Event Management route structure:

GET /api/v1/events/resources

GET /api/v1/events/resources/:resourceId/availability

POST /api/v1/events/:eventId/resources

DELETE /api/v1/events/:eventId/resources/:bookingId

## Integration Status

The module is ready for integration into the larger EduSuite application.

The main integration requirement is connection with the central EduSuite authentication/session system so that authenticated user tokens are automatically supplied to protected Event Management APIs.