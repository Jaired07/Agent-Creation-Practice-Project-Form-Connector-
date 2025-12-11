'use client'

import { SignIn } from '@clerk/nextjs'

/**
 * Sign-in page
 * 
 * Displays Clerk's sign-in component for user authentication.
 * Uses catch-all route to handle Clerk's authentication flow.
 * 
 * @returns {JSX.Element} Sign-in page with Clerk component
 */
export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-400">Sign in to your Form Connector account</p>
        </div>
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
          <SignIn 
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "bg-transparent shadow-none",
                headerTitle: "text-white",
                headerSubtitle: "text-slate-400",
                socialButtonsBlockButton: "bg-slate-700 hover:bg-slate-600 text-white border-slate-600",
                formButtonPrimary: "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500",
                formFieldInput: "bg-slate-900 border-slate-700 text-white",
                formFieldLabel: "text-slate-300",
                footerActionLink: "text-indigo-400 hover:text-indigo-300",
                identityPreviewText: "text-slate-300",
                identityPreviewEditButton: "text-indigo-400 hover:text-indigo-300",
              },
            }}
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            afterSignInUrl="/dashboard"
          />
        </div>
      </div>
    </div>
  )
}





