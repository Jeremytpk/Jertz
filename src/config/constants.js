export const ROOM_MODES = {
  STANDARD: 'STANDARD', // Vibing mode - focus on music and chat
  CHALLENGE: 'CHALLENGE', // Gaming mode - focus on image voting
};

export const USER_ROLES = {
  HOST: 'HOST',
  GUEST: 'GUEST',
};

export const MUSIC_SOURCES = {
  UPLOAD: 'UPLOAD', // User uploaded file (WAV/MP3)
  YOUTUBE: 'YOUTUBE', // YouTube integration
};

export const MAX_ROOM_CAPACITY = 50;
export const MAX_FILE_SIZE_MB = 50;
export const CHALLENGE_IMAGE_SIZE = 300; // 300x300px

export const VOICE_REACTIONS = [
  { id: 'thumbsup', label: 'Nice!', emoji: '👍', sound: 'thumbsup.mp3' },
  { id: 'fire', label: 'Fire!', emoji: '🔥', sound: 'fire.mp3' },
  { id: 'next', label: 'Next!', emoji: '⏭️', sound: 'next.mp3' },
  { id: 'boo', label: 'Boooo!', emoji: '👎', sound: 'boo.mp3' },
  { id: 'love', label: 'Love it!', emoji: '❤️', sound: 'love.mp3' },
  { id: 'wow', label: 'Wow!', emoji: '😮', sound: 'wow.mp3' },
  { id: 'laugh', label: 'LOL', emoji: '😂', sound: 'laugh.mp3' },
];

export const PROMOTED_SONG_DURATION = 7000; // 7 seconds

export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_EMAIL: 'Please enter a valid email address',
    WEAK_PASSWORD: 'Password must be at least 6 characters',
    EMAIL_IN_USE: 'This email is already registered',
    USER_NOT_FOUND: 'No account found with this email',
    WRONG_PASSWORD: 'Incorrect password',
  },
  UPLOAD: {
    FILE_TOO_LARGE: `File size must be less than ${MAX_FILE_SIZE_MB}MB`,
    INVALID_FORMAT: 'Only MP3 and WAV files are supported',
    UPLOAD_FAILED: 'Failed to upload file. Please try again.',
  },
  ROOM: {
    ROOM_FULL: 'This room is at maximum capacity',
    ROOM_NOT_FOUND: 'Room not found or has ended',
    JOIN_FAILED: 'Failed to join room. Please try again.',
  },
};

export const LIABILITY_WAIVER_TEXT = `
I certify that I am the rightful owner of this content or have obtained proper authorization to share it. 
I understand and agree that I assume full legal liability for any copyright infringement or other legal issues 
that may arise from uploading and sharing this content on Jertz. 

By proceeding, I release Jertz and its operators from any responsibility related to this upload.
`;
