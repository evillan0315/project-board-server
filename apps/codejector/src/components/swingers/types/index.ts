import { Session, Publisher, Subscriber, Stream, StreamManager } from 'openvidu-browser';

/**
 * @interface IChatMessage
 * @description Represents a single chat message, incorporating details for sender, receiver, and message metadata.
 * @property {string} MESSAGE - The content of the chat message (from message.MESSAGE in signal payload).
 * @property {string} SENDER - The user ID of the sender (from message.SENDER in signal payload).
 * @property {string} SENDER_NAME - The display name of the sender (from message.SENDER_NAME in signal payload).
 * @property {string} [SENDER_PICTURE] - URL or base64 of sender's picture (from message.SENDER_PICTURE in signal payload, optional).
 * @property {string} [RECEIVER] - The user ID of the receiver (from message.RECEIVER in signal payload, optional).
 * @property {string} [TYPE] - Type of message (from message.TYPE in signal payload, e.g., "chat", "whisper", "system", optional).
 * @property {number} TIME - Timestamp when the message was sent (from message.TIME in signal payload, milliseconds since epoch).
 * @property {string} [textColor] - Color of the message text (from message.textColor in signal payload, optional).
 *
 * @property {boolean} isLocal - True if the message was sent by the local client (client-side specific).
 * @property {string} id - Unique identifier for the chat message (generated client-side, e.g., by nanoid).
 *
 * @property {any} [senderInfo] - Additional sender information (if available from other sources).
 * @property {string} [senderGender] - Gender of the sender (if available).
 * @property {string} [receiverName] - Display name of the receiver (if available or derivable).
 * @property {string} [receiverGender] - Gender of the receiver (if available).
 */
export interface IChatMessage {
  MESSAGE: string; 
  SENDER: string; 
  SENDER_NAME: string; 
  SENDER_PICTURE?: string; 
  RECEIVER?: string; 
  TYPE?: string; 
  TIME: number; 
  textColor?: string; 

  isLocal: boolean; 
  id: string; 

  senderInfo?: any;
  senderGender?: string;
  receiverName?: string; 
  receiverGender?: string;
}

/**
 * Represents various properties for default session recording.
 */
export interface IDefaultRecordingProperties {
  name: string;
  hasAudio: boolean;
  hasVideo: boolean;
  outputMode: string;
  recordingLayout: string;
  resolution: string;
  frameRate: number;
  shmSize: number;
}

/**
 * Represents camera settings within client's local settings.
 */
export interface ICameraSettings {
  publishAudio: boolean;
  publishVideo: boolean;
  resolution: string;
  frameRate: number;
  insertMode: string;
  mirror: boolean;
  audioSource?: string; // Optional field, appears in some connections
  videoSource?: string; // Optional field, appears in some connections
}

/**
 * Represents default room settings within client's local settings.
 */
export interface IDefaultRoomSettings {
  value: string;
}

/**
 * Represents general settings within client's local settings.
 */
export interface IGeneralSettings {
  soundNotification: boolean;
  toggleWhisperOption: boolean;
  textSize: 'normal' | 'medium' | 'large';
  defaultRoom: IDefaultRoomSettings;
}

/**
 * Represents chat settings within client's local settings (optional).
 */
export interface IChatSettings {
  chatColor: string;
}

/**
 * Represents local settings configured by the client.
 */
export interface ILocalSettings {
  camera: ICameraSettings;
  general: IGeneralSettings;
  chat?: IChatSettings; // Optional chat settings
}

/**
 * Represents user-related data found within the 'clientData' string of an OpenVidu connection.
 * This is a subset/client-view of a full IMember.
 */
export interface IClientConnectionUserData {
  USERNAME: string;
  USERID: number;
  PICTURE: string;
  USERGROUPID: string;
  ROOMNAME: string;
  publicKey: string;
  USER_GENDER: string; // e.g., "Couple", "Female", "Male", or ""
  GENDER1: number; // 0 or 1
  GENDER2: number | string; // 1, 0, or ""
  PRIVATE: boolean;
  localSettings: ILocalSettings;
  id: number; // A client-side or connection-specific ID
  GENDER_DESC: string | boolean; // e.g., "Female", "Couple", "Male", or false
  connectionId: string;
  customCameraLabel?: string; // Optional field, appears in some connections
}

