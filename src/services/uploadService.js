import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../config/firebase';

/**
 * Upload audio file to Firebase Storage
 */
export const uploadAudioFile = async (file, userId, onProgress) => {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `tracks/${userId}/${fileName}`);
    
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  } catch (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
};

/**
 * Save track metadata to Firestore
 */
export const saveTrackMetadata = async (trackData) => {
  try {
    const docRef = await addDoc(collection(db, 'tracks'), {
      ...trackData,
      uploadedAt: serverTimestamp(),
      plays: 0,
    });
    return docRef.id;
  } catch (error) {
    throw new Error(`Failed to save track: ${error.message}`);
  }
};

/**
 * Upload image to Firebase Storage
 */
export const uploadImage = async (file, userId, folder = 'images') => {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `${folder}/${userId}/${fileName}`);
    
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        null,
        (error) => reject(error),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  } catch (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }
};
