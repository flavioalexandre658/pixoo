import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "192.168.0.120:3000"],
    },
  },

  images: {
    //domains: ['api.convitede.com'],  // Adicione seu domínio aqui
    remotePatterns: [
      {
        protocol: "https" as const,
        hostname: "delivery-us1.bfl.ai",
        pathname: "/**",
      },
    ],
    unoptimized: true,
  },
  // Add development origins for cross-origin requests
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NODE_ENV === "development" ? "*" : "same-origin",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