/**
 * Represents the full payload parsed from the 'clientData' string in an OpenVidu connection.
 * This structure is typically `{"clientData": { ...IClientConnectionUserData... }, "publicKey": "..."}`.
 */
export interface IClientDataPayload {
  clientData: IClientConnectionUserData;
  publicKey: string;
}

/**
 * Represents media options for a publisher's stream.
 */
export interface IMediaOptions {
  hasAudio: boolean;
  audioActive: boolean;
  hasVideo: boolean;
  videoActive: boolean;
  typeOfVideo: string;
  frameRate: number;
  videoDimensions: string; // This is a JSON string, e.g., "{\"width\":640,\"height\":480}"
  filter: object; // Can be more specific if needed, but for now object
}

/**
 * Represents data for a publisher within an OpenVidu connection.
 */
export interface IPublisherData {
  createdAt: number;
  streamId: string;
  mediaOptions: IMediaOptions;
}

/**
 * Represents data for a subscriber within an OpenVidu connection.
 */
export interface ISubscriberData {
  createdAt: number;
  streamId: string;
}

/**
 * Represents an OpenVidu Connection object, enriched with our backend's connection metadata.
 * The 'clientData' field is a JSON string that can be parsed into IClientDataPayload.
 */
export interface IConnection {
  id: string; // OpenVidu's internal connection ID (from 'id' field in JSON array item)
  object: 'connection'; // Literal type for consistency with OpenVidu API
  status: string; // e.g., "active"
  connectionId: string; // OpenVidu's unique ID for the connection (from 'connectionId' field in JSON)
  sessionId: string; // OpenVidu's unique ID for the session this connection belongs to
  createdAt: number; // Timestamp when the connection was created (milliseconds since epoch)
  activeAt: number; // Timestamp when the connection became active
  location: string; // e.g., "unknown"
  ip: string;
  platform: string; // e.g., "Safari 26.0.1 on OS X 10.15.7"
  token: string; // The token for this connection, used to join the session
  type: string; // e.g., "WEBRTC"
  record: boolean;
  role: 'PUBLISHER' | 'SUBSCRIBER' | 'VIEWER';
  kurentoOptions: any | null;
  customIceServers: any[];
  rtspUri: any | null;
  adaptativeBitrate: any | null;
  onlyPlayWithSubscribers: any | null;
  networkCache: any | null;
  serverData: string; // Custom data provided by the server when creating the connection
  clientData: string; // Custom data provided by the client when joining the session (JSON string, parse to IClientDataPayload)
  publishers: IPublisherData[];
  subscribers: ISubscriberData[];
}
/**
 * Represents a list of sessions, typically found nested in session or room objects.
 */
export interface ISessionList {
  numberOfElements: number;
  content: ISession[];
}
/**
 * Represents a list of connections, typically found nested in session or room objects.
 */
export interface IConnectionList {
  numberOfElements: number;
  content: IConnection[];
}

/**
 * Represents various detailed properties within a member's json_data.
 */
