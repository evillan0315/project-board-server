import {
  MediaFileResponseDto,
  Track,
  FileType,
} from '@/types/refactored/media';
import { getFileStreamUrl } from '@/api/media';

/**
 * Maps a backend MediaFileResponseDto to a frontend Track interface.
 * This utility handles the conversion and generates the appropriate media source URL.
 */
export const mapMediaFileToTrack = (mediaFile: MediaFileResponseDto): Track => {
  const streamUrl = getFileStreamUrl(mediaFile.path);

  // Determine title, artist, album, coverArt based on available metadata or song/video object
  let title = mediaFile.name;
  let artist = 'Unknown Artist';
  let album = 'Unknown Album';
  let coverArt: string | undefined = undefined;
  let duration: number | undefined = undefined;

  // Prioritize song/video specific data
  if (mediaFile.song) {
    title = mediaFile.song.title;
    duration = mediaFile.song.duration;
    // Assuming artist and album info would be linked via song.artistId/albumId if available
  } else if (mediaFile.video) {
    title = mediaFile.video.title;
    duration = mediaFile.video.duration;
  }

  // Then check generic metadata
  if (mediaFile.metadata && mediaFile.metadata.length > 0) {
    const audioMetadata = mediaFile.metadata.find(
      (meta) => meta.type === FileType.AUDIO,
    );
    const videoMetadata = mediaFile.metadata.find(
      (meta) => meta.type === FileType.VIDEO,
    );

    if (audioMetadata?.data?.title) title = audioMetadata.data.title;
    // Assuming tags represent artists/genres if not explicitly in song.artist
    if (audioMetadata?.tags && audioMetadata.tags.length > 0)
      artist = audioMetadata.tags.join(', ');
    if (audioMetadata?.data?.thumbnail) coverArt = audioMetadata.data.thumbnail;

    if (videoMetadata?.data?.title) title = videoMetadata.data.title;
    if (videoMetadata?.data?.thumbnail) coverArt = videoMetadata.data.thumbnail;
  }

  return {
    id: mediaFile.id,
    mediaFileId: mediaFile.id,
    title,
    artist,
    album,
    coverArt,
    duration: duration || 0, // Ensure duration is a number, default to 0
    mediaSrc: streamUrl,
    fileType: mediaFile.fileType,
    mimeType: mediaFile.mimeType,
    size: mediaFile.size,
    provider: mediaFile.provider,
    url: mediaFile.url,
    createdAt: mediaFile.createdAt,
    updatedAt: mediaFile.updatedAt,
    createdById: mediaFile.createdById,
    folderId: mediaFile.folderId,
    content: mediaFile.content,
    songId: mediaFile.songId,
    videoId: mediaFile.videoId,
    song: mediaFile.song,
    video: mediaFile.video,
  };
};
