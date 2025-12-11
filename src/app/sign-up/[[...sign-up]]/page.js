'use client'

import { SignUp } from '@clerk/nextjs'

/**
 * Sign-up page
 * 
 * Displays Clerk's sign-up component for new user registration.
 * Uses catch-all route to handle Clerk's authentication flow.
 * 
 * @returns {JSX.Element} Sign-up page with Clerk component
 */
export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-slate-400">Get started with Form Connector</p>
        </div>
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
          <SignUp 
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
            path="/sign-up"
            signInUrl="/sign-in"
            afterSignUpUrl="/dashboard"
          />
        </div>
      </div>
    </div>
  )
}