export interface IMemberJsonData {
  LAT: number;
  LON: number;
  AGE1: number;
  AGE2: number | string; // e.g., 66 or ""
  CITY: string;
  LONG: number;
  NAME: string;
  PAID: boolean;
  BLOCK: number;
  EMAIL: string;
  STATE: string;
  DRINK1: boolean;
  DRINK2: boolean | string; // e.g., true or ""
  FRIEND: number;
  ONLINE: number; // Represents boolean (1 for true)
  SMOKE1: boolean;
  SMOKE2: boolean | string; // e.g., false or ""
  USERID: number;
  APPSAFE: string | boolean; // e.g., "" or false
  CNTPICS: number;
  COUNTRY: string; // e.g., "US" or ""
  GENDER1: number; // Represents gender (0 or 1)
  GENDER2: number | string; // Represents gender (1, 0 or "")
  HEIGHT1: number;
  HEIGHT2: number | string; // e.g., 67 or ""
  PICTURE: string;
  PRIVATE: number; // Represents boolean (0 for false)
  TAGLINE: string;
  WEIGHT1: number;
  WEIGHT2: number | string; // e.g., 160 or ""
  ZIPCODE: string;
  APPROVED: number; // Represents boolean (0 for false)
  BLOCKBIT: number;
  CNTVIDEO: number;
  DISTANCE: string; // e.g., "0 Mi."
  EMPLOYEE: number; // Represents boolean (0 for false)
  FAVORITE: number; // Represents boolean (0 for false)
  HEIGHT1M: string; // e.g., "170.2cm"
  HEIGHT2M: string; // e.g., "170.2cm" or "0.0cm"
  USERNAME: string;
  WEIGHT1M: string; // e.g., "50.3kg"
  WEIGHT2M: string; // e.g., "72.6kg" or ""
  INTERESTF: number;
  INTERESTM: number;
  CNTPRIVATE: number;
  INTERESTFF: number;
  INTERESTMF: number;
  INTERESTMM: number;
  MEMBERTYPE: string; // e.g., "Paid" or "Lifetime"
  WILLINGBIT: number;
  CNTHOTDATES: number;
  DATECREATED: string; // ISO date string
  INTERESTBIT: number;
  PHANTOMMAIL: number; // Represents boolean (0 for false)
  PICTUREFULL: string;
  USERGROUPID: string;
  WILLINGFULL: number;
  WILLINGSOFT: number;
  CNTCERTIFIED: number;
  DATETIMEJOIN: string; // ISO date string
  DATETIMELAST: string; // ISO date string
  INTERESTFREE: boolean;
  ORIENTATION1: number; // Represents orientation
  ORIENTATION2: number | string; // Represents orientation or ""
  RELATIONSHIP: number; // Represents relationship type
  WILLINGWATCH: number;
  DATETIMEJOIN2: string; // e.g., "over a month"
  DATETIMELAST2: string; // e.g., "minutes ago"
  HEIGHT1INCHES: string; // e.g., "5'7\""
  HEIGHT2INCHES: string; // e.g., "5'7\"" or "0'0\""
  HIDEMEFROMBIT: number;
  INTERESTDRINK: number;
  INTERESTSMOKE: number;
  PICTURERATING: string; // e.g., "Public G" or "Public R"
  WEIGHT1POUNDS: string; // e.g., "111lbs"
  WEIGHT2POUNDS: string; // e.g., "160lbs" or ""
  INTERESTLOWAGE: number;
  INTERESTHIGHAGE: number;
  RELATIONSHIPBIT: number;
  ORIENTATION1NAME: string; // e.g., "Straight"
  ORIENTATION2NAME: string; // e.g., "Straight" or ""
  RELATIONSHIPNAME: string; // e.g., "MF" or "M"
  USERGROUPIDDEFAULT: number;
  MAILFORUMRESTRICTION: number;
}

/**
 * Represents a detailed member object as found in subscribers.json's 'member' or 'subscribed_member' fields.
 * Note: This interface's 'id' is a number, while the Member API uses string (UUID) IDs.
 * Use IMemberResponse for interactions with the new Member API.
 */
export interface IMemberFull {
  id: number;
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  role: number;
  userId: number;
  json_data: IMemberJsonData;
  blockedExpire: string | null;
  blockedStart: string | null;
  PAID: boolean;
  createGroup: boolean;
  EMPLOYEE: boolean;
  ONLINE: boolean;
  MEMBERTYPE: string;
  PICTURE: string;
  admin_user: any | null;
  created_at: string;
  updated_at: string;
  LAT: string; // String representation, distinct from json_data.LAT
  LON: string; // String representation, distinct from json_data.LON
  usetting: any | null;
  terms: any | null;
}

/**
 * Represents a detailed streamer object as found in subscribers.json's 'streamer' field.
 */
export interface IStreamerFull {
  id: number;
  name: string;
  connectionId: string;
  private: boolean;
  json: any | null;
  timestamp: string;
  active: boolean;
  member: number; // Foreign key to member ID
  room: number; // Foreign key to room ID
  connection: number; // Foreign key to connection ID
  streamId: string;
  end_date: string | null;
  stream_duration: any | null;
  created_at: string;
  updated_at: string;
}

/**
 * Represents a member within the Swingers ecosystem (simplified for generic usage).
 * Note: This type is likely for simpler contexts and may not align with the full Member API response.
 */
export interface IMember {
  id: string; // Changed from string to be more general, but existing usage might dictate 'number'
  username: string;
  email: string;
  json_data: { [key: string]: any }; // Flexible for various user profile data
  // Add other relevant properties here based on API response
}

/**
 * Represents a Room, potentially linked to an OpenVidu session.
 * `roomId` from backend maps to `customSessionId` in OpenVidu.
 */
