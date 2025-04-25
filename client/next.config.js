/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // We'll run ESLint separately, don't run during builds
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig 