

const nextConfig = {
  serverExternalPackages: ['pdfjs-dist'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
