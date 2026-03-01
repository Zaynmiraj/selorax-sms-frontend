/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_MESSAGING_API_URL: process.env.NEXT_PUBLIC_MESSAGING_API_URL,
  },
};

module.exports = nextConfig;
