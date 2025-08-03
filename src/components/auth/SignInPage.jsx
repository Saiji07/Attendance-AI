import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { GraduationCap } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AttendanceAI</h1>
          <p className="text-gray-600">Sign in to manage your classrooms and track attendance</p>
        </div>

        {/* Clerk Sign In Component */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <SignIn 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-none bg-transparent",
                headerTitle: "text-2xl font-bold text-gray-900",
                headerSubtitle: "text-gray-600",
                socialButtonsBlockButton: "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium",
                socialButtonsBlockButtonText: "font-medium",
                formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5",
                formFieldInput: "border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                formFieldLabel: "text-gray-700 font-medium",
                footerActionLink: "text-blue-600 hover:text-blue-700 font-medium",
                identityPreviewText: "text-gray-700",
                identityPreviewEditButton: "text-blue-600 hover:text-blue-700"
              },
              layout: {
                socialButtonsPlacement: "top",
                socialButtonsVariant: "blockButton"
              }
            }}
            redirectUrl="/"
            signUpUrl="/sign-up"
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Secure authentication powered by Clerk
          </p>
        </div>
      </div>
    </div>
  );
}