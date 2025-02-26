import { BrowserOAuthClient, OAuthSession } from '@atproto/oauth-client-browser';
import { computed, reactive, inject, type App, type InjectionKey, type Ref } from 'vue';
import { Agent } from '@atproto/api';

export const BLUESKY_AGENT = Symbol('bluesky-agent') as InjectionKey<Ref<Agent | null, Agent | null>>;
export const BLUESKY_GENERATE_SIGNIN_URL = Symbol('bluesky-generate-signin-url') as InjectionKey<(handle: string) => Promise<URL | null>>;
export const BLUESKY_SIGN_OUT = Symbol('bluesky-sign-out') as InjectionKey<() => Promise<void>>;
export const BLUESKY_IS_SIGNED_IN = Symbol('bluesky-is-signed-in') as InjectionKey<Ref<boolean>>;

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

interface State {
    session: OAuthSession | null;
    isSignedIn: boolean;
    agent: Agent | null;
    oauthClient: BrowserOAuthClient | null;
    initialized: boolean;
}

export const bskyPlugin = {
    install(app: App) {
        const state: State = reactive({
            session: null,
            isSignedIn: computed(() => !!state.session),
            agent: null,
            oauthClient: null,
            initialized: false,
        });


        const initOAuthClient = async () => {
            const oauthClient = await BrowserOAuthClient.load({
                clientId: CLIENT_ID,
                handleResolver: RESOLVER,
            });

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

        app.provide(BLUESKY_AGENT, agentRef);
        app.provide(BLUESKY_GENERATE_SIGNIN_URL, generateSignInUrl);
        app.provide(BLUESKY_SIGN_OUT, signOut);
        app.provide(BLUESKY_IS_SIGNED_IN, computed(() => state.isSignedIn));
    }
};

export const useBluesky = () => {
    return {
        agent: inject(BLUESKY_AGENT),
        generateSigninUrl: inject(BLUESKY_GENERATE_SIGNIN_URL),
        signOut: inject(BLUESKY_SIGN_OUT),
        isSignedIn: inject(BLUESKY_IS_SIGNED_IN),
    }
}