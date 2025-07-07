/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'crests.football-data.org',
      'logos-world.net',
      'upload.wikimedia.org',
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com'
    ],
  }
}

module.exports = nextConfig