/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ['natural', 'archiver'],
    typescript: {
        tsconfigPath: 'tsconfig.build.json',
    },
    webpack: (config, { isServer }) => {
        if (isServer) {
            // natural's parallel classifier uses optional native deps we don't need
            config.externals = [...(config.externals ?? []), 'webworker-threads', 'lapack']
        }
        return config
    },
}

export default nextConfig
