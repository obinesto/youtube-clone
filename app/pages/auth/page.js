"use client";
import { useState } from "react"
import useUserStore from "@/hooks/useStore"

export default function Auth() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { loginWithEmail, signUpWithEmail, loginWithGoogle, error } = useUserStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    await loginWithEmail(email, password)
  }

  return (
    <div className="min-h-screen bg-customWhite dark:bg-customDark flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-customDark dark:text-customWhite">Sign In</h2>
        {error && <p className="text-customRed mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 mb-4 border rounded text-customDark"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 mb-6 border rounded text-customDark"
            required
          />
          <button type="submit" className="w-full bg-customRed text-white p-2 rounded hover:bg-red-600">
            Sign In
          </button>
        </form>
        <div className="mt-4">
          <button onClick={loginWithGoogle} className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
            Sign In with Google
          </button>
        </div>
        <p className="mt-4 text-center text-customDark dark:text-customWhite">
          Don&apos;t have an account?{" "}
          <button onClick={() => signUpWithEmail(email, password)} className="text-customRed hover:underline">
            Sign Up
          </button>
        </p>
      </div>
    </div>
  )
}