# Overview

This document provides a high-level overview of the Project Planner Server, its core features, and the technology stack it utilizes.

## Description

The Project Planner Server is a robust Node.js backend application designed to power an AI-driven project planning tool. It offers comprehensive user authentication capabilities, including local email/password authentication, email verification, password reset, and seamless integration with Google and GitHub OAuth providers.

At its core, the server includes an intelligent planner service that leverages advanced AI models (currently Google Gemini or OpenAI) to interpret user prompts, generate code changes, and apply these changes directly to a Git repository. This enables a powerful AI-assisted development workflow.

## Features

-   **User Authentication:** Secure local authentication with email verification and password reset functionality.
-   **OAuth Integrations:** Seamless login via Google and GitHub accounts.
-   **Role-Based Access Control:** Basic user roles defined (extensible for future features).
-   **AI-Powered Planning:** Integrates with Google Gemini or OpenAI to generate code changes based on user prompts.
-   **Git Operations:** Executes various Git commands to apply AI-generated changes, create snapshots, manage branches, and more.
-   **Database Management:** Uses Prisma ORM for type-safe database interactions with PostgreSQL.
-   **Email Service:** Nodemailer integration for sending verification and password reset emails.
-   **Configuration Management:** Environment variable validation using Zod for robust application configuration.

## Technology Stack

-   **Backend:** Node.js, Fastify
-   **Language:** TypeScript
-   **Database:** PostgreSQL (via Prisma ORM)
-   **Authentication:** Passport.js (JWT, Google OAuth2, GitHub OAuth2), bcrypt, jsonwebtoken
-   **AI:** Google Gemini API, OpenAI API (configurable)
-   **Version Control:** `simple-git` for Git operations
-   **Validation:** Zod, `class-validator`
-   **Utilities:** `dotenv`, `uuid`, `nodemailer`