export interface IRoom {
  id: number; // Changed from string to number based on room.json
  name: string;
  active: boolean; // Added based on room.json
  type: 'club' | 'public' | string; // Made more flexible, originally 'club' | 'public'
  description: string | null; // Changed to allow null based on room.json
  roomId: string; // This corresponds to OpenVidu's customSessionId
  agreement: any | null; // Added based on room.json
  reset: boolean; // Added based on room.json
  allowTranscoding: boolean; // Added based on room.json
  recording: boolean; // Existing
  recordingMode: 'MANUAL' | 'ALWAYS' | string; // Added based on room.json, similar to ISession
  map_sessions: any | null; // Added based on room.json
  analytics: any | null; // Added based on room.json
  liveStream: boolean; // Existing
  shortName: string | null; // Added based on room.json
  created_at: string; // Existing
  updated_at: string; // Renamed from 'updatedAt' to 'updated_at' based on room.json
  forceVideoCodec: string; // Added based on room.json
  forcedVideoCodec: string | null; // Changed to allow null based on room.json, although here it's string. Better safe.
  defaultRecordingProperties: IDefaultRecordingProperties; // Added based on room.json structure
  connections?: IConnection[]; // Added, optional field for the empty 'connections' array at room.json root
  connect?: IConnectionList; // Made optional to align with subscribers.json which does not always have it
  // Removed ownerId, members, openViduSessionId as they are not explicitly present in the provided room.json
}

/**
 * Represents a swinger participant (subscriber or streamer) in the context of a session (generic base type).
 * Note: This interface remains as a generic base and does not directly reflect the detailed subscriber from subscribers.json.
 */
export interface ISwingerSessionParticipant {
  id: string;
  member: IMember; // Detailed member information (using the less specific IMember here)
  room: IRoom; // Associated room information
  active: boolean;
  streamId?: string; // OpenVidu stream ID if applicable
  // Add other relevant properties here based on API response
}

/**
 * Represents a detailed activity event based on the structure of data/activities.json.
 */
export interface IActivity {
  id: number;
  event: string; // e.g., "participantJoined", "signalSent", "webrtcConnectionDestroyed"
  sessionId: string;
  participantId: string | null;
  clientData: IClientConnectionUserData | null;
  platform: string | null;
  timestamp: string;
  connectionId: string | null;
  from: string | null;
  connection: string | null; // e.g., "INBOUND", "OUTBOUND" or null
  type: string | null; // e.g., "connect", "blocker", "whisper", "streamDestroyed", "userSettings"
  duration: number | null;
  receivingFrom: string | null;
  streamId: string | null;
  reason: string | null;
  serverData: string | null;
  location: string | null;
  ip: string | null;
  startTime: string | null; // ISO date string
  videoSource: string | null; // e.g., "CAMERA"
  room: IRoom | null;
  member: IMemberFull | null;
  data: any | null; // Flexible for various event-specific data
  session_connection: any | null;
  connectId: string | null;
  name: string | null;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  date: string; // e.g., "09/19/2025"
  hour: string; // e.g., "14:00 (9/19)"
}

/**
 * Represents an OpenVidu Session object, enriched with our backend's session metadata.
 * This interface now includes all properties found in the provided session.json.
 */
export interface ISession {
  id: string; // OpenVidu's internal session ID (from 'id' field in session.json)
  object: 'session'; // Literal type for consistency with OpenVidu API
  sessionId: string; // The ID of the session, same as customSessionId if provided
  createdAt: number; // Timestamp when the session was created (milliseconds since epoch)
  recording: boolean;
  mediaMode: 'ROUTED' | 'RELAYED';
  recordingMode: 'MANUAL' | 'ALWAYS';
  defaultRecordingProperties: IDefaultRecordingProperties; // Detailed recording properties
  customSessionId: string; // The custom session ID provided during session creation, often same as sessionId
  forcedVideoCodec: string; // e.g., "MEDIA_SERVER_PREFERRED"
  allowTranscoding: boolean;
  connections: IConnectionList; // Changed to use IConnectionList for consistency
}

/**
 * Represents a streamer, extending the generic participant.
 */
export interface IStreamer extends ISwingerSessionParticipant {
  isLive: boolean;
  streamTitle?: string;
  viewersCount: number;
}

/**
 * Sub-interface for the 'member' property within IStreamerEntity (from streamers.json).
 */
interface IStreamerEntityMember {
  id: number;
  username: string;
  userId: number;
}

/**
 * Sub-interface for the 'room' property within IStreamerEntity (from streamers.json).
 */
