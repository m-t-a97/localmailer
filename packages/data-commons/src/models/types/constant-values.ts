export const ConstantValues = {
  users: "users",
  wali: "wali",
  profiles: "profiles",
  profileRequests: "profile-requests",
  profileViews: "profile-views",
  webhooks: "webhooks",
  subscriptions: "subscriptions",

  database: {
    tables: {
      users: "users",
      usersStripeData: "users_stripe_data",
      wali: "wali",
      profiles: "profiles",
      profileRequests: "profile_requests",
      featureFlags: "feature_flags",
      favouritedProfiles: "favourited_profiles",
      profileViews: "profile_views",
    },
  },

  // IN-APP
  totalProfilesPerPage: 10,
  maxNumberOfRequestsOnFreePlan: 5,
  maxNumberOfRequestsOnPlusPlan: 15,
  maxNumberOfRequestsOnProPlan: 30,

  // REDIS KEYS
  redis: {},
} as const;
