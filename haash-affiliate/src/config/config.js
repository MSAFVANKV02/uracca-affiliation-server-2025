let config = {
  baseURL: "https://affiliate.server.uracca.com/api",
  apiKey: "",
  domain: ""
};

export const InitAffiliate = ({ domain, apiKey }) => {
  if (!domain) throw new Error("domain is required");
  if (!apiKey) throw new Error("apiKey is required");

  config.domain = domain;
  config.apiKey = apiKey;
};

export const getConfig = () => config;