interface IStreamerEntityRoom {
  id: number;
  name: string;
  roomId: string; // Corresponds to OpenVidu's customSessionId
}

/**
 * Sub-interface for the 'connection' property within IStreamerEntity (from streamers.json).
 */
interface IStreamerEntityConnection {
  id: number; // A numeric ID for this specific connection entry in streamers.json
  name: string;
  status: string;
  member: number; // Foreign key to member ID
  timestamp: string;
  room: number; // Foreign key to room ID
  PRIVATE: boolean; // Note the casing, distinct from 'private' in IStreamerEntity itself
  ip: string;
  platform: string;
  GENDER_DESC: string | null;
  connectionId: string; // This is the OpenVidu connectionId
  USERID: number;
  active: boolean;
  end_connection: any | null;
  session: any | null;
  created_at: string;
  updated_at: string;
}

/**
 * Represents a top-level streamer entry as found in data/streamers.json.
 */
export interface IStreamerEntity {
  id: number;
  name: string;
  connectionId: string;
  private: boolean; // 'private' in IStreamerEntity
  json: any | null;
  timestamp: string; // ISO date string
  active: boolean;
  member: IStreamerEntityMember;
  room: IStreamerEntityRoom;
  connection: IStreamerEntityConnection;
  streamId: string;
  end_date: string | null;
  stream_duration: any | null;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  member_subscribers: ISubscriber[]; // Reusing existing ISubscriber
}

/**
 * Represents a detailed subscriber entry based on the structure of data/subscribers.json.
 * This interface provides a comprehensive view of a subscriber, including nested member, streamer, and room details.
 */
export interface ISubscriber {
  id: number; // Top-level ID, typically a number
  name: string;
  connectionId: string;
  streamerId: string;
  json: any | null;
  receivingFrom: string;
  timestamp: string;
  member: IMemberFull; // The main member associated with this subscriber entry
  streamer: IStreamerFull; // The streamer object this subscriber is connected to
  room: IRoom; // The room details associated with this subscriber
  active: boolean;
  streamId: string;
  subscribed_member: IMemberFull; // The member who is subscribed (can be different from 'member' field)
  created_at: string;
  updated_at: string;
}

/**
 * Represents an OpenVidu Publisher object.
 */
export interface IOpenViduPublisher extends Publisher {}

/**
 * Represents an OpenVidu Subscriber object.
 */
export interface IOpenViduSubscriber extends Subscriber {}

/**
 * Represents an OpenVidu Stream object.
 */
export interface IOpenViduStream extends Stream {}

/**
 * Represents an OpenVidu StreamManager object.
 */
export interface IOpenViduStreamManager extends StreamManager {}

// ----------------------------------------------------------------------------
// New Interfaces for Member API (from NestJS MemberModule)
// ----------------------------------------------------------------------------

/**
 * Represents the data transfer object for creating or updating a Member.
 * Closely mirrors NestJS CreateMemberDto, but uses string for Dates for consistency with JSON parsing.
 */
export interface IMemberDto {
  username: string;
  email: string;
  provider?: string; // Optional in DTO
  confirmed: boolean;
  blocked: boolean;
  role: number;
  memberSystemId: number; // Corresponds to `userId` in IMemberFull
  jsonData: any; // Generic for JSON data as per backend DTO
  blockedExpire?: string | null; // ISO Date string
  blockedStart?: string | null; // ISO Date string
  isPaid: boolean;
  createGroup: boolean;
  isEmployee: boolean;
  isOnline: boolean;
  memberType: string;
  picture?: string | null; // Optional in DTO
  adminUser?: any | null;
  latString?: string | null;
  lonString?: string | null;
  userSetting?: any | null;
  terms?: any | null;
}

/**
 * Represents a Member entity as returned from the API, including its ID and timestamps.
 */
export interface IMemberResponse extends IMemberDto {
  id: string; // UUID from the database/API
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
  createdById?: string; // Optional field, if the API returns the creator's ID
}

/**
 * Query parameters for paginated member searches, matching NestJS PaginationMemberQueryDto.
 */
export interface IMemberQueryDto extends Partial<IMemberDto> {
  page?: number;
  pageSize?: number;
  // All other fields from IMemberDto are optional for filtering
}

/**
 * Paginated result structure for member searches, matching NestJS PaginationMemberResultDto.
 */
export interface IMemberPaginatedResult {
  items: IMemberResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
