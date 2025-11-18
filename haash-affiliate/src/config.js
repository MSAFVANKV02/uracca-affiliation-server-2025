let config = {
  baseURL: "",
  apiKey: "",
};

export const InitAffiliate = ({ baseURL, apiKey }) => {
  config.baseURL = baseURL;
  config.apiKey = apiKey;
};

export const getConfig = () => config;

// initAffiliate({
//   baseURL: "https://api.uracca-affiliate.com",
//   apiKey: "PLAT-987sd7f89sd7f9xxv9",
// });
