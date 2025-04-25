import EarlyBirdSignupForm from '@/components/EarlyBirdSignupForm';

export default function EarlyAccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white">
      <header className="container mx-auto px-4 py-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-800">
            Be Among the First to Experience{' '}
            <span className="text-blue-900">Stendroid</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-800 max-w-3xl mx-auto">
            Join our exclusive early access program and get a head start in building your professional network.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Why Join Early?</h2>
            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 text-blue-900">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="ml-3 text-lg text-gray-800">Be first to access all features</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 text-blue-900">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="ml-3 text-lg text-gray-800">Exclusive early adopter benefits</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 text-blue-900">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="ml-3 text-lg text-gray-800">Direct access to our founding team</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 text-blue-900">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="ml-3 text-lg text-gray-800">Help shape the future of the platform</p>
              </li>
            </ul>
          </div>
          
          <div>
            <EarlyBirdSignupForm />
          </div>
        </div>

        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold mb-8 text-gray-800">Coming Soon</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-900 text-4xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-12 w-12 mx-auto">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Professional Networking</h3>
              <p className="text-gray-800">Connect with professionals from your industry and beyond.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-900 text-4xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-12 w-12 mx-auto">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Job Opportunities</h3>
              <p className="text-gray-800">Discover and apply to exciting new career opportunities.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-900 text-4xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-12 w-12 mx-auto">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Direct Messaging</h3>
              <p className="text-gray-800">Communicate directly with your connections.</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-20 bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} LinkedIn Clone. All rights reserved.</p>
          <p className="mt-2 text-gray-800">Sign up for early access today!</p>
        </div>
      </footer>
    </div>
  );
}