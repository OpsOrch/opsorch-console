// Read from both server and client environment variables
// NEXT_PUBLIC_ prefix makes it available on the client side
export const EDITION = (
  process.env.NEXT_PUBLIC_OPSORCH_EDITION?.trim() || 
  process.env.OPSORCH_EDITION?.trim() || 
  "oss"
);

export function isEnterprise() {
    return EDITION === "enterprise";
}

export function isOSS() {
    return EDITION !== "enterprise";
}
