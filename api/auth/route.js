import { auth } from "../../../lib/utils/firebase"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth"
import { NextResponse } from "next/server"

export async function POST(request) {
  const { action, email, password } = await request.json()

  try {
    let result
    switch (action) {
      case "signIn":
        result = await signInWithEmailAndPassword(auth, email, password)
        break
      case "signUp":
        result = await createUserWithEmailAndPassword(auth, email, password)
        break
      case "signOut":
        await signOut(auth)
        return NextResponse.json({ success: true })
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const token = await result.user.getIdToken()
    return NextResponse.json({ token })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

