import { BrowserOAuthClient, OAuthSession } from '@atproto/oauth-client-browser';
import { computed, reactive, inject, type App, type InjectionKey, type Ref } from 'vue';
import { Agent, AtpAgent } from '@atproto/api';

export const BLUESKY_AGENT = Symbol('bluesky-agent') as InjectionKey<Ref<Agent | null, Agent | null>>;
export const BLUESKY_GENERATE_SIGNIN_URL = Symbol('bluesky-generate-signin-url') as InjectionKey<(handle: string) => Promise<URL | null>>;
export const BLUESKY_SIGN_OUT = Symbol('bluesky-sign-out') as InjectionKey<() => Promise<void>>;
export const BLUESKY_IS_SIGNED_IN = Symbol('bluesky-is-signed-in') as InjectionKey<Ref<boolean>>;
export const BLUESKY_PUBLIC_AGENT = Symbol('bluesky-public-agent') as InjectionKey<Ref<AtpAgent>>;

// Manually construct a Client ID for local development.
const DEVELOPMENT_CLIENT_ID =
    // Special loopback behavior is only trigged for localhost.
    'http://localhost' +
    // Include any scopes necessary for your application.
    // atproto and transition:generic cover the bacics.
    '?scope=atproto%20transition:generic' +
    // Include the redirect URI to bring users back to your applicaion.
    '&redirect_uri=' + window.origin;

const RESOLVER = 'https://bsky.social/';

interface State {
    session: OAuthSession | null;
    isSignedIn: boolean;
    agent: Agent | null;
    publicAgent: AtpAgent;
    oauthClient: BrowserOAuthClient | null;
    initialized: boolean;
}

export const bskyPlugin = {
    install(app: App) {
        const state: State = reactive({
            session: null,
            isSignedIn: computed(() => !!state.session),
            agent: null,
            publicAgent: computed(() => new AtpAgent({ service: 'https://public.api.bsky.app' })),
            oauthClient: null,
            initialized: false,
        });


        const oauthClientFactory = async () => {
            if (import.meta.env.MODE == "development") {
                // In development mode, use a client ID that is configured to work
                // with the local development server.
                return await BrowserOAuthClient.load({
                    clientId: DEVELOPMENT_CLIENT_ID,
                    handleResolver: RESOLVER,
                });
            }

            // Since BrowserOAuthClient.load has validations which requires a
            // full URL to the client metadata, we fetch it manually first.
            //
            // This avoids the need to hardcode the full path to the client metadata
            // in the source code too.
            const clientMetadata = await fetch('client_metadata.json');

            return new BrowserOAuthClient({
                // @ts-ignore
                clientMetadata: await clientMetadata.json(),
                handleResolver: RESOLVER,
            });
        };

        const initOAuthClient = async () => {
            const oauthClient = await oauthClientFactory();

            state.oauthClient = oauthClient;

            const result = await oauthClient.init();

            if (result) {
                state.session = result.session;

                const agent = new Agent(result.session);
                state.agent = agent;
            }
        };

        const generateSignInUrl = async (handle: string) => {
            if (!state.oauthClient) {
                return null;
            }
            return await state.oauthClient.authorize(handle)
        };

        const signOut = async () => {
            if (!state.oauthClient || !state.session) {
                return;
            }
            await state.session.signOut();
            state.session = null;
            state.agent = null;

            await initOAuthClient();
        };

        initOAuthClient();

        const agentRef = computed(() => state.agent);
        const publicAgentRef = computed(() => state.publicAgent);

        app.provide(BLUESKY_AGENT, agentRef);
        app.provide(BLUESKY_GENERATE_SIGNIN_URL, generateSignInUrl);
        app.provide(BLUESKY_SIGN_OUT, signOut);
        app.provide(BLUESKY_IS_SIGNED_IN, computed(() => state.isSignedIn));
        app.provide(BLUESKY_PUBLIC_AGENT, publicAgentRef);
    }
};

export const useBluesky = () => {
    return {
        agent: inject(BLUESKY_AGENT),
        publicAgent: inject(BLUESKY_PUBLIC_AGENT),
        generateSigninUrl: inject(BLUESKY_GENERATE_SIGNIN_URL),
        signOut: inject(BLUESKY_SIGN_OUT),
        isSignedIn: inject(BLUESKY_IS_SIGNED_IN),
    }
}