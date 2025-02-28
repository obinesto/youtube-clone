"use client";
import { Moon, Sun } from "lucide-react"
import { useTheme } from "./ThemeProvider"

const ModeToggle = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      {theme === "light" ? <Sun className="h-6 w-6 text-yellow-500" /> : <Moon className="h-6 w-6 text-blue-400" />}
    </button>
  )
}

export default ModeToggle