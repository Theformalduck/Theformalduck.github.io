export { auth as proxy } from "@/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/editor/:path*",
    "/review/:path*",
    "/settings/:path*",
    "/analytics/:path*",
    "/themes/:path*",
  ],
};
