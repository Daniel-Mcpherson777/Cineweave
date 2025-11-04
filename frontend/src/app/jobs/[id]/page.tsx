'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { api, JobStatusResponse } from '@/lib/api'

export default function JobPage() {
  const { getToken } = useAuth()
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  const [job, setJob] = useState<JobStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchJob = async () => {
    try {
      const token = await getToken()
      if (!token) return

      const jobData = await api.getJobStatus(token, jobId)
      setJob(jobData)
      setError('')
    } catch (err: any) {
      console.error('Failed to fetch job:', err)
      setError(err.response?.data?.detail || 'Failed to load job')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJob()

    // Poll for updates every 5 seconds if job is not done
    const interval = setInterval(() => {
      if (job?.status === 'queued' || job?.status === 'running') {
        fetchJob()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [jobId, getToken])

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'queued':
        return {
          color: 'text-yellow-400',
          bg: 'bg-yellow-400/10',
          border: 'border-yellow-400/20',
          icon: '⏳',
          message: 'Your video is in the queue and will start generating soon...',
        }
      case 'running':
        return {
          color: 'text-blue-400',
          bg: 'bg-blue-400/10',
          border: 'border-blue-400/20',
          icon: '⟳',
          message: 'Your video is being generated on our GPU cluster...',
        }
      case 'done':
        return {
          color: 'text-green-400',
          bg: 'bg-green-400/10',
          border: 'border-green-400/20',
          icon: '✓',
          message: 'Your video is ready! Download it below (available for 24 hours)',
        }
      case 'failed':
        return {
          color: 'text-red-400',
          bg: 'bg-red-400/10',
          border: 'border-red-400/20',
          icon: '✗',
          message: 'Video generation failed. Your credits have been refunded.',
        }
      default:
        return {
          color: 'text-gray-400',
          bg: 'bg-gray-400/10',
          border: 'border-gray-400/20',
          icon: '•',
          message: 'Processing...',
        }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="card text-center py-12">
            <div className="text-4xl mb-4">⟳</div>
            <div className="text-xl font-semibold">Loading...</div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="card text-center py-12">
            <div className="text-4xl mb-4">❌</div>
            <div className="text-xl font-semibold mb-2">Error</div>
            <div className="text-gray-400 mb-6">{error || 'Job not found'}</div>
            <button onClick={() => router.push('/dashboard')} className="btn-secondary">
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    )
  }

  const statusInfo = getStatusInfo(job.status)
  const expiresIn = job.expiresAt ? Math.max(0, job.expiresAt - Date.now()) : 0
  const hoursRemaining = Math.floor(expiresIn / (1000 * 60 * 60))
  const minutesRemaining = Math.floor((expiresIn % (1000 * 60 * 60)) / (1000 * 60))

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-white mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold mb-2">Video Generation</h1>
          <p className="text-gray-400">Track your video generation progress</p>
        </div>

        {/* Status Card */}
        <div className={`card ${statusInfo.bg} ${statusInfo.border} mb-6`}>
          <div className="flex items-center space-x-4 mb-4">
            <div className="text-4xl">{statusInfo.icon}</div>
            <div className="flex-1">
              <h2 className={`text-2xl font-bold ${statusInfo.color} capitalize`}>
                {job.status}
              </h2>
              <p className="text-gray-300 mt-1">{statusInfo.message}</p>
            </div>
          </div>

          {/* Progress indicator for queued/running */}
          {(job.status === 'queued' || job.status === 'running') && (
            <div className="mt-4">
              <div className="w-full bg-background-dark rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-cinematic animate-pulse"
                  style={{
                    width: job.status === 'queued' ? '30%' : '70%',
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {job.status === 'queued'
                  ? 'Waiting for available GPU...'
                  : 'Generating video frames...'}
              </p>
            </div>
          )}
        </div>

        {/* Video Player */}
        {job.status === 'done' && job.r2Url && (
          <div className="card mb-6">
            <h3 className="text-xl font-semibold mb-4">Your Video</h3>
            <div className="bg-black rounded-lg overflow-hidden mb-4">
              <video
                controls
                className="w-full"
                src={job.r2Url}
                poster="/video-placeholder.jpg"
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Expires in {hoursRemaining}h {minutesRemaining}m
              </div>
              <a
                href={job.r2Url}
                download
                className="btn-primary"
              >
                Download Video
              </a>
            </div>
          </div>
        )}

        {/* Job Details */}
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Job Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-gray-800">
              <span className="text-gray-400">Prompt</span>
              <span className="font-medium text-right max-w-md">{job.prompt}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-800">
              <span className="text-gray-400">Duration</span>
              <span className="font-medium">{job.durationSec} seconds</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-800">
              <span className="text-gray-400">Credits Used</span>
              <span className="font-medium">{job.creditsUsed} credits</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-800">
              <span className="text-gray-400">Created At</span>
              <span className="font-medium">
                {new Date(job.createdAt).toLocaleString()}
              </span>
            </div>
            {job.expiresAt && (
              <div className="flex items-center justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">Expires At</span>
                <span className="font-medium">
                  {new Date(job.expiresAt).toLocaleString()}
                </span>
              </div>
            )}
            {job.errorMessage && (
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-400">Error</span>
                <span className="font-medium text-red-400">{job.errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex space-x-4">
          {job.status === 'done' && (
            <button
              onClick={() => router.push('/create')}
              className="btn-primary flex-1"
            >
              Create Another Video
            </button>
          )}
          {job.status === 'failed' && (
            <button
              onClick={() => router.push('/create')}
              className="btn-primary flex-1"
            >
              Try Again
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
