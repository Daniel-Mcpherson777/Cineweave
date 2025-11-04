'use client'

import { useState } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { api } from '@/lib/api'

export default function CreatePage() {
  const { getToken } = useAuth()
  const { user } = useUser()
  const router = useRouter()

  const [prompt, setPrompt] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [duration, setDuration] = useState<5 | 10 | 15>(5)
  const [seed, setSeed] = useState('')
  const [cfg, setCfg] = useState(7.5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const creditsNeeded = duration / 5

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await api.createJob(token, {
        prompt,
        imageUrl: imageUrl || undefined,
        durationSec: duration,
        seed: seed ? parseInt(seed) : undefined,
        cfg,
      })

      // Redirect to job page
      router.push(`/jobs/${response.jobId}`)
    } catch (err: any) {
      console.error('Failed to create job:', err)
      setError(
        err.response?.data?.detail || err.message || 'Failed to create video'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Create Video</h1>
          <p className="text-gray-400">
            Generate cinematic AI videos from text or images
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Prompt */}
          <div className="card">
            <label className="block text-sm font-semibold mb-2">
              Prompt <span className="text-red-400">*</span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the video you want to create... e.g., 'A drone flies through a neon-lit cityscape at night, cinematic camera movement'"
              className="input-field min-h-[120px] resize-y"
              required
              maxLength={500}
            />
            <div className="mt-2 text-xs text-gray-400 text-right">
              {prompt.length}/500
            </div>
          </div>

          {/* Image URL (Optional) */}
          <div className="card">
            <label className="block text-sm font-semibold mb-2">
              Starting Image (Optional)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="input-field"
            />
            <p className="mt-2 text-xs text-gray-400">
              Provide a URL to an image to use as the starting frame for your video
            </p>
          </div>

          {/* Duration */}
          <div className="card">
            <label className="block text-sm font-semibold mb-4">
              Duration <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-4">
              {[5, 10, 15].map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setDuration(dur as 5 | 10 | 15)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    duration === dur
                      ? 'border-primary-purple bg-primary-purple/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="text-2xl font-bold">{dur}s</div>
                  <div className="text-sm text-gray-400 mt-1">
                    {dur / 5} credit{dur > 5 ? 's' : ''}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Options */}
          <details className="card">
            <summary className="cursor-pointer font-semibold text-sm">
              Advanced Options
            </summary>
            <div className="mt-4 space-y-4">
              {/* Seed */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Seed (Optional)
                </label>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="Random"
                  className="input-field"
                />
                <p className="mt-2 text-xs text-gray-400">
                  Use the same seed to reproduce results
                </p>
              </div>

              {/* CFG Scale */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Guidance Scale: {cfg}
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={cfg}
                  onChange={(e) => setCfg(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="mt-2 text-xs text-gray-400">
                  Higher values = more adherence to prompt (7-10 recommended)
                </p>
              </div>
            </div>
          </details>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="card bg-gradient-cinematic/10 border-primary-purple/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-semibold">Ready to generate?</div>
                <div className="text-sm text-gray-400">
                  This will use {creditsNeeded} credit{creditsNeeded > 1 ? 's' : ''}
                </div>
              </div>
              <div className="text-2xl font-bold">
                {creditsNeeded} credit{creditsNeeded > 1 ? 's' : ''}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !prompt}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Video'}
            </button>
          </div>
        </form>

        {/* Tips */}
        <div className="mt-8 space-y-4">
          <h3 className="font-semibold">Tips for better results:</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• Be specific with your descriptions (lighting, mood, camera movement)</li>
            <li>• Include cinematic keywords like "dramatic", "wide shot", "tracking shot"</li>
            <li>• Mention the time of day and weather conditions</li>
            <li>• Start with 5s videos to test prompts before using more credits</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
