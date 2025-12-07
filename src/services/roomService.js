import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Create a new room
 */
export const createRoom = async (roomData) => {
  try {
    const docRef = await addDoc(collection(db, 'rooms'), {
      ...roomData,
      createdAt: serverTimestamp(),
      currentParticipants: 1,
      isActive: true,
    });
    return docRef.id;
  } catch (error) {
    throw new Error(`Failed to create room: ${error.message}`);
  }
};

/**
 * Join a room
 */
export const joinRoom = async (roomId, userId) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      currentParticipants: increment(1),
      [`participants.${userId}`]: {
        joinedAt: serverTimestamp(),
        isHost: false,
      },
    });
  } catch (error) {
    throw new Error(`Failed to join room: ${error.message}`);
  }
};

/**
 * Leave a room
 */
export const leaveRoom = async (roomId, userId) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      currentParticipants: increment(-1),
      [`participants.${userId}`]: null,
    });
  } catch (error) {
    throw new Error(`Failed to leave room: ${error.message}`);
  }
};

/**
 * Get room data
 */
export const getRoomData = async (roomId) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    
    if (roomSnap.exists()) {
      return { id: roomSnap.id, ...roomSnap.data() };
    } else {
      throw new Error('Room not found');
    }
  } catch (error) {
    throw new Error(`Failed to get room: ${error.message}`);
  }
};

/**
 * Listen to room updates
 */
export const subscribeToRoom = (roomId, callback) => {
  const roomRef = doc(db, 'rooms', roomId);
  return onSnapshot(roomRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    }
  });
};

/**
 * Send message to room
 */
export const sendMessage = async (roomId, messageData) => {
  try {
    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    await addDoc(messagesRef, {
      ...messageData,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    throw new Error(`Failed to send message: ${error.message}`);
  }
};

/**
 * Listen to room messages
 */
export const subscribeToMessages = (roomId, callback) => {
  const messagesRef = collection(db, 'rooms', roomId, 'messages');
  const q = query(messagesRef);
  
  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    callback(messages);
  });
};

/**
 * Update current track in room
 */
export const updateRoomTrack = async (roomId, trackData) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      currentTrack: trackData,
      lastTrackUpdate: serverTimestamp(),
    });
  } catch (error) {
    throw new Error(`Failed to update track: ${error.message}`);
  }
};

/**
 * Get active rooms
 */
export const getActiveRooms = async () => {
  try {
    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    
    const rooms = [];
    querySnapshot.forEach((doc) => {
      rooms.push({ id: doc.id, ...doc.data() });
    });
    
    return rooms;
  } catch (error) {
    throw new Error(`Failed to get rooms: ${error.message}`);
  }
};

/**
 * End room
 */
export const endRoom = async (roomId) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      isActive: false,
      endedAt: serverTimestamp(),
    });
  } catch (error) {
    throw new Error(`Failed to end room: ${error.message}`);
  }
};
