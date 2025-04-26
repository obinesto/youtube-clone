import { create } from "zustand";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import { auth } from "../lib/utils/firebase";
import {
  findUserByEmail,
  createUser,
  updateUserFirebaseUid,
} from "../lib/utils/database/users";

const provider = new GoogleAuthProvider();

const useUserStore = create((set) => ({
  user: null,
  token: null,
  loading: true,
  error: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  logout: async () => {
    try {
      await signOut(auth);
      set({ user: null, token: null, isAuthenticated: false, error: null });
    } catch (error) {
      set({ error: error.message });
    }
  },

  loginWithGoogle: async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      if (!result.user) {
        throw new Error("No user data returned from Google sign-in");
      }

      try {
        // Check if user exists in Supabase
        const supabaseUser = await findUserByEmail(result.user.email);

        if (!supabaseUser) {
          // If user doesn't exist, create a new user
          await createUser({
            email: result.user.email,
            username: result.user.displayName,
            firebaseUid: result.user.uid,
          });
        } else if (!supabaseUser.firebase_uid) {
          // If user exists but doesn't have firebase_uid, update it
          await updateUserFirebaseUid(result.user.email, result.user.uid);
        }

        const token = await result.user.getIdToken();
        set({
          user: result.user,
          token,
          error: null,
          isAuthenticated: true,
        });
      } catch (error) {
        console.error("Database operation failed:", error);
        // Sign the user out if there is no sync between firebase and database
        await signOut(auth);
        throw new Error("Failed to create user profile. Please try again.");
      }
    } catch (error) {
      console.error("Google login failed:", error);
      set({
        user: null,
        token: null,
        error: error.message,
        isAuthenticated: false,
      });
      return false;
    }
  },

  signUpWithEmail: async (formData) => {
    const { email, password, username } = formData;
    try {
      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        throw new Error("Email address already in use");
      }
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Create Supabase user record
      await createUser({
        email,
        username,
        firebaseUid: result.user.uid,
      });

      // Update Firebase profile with username
      if (username) {
        await updateProfile(result.user, {
          displayName: username,
        });
      }

      const token = await result.user.getIdToken();
      set({
        user: result.user,
        token,
        error: null,
        isAuthenticated: true,
      });
    } catch (error) {
      let errorMessage = error.message;
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email address already in use";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak";
      }
      set({ error: errorMessage });
      throw error;
    }
  },

  loginWithEmail: async (email, password) => {
    try {
      const user = await findUserByEmail(email);
      if (!user) {
        throw new Error("No account exists with this email address");
      }

      const result = await signInWithEmailAndPassword(auth, email, password);

      // If user exists but doesn't have firebase_uid, update it
      if (!user.firebase_uid) {
        await updateUserFirebaseUid(email, result.user.uid);
      }

      const token = await result.user.getIdToken();
      set({
        user: result.user,
        token,
        error: null,
        isAuthenticated: true,
      });
    } catch (error) {
      let errorMessage = error.message;
      if (error.code === "auth/wrong-password") {
        errorMessage = "Invalid password";
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "No account exists with this email address";
      }
      set({ error: errorMessage });
      throw error;
    }
  },

  resetPassword: async (email) => {
    try {
      const user = await findUserByEmail(email);
      if (!user) {
        throw new Error("No account exists with this email address");
      }

      await sendPasswordResetEmail(auth, email);
      set({ error: null });
    } catch (error) {
      let errorMessage = "Failed to send reset email";

      if (error.message === "No account exists with this email address") {
        errorMessage = error.message;
      } else {
        switch (error.code) {
          case "auth/user-not-found":
            errorMessage = "No account exists with this email address";
            break;
          case "auth/invalid-email":
            errorMessage = "Invalid email address";
            break;
          case "auth/too-many-requests":
            errorMessage = "Too many attempts. Please try again later";
            break;
          default:
            errorMessage = error.message;
        }
      }

      set({ error: errorMessage });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

// auth state listener
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const token = await user.getIdToken();
    useUserStore.setState({
      user,
      token,
      loading: false,
      isAuthenticated: true,
    });
  } else {
    useUserStore.setState({
      user: null,
      token: null,
      loading: false,
      isAuthenticated: false,
    });
  }
});

export default useUserStore;
