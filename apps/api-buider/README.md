/**
FilePath: README.md
Title: Quick start and usage
Reason: Explain how to run the API builder and extend it
*/
# Node API Builder (TypeScript)

## Quick start

1. Install dependencies
   ```bash
   npm install
   ```

2. Run the development server
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:3003`.

## API Endpoints

The builder serves API routes defined in `src/schema/example.schema.ts` and `src/schema/project.api.schema.ts`.

### Example cURL Commands

#### Create/Update Project Metadata (POST)

This example demonstrates how to create or update project metadata using the `/api/v1/projects/metadata` endpoint. The request body must conform to the `src/schema/project.json` schema.

```bash
curl -X POST http://localhost:3003/api/v1/projects/metadata \
     -H "Content-Type: application/json" \
     -d '{
  "projectName": "My Project Board",
  "version": "1.0.0",
  "isPublic": false,
  "teamSize": 7,
  "technologies": ["React", "TypeScript", "Node.js", "Express", "MongoDB"],
  "manager": {
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "contact": {
      "phone": "+15551234567",
      "slackId": "@janedoe"
    }
  },
  "startDate": "2023-01-15",
  "status": "In Progress",
  "projects": [
    {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "name": "Frontend UI",
      "lead": "Alice Smith",
      "budget": 50000,
      "tasks": ["Design mockups", "Implement login page", "Integrate API"]
    },
    {
      "id": "b2c3d4e5-f6a7-8901-2345-67890abcdef0",
      "name": "Backend API",
      "lead": "Bob Johnson",
      "budget": 60000,
      "tasks": ["Define API endpoints", "Implement authentication", "Database integration"]
    }
  ]
}'
```

#### Get Project Metadata (GET)

```bash
curl -X GET http://localhost:3003/api/v1/projects/metadata
```

#### List All Users (GET)

```bash
curl -X GET http://localhost:3003/api/v1/users
```

#### Get User by ID (GET)

```bash
curl -X GET http://localhost:3003/api/v1/users/1
```

#### Create User (POST)

```bash
curl -X POST http://localhost:3003/api/v1/users \
     -H "Content-Type: application/json" \
     -d '{"name": "Charlie", "email": "charlie@example.com"}'
```

