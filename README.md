# YouTube Clone

A modern, feature-rich YouTube clone built with Next.js 15, React, and Supabase. This application replicates core YouTube functionalities with a clean, responsive interface.

## 🚀 Features

- **Authentication**
  - Email/Password and Google sign-in
  - Protected routes for authenticated features
  - Password reset functionality

- **Video Experience**
  - YouTube video playback with custom controls
  - Video preview on hover
  - Support for quality selection and fullscreen
  - Video progress tracking
  - Keyboard shortcuts for playback control

- **Core Functionalities**
  - Video likes system
  - Watch later playlist
  - Watch history tracking
  - Video search and discovery
  - Related videos suggestions
  - Trending videos section
  - User library management

- **User Features**
  - Personal video library
  - Liked videos collection
  - Watch history
  - Watch later playlist
  - Video upload and management

- **UI/UX**
  - Responsive design for all devices
  - Dark/Light mode toggle
  - Modern UI with Tailwind CSS
  - Loading states and error handling
  - Toast notifications
  - Infinite scroll support

## 🛠️ Technology Stack

- **Frontend**
  - Next.js 15
  - React 19
  - TanStack Query for data fetching
  - Tailwind CSS for styling
  - Radix UI for accessible components
  - Zustand for state management

- **Backend & Database**
  - Supabase for database and authentication
  - Firebase for additional services
  - YouTube Data API integration

## 📦 Dependencies

- Next.js and React ecosystem
- @radix-ui components for UI
- @supabase/supabase-js for database operations
- @tanstack/react-query for data management
- Firebase for additional services
- Various UI utilities and helpers

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/obinesto/youtube-clone.git
   cd youtube-clone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
   YOUTUBE_API_KEY=your_youtube_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## 🏗️ Project Structure

```
youtube-clone/
├── app/                   # Next.js app directory
│   ├── api/              # API routes
│   ├── auth/             # Authentication pages
│   └── [other routes]/   # Application routes
├── components/           # React components
│   ├── ui/              # UI components
│   └── [feature]/       # Feature components
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and helpers
└── public/             # Static assets
```

## 🔒 Protected Features

The following features require authentication:
- Liked videos
- Watch later
- Watch history
- Subscriptions
- Video upload and management
- User profile management

## 🎮 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
