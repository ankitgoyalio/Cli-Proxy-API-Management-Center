const MANAGEMENT_CENTER_REPOSITORY =
  'https://github.com/ankitgoyalio/Cli-Proxy-API-Management-Center';

export const forkPolicy = {
  managementCenter: {
    source: MANAGEMENT_CENTER_REPOSITORY,
    issues: `${MANAGEMENT_CENTER_REPOSITORY}/issues`,
    releases: `${MANAGEMENT_CENTER_REPOSITORY}/releases`,
    updateArtifact: `${MANAGEMENT_CENTER_REPOSITORY}/releases/latest/download/management.html`,
  },
  compatibleBackend: {
    source: 'https://github.com/router-for-me/CLIProxyAPI',
    help: 'https://help.router-for.me/',
  },
  mayRenderPromotionalRegistration: false,
} as const;
