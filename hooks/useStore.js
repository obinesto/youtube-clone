import { create } from "zustand"
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
} from "firebase/auth"
import { auth } from "../lib/utils/firebase"

const provider = new GoogleAuthProvider()

const useUserStore = create((set) => ({
  user: null,
  token: null,
  loading: true,
  error: null,

  setUser: (user) => set({ user }),

  logout: async () => {
    await signOut(auth)
    set({ user: null, token: null })
  },

  loginWithGoogle: async () => {
    try {
      const result = await signInWithPopup(auth, provider)
      if (result.user) {
        const token = await result.user.getIdToken()
        set({ user: result.user, token, error: null })
      }
    } catch (error) {
      set({ error: error.message })
    }
  },

  signUpWithEmail: async (email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      const token = await result.user.getIdToken()
      set({ user: result.user, token, error: null })
    } catch (error) {
      set({ error: error.message })
    }
  },

  loginWithEmail: async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      const token = await result.user.getIdToken()
      set({ user: result.user, token, error: null })
    } catch (error) {
      set({ error: error.message })
    }
  },

  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email)
      set({ error: null })
    } catch (error) {
      set({ error: error.message })
    }
  },
}))

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const token = await user.getIdToken()
    useUserStore.setState({ user, token, loading: false })
  } else {
    useUserStore.setState({ user: null, token: null, loading: false })
  }
})

export default useUserStore