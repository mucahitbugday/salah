import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { User } from '../types';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '314185582918-11u8evo15m2mbn7fplgt16s1d3v045so.apps.googleusercontent.com', // Replace with your actual client ID
});

export const signInWithGoogle = async (): Promise<User> => {
  try {
    // Check if Google Play Services are available
    await GoogleSignin.hasPlayServices();
    
    // Get user info from Google
    const userInfo = await GoogleSignin.signIn();
    
    if (!userInfo.idToken) {
      throw new Error('No ID token received');
    }
    
    // Create Firebase credential
    const googleCredential = auth.GoogleAuthProvider.credential(userInfo.idToken);
    
    // Sign in to Firebase
    const firebaseUser = await auth().signInWithCredential(googleCredential);
    
    if (!firebaseUser.user) {
      throw new Error('Firebase sign-in failed');
    }
    
    // Get or create user document in Firestore
    const userRef = firestore().collection('users').doc(firebaseUser.user.uid);
    const userDoc = await userRef.get();
    
    const user: User = {
      id: firebaseUser.user.uid,
      email: firebaseUser.user.email || '',
      name: firebaseUser.user.displayName?.split(' ')[0] || '',
      surname: firebaseUser.user.displayName?.split(' ').slice(1).join(' ') || '',
      photoUrl: firebaseUser.user.photoURL || undefined,
      provider: 'google',
    };
    
    if (!userDoc.exists) {
      // Create new user document
      await userRef.set({
        ...user,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Update existing user document
      await userRef.update({
        name: user.name,
        surname: user.surname,
        photoUrl: user.photoUrl,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    }
    
    return user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await GoogleSignin.signOut();
    await auth().signOut();
  } catch (error) {
    console.error('Sign-Out Error:', error);
    throw error;
  }
};

