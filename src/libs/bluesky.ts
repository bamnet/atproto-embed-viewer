import { BrowserOAuthClient, OAuthSession } from '@atproto/oauth-client-browser';
import { nextTick, ref, type App, type InjectionKey, type Ref } from 'vue';
import { Agent } from '@atproto/api';

export const bskyPluginKey = Symbol() as InjectionKey<{
    oauthClient: Ref<BrowserOAuthClient | undefined>,
    session: Ref<OAuthSession | undefined>,
    agent: Ref<Agent | undefined>,
}>;

// Manually construct a Client ID for local development.
const CLIENT_ID =
    // Special loopback behavior is only trigged for localhost.
    'http://localhost' +
    // Include any scopes necessary for your application.
    // atproto and transition:generic cover the bacics.
    '?scope=atproto%20transition:generic' +
    // Include the redirect URI to bring users back to your applicaion.
    '&redirect_uri=' + window.origin;

const RESOLVER = 'https://bsky.social/';

export const bskyPlugin = {
    install(app: App) {
        const oauthClient = ref<BrowserOAuthClient>();
        const session = ref<OAuthSession>();
        const agent = ref<Agent>();

        const init = async () => {
            const client = await BrowserOAuthClient.load({
                clientId: CLIENT_ID,
                handleResolver: RESOLVER,
            });
            oauthClient.value = client;

            const result = await client.init();
            console.log("Client Init result", result);
            if (result) {
                session.value = result.session;
                agent.value = new Agent(result.session);
                await nextTick();
            }
        };

        app.provide(bskyPluginKey, { oauthClient, session, agent });

        init();
    }
};