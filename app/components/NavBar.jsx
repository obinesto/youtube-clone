"use client";
import Link from "next/link"
import { Search, Menu, Bell, User } from "lucide-react"
import useUserStore from "@/hooks/useStore"

const NavBar = () => {
  const { user, logout } = useUserStore()

  return (
    <nav className="bg-customWhite dark:bg-customDark text-customDark dark:text-customWhite py-4 px-6 flex items-center justify-between">
      <div className="flex items-center">
        <button className="mr-4">
          <Menu className="h-6 w-6" />
        </button>
        <Link href="/" className="text-2xl font-bold text-customRed">
          YouTube Clone
        </Link>
      </div>
      <div className="flex-1 max-w-xl mx-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            className="w-full py-2 px-4 rounded-full bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-customRed"
          />
          <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Search className="h-5 w-5 text-gray-500 dark:text-gray-300" />
          </button>
        </div>
      </div>
      <div className="flex items-center">
        <button className="mr-4">
          <Bell className="h-6 w-6" />
        </button>
        {user ? (
          <div className="flex items-center">
            <img
              src={user.photoURL || "https://via.placeholder.com/32"}
              alt="User"
              className="w-8 h-8 rounded-full mr-2"
            />
            <button onClick={logout} className="text-sm hover:text-customRed">
              Logout
            </button>
          </div>
        ) : (
          <Link href="/auth" className="flex items-center text-customRed hover:text-customRed">
            <User className="h-6 w-6 mr-1" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </nav>
  )
}

export default NavBar