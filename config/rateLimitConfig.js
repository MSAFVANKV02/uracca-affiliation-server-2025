export const rateLimitConfig = [
  {
    route: "/api/user",
    window: "1m",
    max: 5,
  },
  {
    route: "/api/user/withdrawal",
    window: "1m",
    max: 3,
  },
  {
    route: "/api/admin/products",
    window: "5m",
    max: 30,
  },
  {
    route: "/api/admin/platform/update",
    window: "3m",
    max: 20,
  },
  {
    route: "/api/admin/platform/general/settings",
    method: "POST",
    window: "3m",
    max: 20,
  },
  {
    route: "/api/users/products",
    window: "5m",
    max: 50,
  },
  {
    route: "/api/affiliate",
    window: "1h",
    max: 100,
  },
  {
    route: "/api/wallet",
    noLimit: true,
    //   window: "1h",
    //   max: 60,
  },
  {
    route: "/api/web-hook",
    noLimit: true, // NEVER throttle webhook
  },
];
