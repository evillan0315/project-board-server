# GoogleGeminiController

A NestJS controller that provides an API endpoint for generating natural-language documentation from code snippets using the **Google Gemini** generative AI model.

---

## Table of Contents

* [Overview](#overview)
* [Endpoint](#endpoint)
* [Request Body](#request-body)
* [Response](#response)
* [Error Handling](#error-handling)
* [Usage Example](#usage-example)
* [DTO Schema](#dto-schema)
* [Swagger Integration](#swagger-integration)

---

## Overview

This controller exposes a `POST` endpoint that accepts a code snippet and programming language, and returns AI-generated documentation. It leverages `GoogleGeminiService` under the hood to interface with the Gemini API.

---

## Endpoint

### `POST /api/google-gemini/generate-doc`

Generates documentation from a given code snippet using Google Gemini.

#### HTTP Status Codes

| Status | Description                            |
| ------ | -------------------------------------- |
| 200    | Documentation generated successfully   |
| 502    | Error from Gemini API or gateway issue |

---

## Request Body

```json
{
  "codeSnippet": "function add(a, b) { return a + b; }",
  "language": "javascript"
}
```

| Field         | Type   | Description                                                       |
| ------------- | ------ | ----------------------------------------------------------------- |
| `codeSnippet` | string | Raw source code to document                                       |
| `language`    | string | Programming language of the snippet (e.g. `javascript`, `python`) |

---

## Response

### HTTP 200 OK

```text
Adds two numbers and returns the result.
```

### HTTP 502 Bad Gateway

```json
{
  "statusCode": 502,
  "message": "Failed to generate documentation: <error-details>",
  "error": "Bad Gateway"
}
```

---

## Usage Example (via `curl`)

```bash
curl -X POST http://localhost:3000/api/google-gemini/generate-doc \
  -H "Content-Type: application/json" \
  -d '{
    "codeSnippet": "function add(a, b) { return a + b; }",
    "language": "javascript"
  }'
```

---

## DTO Schema

The `GenerateDocDto` defines the structure of the request payload:

```ts
export class GenerateDocDto {
  codeSnippet: string;
  language: string;
}
```

---

## Swagger Integration

This controller uses `@nestjs/swagger` decorators for automatic OpenAPI documentation:

* `@ApiTags('Google Gemini')` – Groups endpoints under "Google Gemini"
* `@ApiOperation` – Describes the endpoint purpose
* `@ApiBody` – Defines the request body schema
* `@ApiResponse` – Documents possible HTTP responses

Access the generated documentation at `/api` (if Swagger is enabled in your app).


