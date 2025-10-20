import { IsString, IsNotEmpty, IsUUID, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sender } from '@prisma/client';

/**
 * --- CHAT DTOs ---
 */

// DTO for sending a new message over the WebSocket
export class SendMessageDto {
  @ApiProperty({
    description: 'The ID of the user sending the message (UUID v4).',
    example: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    format: 'uuid',
  })
  @IsUUID('4')
  @IsNotEmpty()
  userId: string; 

  @ApiProperty({
    description: 'The unique ID of the conversation thread (UUID v4).',
    example: 'b1c2d3e4-f5g6-7h8i-9j0k-l1m2n3o4p5q6',
    format: 'uuid',
  })
  @IsUUID('4')
  @IsNotEmpty()
  conversationId: string;

  @ApiProperty({
    description: 'The content of the message.',
    example: 'Hello! Can we schedule the meeting for tomorrow?',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'The type of entity sending the message.',
    enum: Sender,
    example: Sender.USER,
  })
  @IsEnum(Sender)
  @IsNotEmpty()
  sender: Sender;
}

// DTO for requesting a conversation's history
export class GetHistoryDto {
  @ApiProperty({
    description: 'The unique ID of the conversation thread to retrieve history for (UUID v4).',
    example: 'b1c2d3e4-f5g6-7h8i-9j0k-l1m2n3o4p5q6',
    format: 'uuid',
  })
  @IsUUID('4')
  @IsNotEmpty()
  conversationId: string;
}

/**
 * --- VIDEO SIGNALING DTOs ---
 * These DTOs handle the WebRTC handshake process.
 */

// DTO for joining a specific video room (e.g., a conversation or project ID)
export class JoinVideoRoomDto {
  @ApiProperty({
    description: 'The ID of the video/session room to join (UUID v4).',
    example: 'c1d2e3f4-g5h6-7i8j-9k0l-m1n2o3p4q5r6',
    format: 'uuid',
  })
  @IsUUID('4')
  @IsNotEmpty()
  roomId: string; // The ID of the conversation/session/room to join

  @ApiProperty({
    description: 'The ID of the joining user (UUID v4).',
    example: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    format: 'uuid',
  })
  @IsUUID('4')
  @IsNotEmpty()
  userId: string; // The ID of the joining user
}

// DTO for sending a WebRTC Offer/Answer/ICE Candidate
export class SignalingPayloadDto {
  @ApiProperty({
    description: 'The ID of the target room (UUID v4).',
    example: 'c1d2e3f4-g5h6-7i8j-9k0l-m1n2o3p4q5r6',
    format: 'uuid',
  })
  @IsUUID('4')
  @IsNotEmpty()
  roomId: string; 

  @ApiProperty({
    description: 'The socket ID or user ID of the recipient/target peer (UUID v4).',
    example: 'd1e2f3g4-h5i6-7j8k-9l0m-n1o2p3q4r5s6',
    format: 'uuid',
  })
  @IsUUID('4')
  @IsNotEmpty()
  targetUserId: string; 

  @ApiPropertyOptional({
    description: 'The ID of the sending user (UUID v4), optional if inferred from socket.',
    example: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    format: 'uuid',
  })
  @IsUUID('4')
  @IsOptional()
  senderUserId?: string; 

  @ApiPropertyOptional({
    description: 'The actual WebRTC payload (SDP Offer, Answer, or ICE Candidate object).',
    example: { 
      type: 'offer', 
      sdp: 'v=0\\r\\no=- 33810141386762013 2 IN IP4 127.0.0.1\\r\\n...' 
    },
    oneOf: [
      { type: 'object', description: 'RTCSessionDescriptionInit (Offer/Answer)' },
      { type: 'object', description: 'RTCIceCandidate' }
    ]
  })
  @IsOptional()
  payload: RTCSessionDescriptionInit | RTCIceCandidate | any; 
}

// Base DTO for creating a new Conversation via REST (for initial setup)
export class CreateConversationDto {
  @ApiProperty({
    description: 'A descriptive title for the new conversation.',
    example: 'Project Alpha Team Chat',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'The ID of the user who is creating the conversation (UUID v4).',
    example: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    format: 'uuid',
  })
  @IsUUID('4')
  @IsNotEmpty()
  createdById: string; // The ID of the user creating the conversation
}

// DTO for getting a list of conversations for a user
export class GetConversationsDto {
  @ApiProperty({
    description: 'The ID of the user whose conversations are being requested (UUID v4).',
    example: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    format: 'uuid',
  })
  @IsUUID('4')
  @IsNotEmpty()
  userId: string;
}
