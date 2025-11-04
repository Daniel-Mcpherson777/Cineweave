'use client'

import { useEffect, useState } from 'react'
import { useUser, useAuth } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api as convexApi } from '@/convex/_generated/api'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const router = useRouter()
  const [credits, setCredits] = useState<number | null>(null)
  const [plan, setPlan] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Initialize user and fetch credits
  useEffect(() => {
    async function init() {
      if (!user) return

      try {
        const token = await getToken()
        if (!token) return

        // Initialize user in backend
        await api.initializeUser(token)

        // Fetch credits
        const creditsData = await api.getCredits(token)
        setCredits(creditsData.credits)
        setPlan(creditsData.plan)
      } catch (error) {
        console.error('Failed to initialize:', error)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [user, getToken])

  // Fetch recent jobs from Convex (real-time)
  const userId = user?.id
  // Note: This would need the Convex user ID, not Clerk ID
  // For now, we'll fetch via API
  const [recentJobs, setRecentJobs] = useState<any[]>([])

  useEffect(() => {
    async function fetchJobs() {
      if (!user) return

      try {
        const token = await getToken()
        if (!token) return

        const jobs = await api.listJobs(token, 5)
        setRecentJobs(jobs)
      } catch (error) {
        console.error('Failed to fetch jobs:', error)
      }
    }

    fetchJobs()
    // Poll every 10 seconds for updates
    const interval = setInterval(fetchJobs, 10000)
    return () => clearInterval(interval)
  }, [user, getToken])

  if (!user) {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'text-green-400'
      case 'running':
        return 'text-blue-400'
      case 'queued':
        return 'text-yellow-400'
      case 'failed':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return '✓'
      case 'running':
        return '⟳'
      case 'queued':
        return '⋯'
      case 'failed':
        return '✗'
      default:
        return '•'
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {user.firstName || 'Creator'}!
          </h1>
          <p className="text-gray-400">
            Create stunning AI-generated videos in seconds
          </p>
        </div>

        {/* Credits Card */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="card md:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Credits</h2>
              <div className="text-2xl">💳</div>
            </div>
            {loading ? (
              <div className="text-2xl font-bold text-gray-400">Loading...</div>
            ) : (
              <>
                <div className="text-4xl font-bold bg-gradient-cinematic bg-clip-text text-transparent mb-2">
                  {credits}
                </div>
                <p className="text-sm text-gray-400 capitalize">{plan} Plan</p>
                <div className="mt-4 text-xs text-gray-500">
                  1 credit = 5 seconds of video
                </div>
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card md:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Link href="/create" className="block">
                <div className="p-6 bg-gradient-cinematic rounded-lg hover:opacity-90 transition-opacity cursor-pointer">
                  <div className="text-3xl mb-2">🎬</div>
                  <h3 className="font-semibold mb-1">Create Video</h3>
                  <p className="text-sm opacity-90">
                    Generate a new cinematic video
                  </p>
                </div>
              </Link>
              <Link href="/account" className="block">
                <div className="p-6 bg-background-dark rounded-lg hover:bg-background-light transition-colors cursor-pointer border border-gray-700">
                  <div className="text-3xl mb-2">💰</div>
                  <h3 className="font-semibold mb-1">Manage Plan</h3>
                  <p className="text-sm text-gray-400">
                    Upgrade or add more credits
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recent Videos</h2>
            <Link href="/jobs" className="text-primary-purple hover:text-primary-red transition-colors">
              View All →
            </Link>
          </div>

          {recentJobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎥</div>
              <h3 className="text-xl font-semibold mb-2">No videos yet</h3>
              <p className="text-gray-400 mb-6">
                Create your first AI-generated video to get started
              </p>
              <Link href="/create">
                <button className="btn-primary">Create Your First Video</button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div
                  key={job._id}
                  className="flex items-center justify-between p-4 bg-background-dark rounded-lg hover:bg-background-light transition-colors cursor-pointer"
                  onClick={() => router.push(`/jobs/${job._id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`text-xl ${getStatusColor(job.status)}`}>
                        {getStatusIcon(job.status)}
                      </span>
                      <h3 className="font-semibold">{job.prompt.substring(0, 60)}...</h3>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>{job.durationSec}s video</span>
                      <span>•</span>
                      <span>{job.creditsUsed} credits</span>
                      <span>•</span>
                      <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`text-sm font-semibold ${getStatusColor(job.status)} capitalize`}>
                      {job.status}
                    </span>
                    <span className="text-gray-400">→</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="mt-8 p-6 bg-primary-purple/10 border border-primary-purple/20 rounded-lg">
          <h3 className="font-semibold mb-2">💡 Pro Tip</h3>
          <p className="text-sm text-gray-300">
            For best results, use descriptive prompts with specific details about the scene,
            lighting, and camera movement. Example: "A drone flies through a neon-lit cityscape
            at night, cinematic camera movement"
          </p>
        </div>
      </main>
    </div>
  )
}
