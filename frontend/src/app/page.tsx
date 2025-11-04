import Link from 'next/link'
import { SignInButton, SignUpButton } from '@clerk/nextjs'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Logo & Title */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold bg-gradient-cinematic bg-clip-text text-transparent">
            🎬 CineWeave
          </h1>
          <p className="text-2xl text-gray-300">
            Weave cinematic motion from text or images
          </p>
          <p className="text-lg text-gray-400">
            AI-powered video generation at 720p, 24 fps
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="card">
            <div className="text-4xl mb-4">🎥</div>
            <h3 className="text-xl font-semibold mb-2">Cinematic Quality</h3>
            <p className="text-gray-400">
              Generate professional 720p videos at 24fps
            </p>
          </div>
          <div className="card">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">Fast Generation</h3>
            <p className="text-gray-400">
              ~1 minute on H100 GPUs for 5-second clips
            </p>
          </div>
          <div className="card">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold mb-2">Text or Image</h3>
            <p className="text-gray-400">
              Start from a prompt or transform an image
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center justify-center space-x-4 mt-12">
          <SignUpButton mode="modal">
            <button className="btn-primary">
              Get Started Free
            </button>
          </SignUpButton>
          <SignInButton mode="modal">
            <button className="btn-secondary">
              Sign In
            </button>
          </SignInButton>
        </div>

        {/* Pricing Preview */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <h2 className="text-2xl font-bold mb-6">Simple Pricing</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card">
              <h3 className="text-xl font-bold mb-2">Starter</h3>
              <div className="text-3xl font-bold mb-4">$10<span className="text-lg text-gray-400">/mo</span></div>
              <p className="text-gray-400 mb-4">80 credits/month</p>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>~6-7 minutes of video</li>
                <li>720p @ 24fps</li>
                <li>24-hour access</li>
              </ul>
            </div>
            <div className="card border-primary-purple">
              <div className="text-xs font-bold text-primary-purple mb-2">POPULAR</div>
              <h3 className="text-xl font-bold mb-2">Creator</h3>
              <div className="text-3xl font-bold mb-4">$31<span className="text-lg text-gray-400">/mo</span></div>
              <p className="text-gray-400 mb-4">250 credits/month</p>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>~20 minutes of video</li>
                <li>720p @ 24fps</li>
                <li>Priority queue</li>
              </ul>
            </div>
            <div className="card">
              <h3 className="text-xl font-bold mb-2">Studio</h3>
              <div className="text-3xl font-bold mb-4">$60<span className="text-lg text-gray-400">/mo</span></div>
              <p className="text-gray-400 mb-4">500 credits/month</p>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>~40 minutes of video</li>
                <li>720p @ 24fps</li>
                <li>Dedicated support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
