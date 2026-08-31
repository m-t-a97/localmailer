export async function register() {
  // Prisma Next uses Temporal-backed codecs (pg/timestamptz-temporal@1) which
  // require the global Temporal API. Node 22/24 does not ship Temporal by
  // default, so we install the polyfill before any db client is created.
  await import("temporal-polyfill/global");
}
