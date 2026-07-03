/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/slowest-website",
  trailingSlash: true,
  images: { unoptimized: true },
};
export default nextConfig;
