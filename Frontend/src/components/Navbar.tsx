import React from 'react'
import { Link, useLocation } from 'react-router-dom'

interface NavItem {
  label: string
  path: string
}

export default function Navbar() {
  const location = useLocation()

  const navItems: NavItem[] = [
    { label: 'Email', path: '/email' },
    { label: 'Doc Summary', path: '/doc' },
    { label: 'Find Location', path: '/map' },
  ]

  return (
    <nav className="bg-black border-b border-purple-500/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold text-purple-500">AI Agentic Platform</h1>
          </div>
          <div className="flex space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'text-purple-500 bg-purple-500/10'
                    : 'text-white hover:text-purple-400 hover:bg-purple-500/5'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

