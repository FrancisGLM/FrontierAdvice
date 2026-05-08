import { mergeConfig, type UserConfig } from 'vite';

export default (config: UserConfig) => {
  return mergeConfig(config, {
    server: {
      allowedHosts: true, // Permite todas las conexiones entrantes (como ngrok o cloudflare)
    },
  });
};
