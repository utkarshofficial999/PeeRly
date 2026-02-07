/** @type {import('next').NextConfig} */
const nextConfig = {
    // Images configuration
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.supabase.co',
                port: '',
                pathname: '/storage/v1/object/public/**',
            },
        ],
    },
}

module.exports = nextConfig
