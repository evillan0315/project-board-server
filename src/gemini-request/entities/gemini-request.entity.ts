// src/gemini-request/entities/gemini-request.entity.ts

// If using TypeORM:
// import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
// import { RequestType } from '@prisma/client'; // Assuming RequestType is from Prisma enum or defined elsewhere

// @Entity()
export class GeminiRequest {
  // @PrimaryGeneratedColumn('uuid') // Example for TypeORM
  id: string;

  // @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // @Column()
  prompt: string;

  // @Column({ nullable: true })
  imageUrl: string | null;

  // @Column({ nullable: true })
  systemInstruction: string | null;

  // @Column({ nullable: true }) // Crucially, ensure this is nullable if it can be null in DB
  conversationId: string | null;

  // @Column()
  userId: string;

  // @Column()
  modelUsed: string;

  // @Column({ type: 'enum', enum: RequestType }) // Example for TypeORM
  requestType: any; // Use RequestType from your enum source (e.g., '@prisma/client')

  // @Column({ nullable: true })
  imageData: string | null;

  // @Column({ nullable: true })
  fileMimeType: string | null;

  // @Column({ nullable: true })
  fileData: string | null;

  // ... add any other fields that are part of your database entity
}
