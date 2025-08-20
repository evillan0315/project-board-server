# AWS Module Overview

The AWS module provides a set of services and controllers for interacting with various Amazon Web Services. This module aims to simplify common AWS operations directly from the application's backend.

## Features

The AWS module integrates with the following AWS services:

- **EC2 (Elastic Compute Cloud)**:
  - Launching and managing EC2 instances.
  - Monitoring instance status.
  - (Future: More detailed instance management, e.g., stop, start, terminate).
- **RDS (Relational Database Service)**:
  - Managing RDS instances (e.g., creating, describing).
  - Backup and parameter group management.
- **S3 (Simple Storage Service)**:
  - (Currently basic integration): Handles file uploads and downloads to S3 buckets.
  - (Future: More comprehensive S3 operations).
- **DynamoDB**:
  - Interacting with DynamoDB tables for NoSQL data storage.
  - Storing command history and other application-specific data.
- **Security Group Management**:
  - Creating, describing, updating, and deleting EC2 Security Groups.
  - Managing ingress and egress rules, including opening specific ports.
- **Billing**:
  - Retrieving AWS billing information.
  - (Future: Cost analysis and reporting).

## Structure

The `src/aws` directory is organized into sub-modules, each focusing on a specific AWS service:

- `aws-billing`: Handles operations related to AWS cost and usage.
- `aws-security-group`: Manages EC2 security groups and their rules.
- `dynamodb`: Provides services for Amazon DynamoDB interactions.
- `ec2`: Manages Amazon EC2 instances.
- `rds`: Handles Amazon RDS database instances.
- `rds-backup`: Specific services for RDS backups.
- `rds-parameter`: Specific services for RDS parameter groups.
- `s3`: Provides basic S3 bucket operations.

Each sub-module typically contains its own controllers, services, and DTOs to encapsulate its functionality.
