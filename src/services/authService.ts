import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { User } from '../types';
import Logger from '../core/Logger';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '314185582918-fgpiebmdvecgnd9o0adrlr71t5rgbu43.apps.googleusercontent.com', // Replace with your actual client ID
});

export const signInWithGoogle = async (): Promise<User> => {
  try {
    // Check if Google Play Services are available
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    
    // Get user info from Google
    const userInfo = await GoogleSignin.signIn();
    
    // Type guard: check if sign-in was successful
    if (!userInfo.data || !('idToken' in userInfo.data) || !userInfo.data.idToken) {
      throw new Error('No ID token received from Google');
    }
    
    const idToken = userInfo.data.idToken;
    
    // Create Firebase credential
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    
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
    
    Logger.info('Google Sign-In successful', { userId: user.id });
    return user;
  } catch (error: any) {
    Logger.error('Google Sign-In Error', error);
    
    // Handle specific error codes
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Kullanıcı girişi iptal etti');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Giriş işlemi devam ediyor');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services kullanılamıyor');
    } else if (error.code === '10' || error.code === 10 || error.message?.includes('DEVELOPER_ERROR')) {
      // DEVELOPER_ERROR - Configuration issue
      const sha1Fingerprint = '5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25';
      throw new Error(
        'DEVELOPER_ERROR: Google Cloud Console yapılandırmasını kontrol edin.\n\n' +
        'ADIM ADIM KONTROL LİSTESİ:\n\n' +
        '1. Firebase Console:\n' +
        '   → https://console.firebase.google.com/\n' +
        '   → Projenizi seçin\n' +
        '   → Build > Authentication > Sign-in method\n' +
        '   → Google\'ı etkinleştirin ve kaydedin\n\n' +
        '2. Google Cloud Console:\n' +
        '   → https://console.cloud.google.com/\n' +
        '   → Aynı projeyi seçin\n' +
        '   → APIs & Services > Credentials\n\n' +
        '3. WEB Client ID oluşturun:\n' +
        '   → Create Credentials > OAuth client ID\n' +
        '   → Application type: Web application\n' +
        '   → Client ID\'yi kopyalayın\n' +
        '   → Bu ID\'yi src/services/authService.ts dosyasındaki webClientId\'ye yapıştırın\n\n' +
        '4. Android Client ID oluşturun:\n' +
        '   → Create Credentials > OAuth client ID\n' +
        '   → Application type: Android\n' +
        '   → Package name: com.salah\n' +
        '   → SHA-1 certificate fingerprint: ' + sha1Fingerprint + '\n' +
        '   → Create butonuna tıklayın\n\n' +
        '5. Uygulamayı yeniden build edin:\n' +
        '   → npm run android\n\n' +
        'Detaylı bilgi: https://react-native-google-signin.github.io/docs/troubleshooting'
      );
    } else if (error.message?.includes('A non-recoverable sign in failure occurred')) {
      throw new Error('Giriş hatası. Lütfen tekrar deneyin.');
    }
    
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

