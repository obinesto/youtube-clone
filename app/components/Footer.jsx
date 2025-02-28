"use client";
const Footer = () => {
    return (
      <footer className="bg-customWhite dark:bg-customDark text-customDark dark:text-customWhite py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-between items-center">
            <div className="w-full md:w-1/3 mb-6 md:mb-0">
              <h2 className="text-xl font-bold">YouTube Clone</h2>
              <p className="mt-2">A project built with Next.js and React</p>
            </div>
            <div className="w-full md:w-1/3 mb-6 md:mb-0">
              <h3 className="text-lg font-semibold mb-2">Quick Links</h3>
              <ul>
                <li>
                  <a href="/" className="hover:text-customRed">
                    Home
                  </a>
                </li>
                <li>
                  <a href="/trending" className="hover:text-customRed">
                    Trending
                  </a>
                </li>
                <li>
                  <a href="/subscriptions" className="hover:text-customRed">
                    Subscriptions
                  </a>
                </li>
                <li>
                  <a href="/library" className="hover:text-customRed">
                    Library
                  </a>
                </li>
              </ul>
            </div>
            <div className="w-full md:w-1/3">
              <h3 className="text-lg font-semibold mb-2">Connect</h3>
              <ul>
                <li>
                  <a href="#" className="hover:text-customRed">
                    GitHub
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-customRed">
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-customRed">
                    Twitter
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p>&copy; 2024 YouTube Clone. All rights reserved.</p>
          </div>
        </div>
      </footer>
    )
  }
  
  export default Footer  