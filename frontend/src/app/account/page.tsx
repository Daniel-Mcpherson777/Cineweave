'use client'

import { useEffect, useState } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import Navbar from '@/components/Navbar'
import { api } from '@/lib/api'

const PLANS = [
  {
    name: 'starter',
    displayName: 'Starter',
    price: 10,
    credits: 80,
    features: [
      '80 credits/month',
      '~6-7 minutes of video',
      '720p @ 24fps',
      '24-hour video access',
      'Email support',
    ],
  },
  {
    name: 'creator',
    displayName: 'Creator',
    price: 31,
    credits: 250,
    features: [
      '250 credits/month',
      '~20 minutes of video',
      '720p @ 24fps',
      '24-hour video access',
      'Priority queue',
      'Email support',
    ],
    popular: true,
  },
  {
    name: 'studio',
    displayName: 'Studio',
    price: 60,
    credits: 500,
    features: [
      '500 credits/month',
      '~40 minutes of video',
      '720p @ 24fps',
      '24-hour video access',
      'Priority queue',
      'Dedicated support',
    ],
  },
]

export default function AccountPage() {
  const { getToken } = useAuth()
  const { user } = useUser()
  const [credits, setCredits] = useState<number | null>(null)
  const [currentPlan, setCurrentPlan] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCredits() {
      if (!user) return

      try {
        const token = await getToken()
        if (!token) return

        const creditsData = await api.getCredits(token)
        setCredits(creditsData.credits)
        setCurrentPlan(creditsData.plan)
      } catch (error) {
        console.error('Failed to fetch credits:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCredits()
  }, [user, getToken])

  const handleUpgrade = (planName: string) => {
    // TODO: Integrate with TrueLayer payment flow
    alert(`Upgrade to ${planName} plan - TrueLayer integration coming soon!`)
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Account Settings</h1>
          <p className="text-gray-400">Manage your subscription and billing</p>
        </div>

        {/* Current Plan */}
        <div className="card mb-8">
          <h2 className="text-2xl font-semibold mb-6">Current Plan</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold capitalize mb-2">{currentPlan} Plan</div>
              <div className="text-gray-400">
                {loading ? 'Loading...' : `${credits} credits remaining`}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                ${PLANS.find((p) => p.name === currentPlan)?.price || 0}
                <span className="text-lg text-gray-400">/month</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">Billed monthly</div>
            </div>
          </div>
        </div>

        {/* Available Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">Available Plans</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`card ${
                  plan.popular
                    ? 'border-primary-purple bg-primary-purple/5'
                    : currentPlan === plan.name
                    ? 'border-green-400 bg-green-400/5'
                    : ''
                }`}
              >
                {plan.popular && (
                  <div className="text-xs font-bold text-primary-purple mb-2">
                    MOST POPULAR
                  </div>
                )}
                {currentPlan === plan.name && (
                  <div className="text-xs font-bold text-green-400 mb-2">CURRENT PLAN</div>
                )}

                <h3 className="text-xl font-bold mb-2">{plan.displayName}</h3>
                <div className="text-3xl font-bold mb-4">
                  ${plan.price}
                  <span className="text-lg text-gray-400">/mo</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="text-sm text-gray-400">
                      ✓ {feature}
                    </li>
                  ))}
                </ul>

                {currentPlan === plan.name ? (
                  <button
                    disabled
                    className="btn-secondary w-full opacity-50 cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.name)}
                    className="btn-primary w-full"
                  >
                    {currentPlan &&
                    PLANS.findIndex((p) => p.name === plan.name) >
                      PLANS.findIndex((p) => p.name === currentPlan)
                      ? 'Upgrade'
                      : 'Switch'} to {plan.displayName}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add-ons */}
        <div className="card mb-8">
          <h2 className="text-2xl font-semibold mb-4">Credit Top-Up</h2>
          <p className="text-gray-400 mb-6">
            Need extra credits? Purchase additional credits at $0.25 per credit
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { credits: 20, price: 5 },
              { credits: 50, price: 12.5 },
              { credits: 100, price: 25 },
            ].map((option) => (
              <button
                key={option.credits}
                onClick={() => alert('Credit top-up - TrueLayer integration coming soon!')}
                className="p-4 bg-background-dark rounded-lg border border-gray-700 hover:border-primary-purple transition-colors"
              >
                <div className="font-bold text-xl mb-1">
                  {option.credits} Credits
                </div>
                <div className="text-gray-400">${option.price}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Payment History */}
        <div className="card">
          <h2 className="text-2xl font-semibold mb-4">Payment History</h2>
          <p className="text-gray-400 text-center py-8">
            No payment history yet
          </p>
        </div>

        {/* Account Info */}
        <div className="card mt-8">
          <h2 className="text-2xl font-semibold mb-4">Account Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-gray-800">
              <span className="text-gray-400">Email</span>
              <span className="font-medium">{user?.primaryEmailAddress?.emailAddress}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-800">
              <span className="text-gray-400">Member Since</span>
              <span className="font-medium">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
