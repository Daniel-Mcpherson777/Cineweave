import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-cinematic bg-clip-text text-transparent">
          🎬 CineWeave
        </h1>
        <SignIn
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-background-medium border border-gray-800',
            },
          }}
        />
      </div>
    </div>
  )
}
