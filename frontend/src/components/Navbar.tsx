'use client'

import Link from 'next/link'
import { useUser, UserButton } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

export default function Navbar() {
  const { user } = useUser()

  return (
    <nav className="border-b border-gray-800 bg-background-dark/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="text-2xl font-bold bg-gradient-cinematic bg-clip-text text-transparent">
              🎬 CineWeave
            </div>
          </Link>

          {/* Nav Links */}
          {user && (
            <div className="flex items-center space-x-6">
              <Link
                href="/dashboard"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/create"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Create
              </Link>
              <Link
                href="/account"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Account
              </Link>

              {/* User Button */}
              <UserButton afterSignOutUrl="/" />
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
