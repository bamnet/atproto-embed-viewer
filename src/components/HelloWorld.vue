<script setup lang="ts">
import { ref, inject, watch, onMounted, nextTick } from 'vue';
import { bskyPluginKey } from '../libs/bluesky';

const bsky = inject(bskyPluginKey);

const signInUrl = ref<string>();

const username = ref<string>();
const profilePic = ref<string>();

watch(bsky.oauthClient, async (oauthClient) => {
  signInUrl.value = await oauthClient.authorize('bamnet-test.bsky.social');
});

watch(bsky.agent, async (agent) => {
  if (agent) {
    // If the user is signed in, fetch their profile.
    const profile = await agent.getProfile({ actor: agent.did! });
    username.value = profile.data.displayName || profile.data.handle;
    profilePic.value = profile.data.avatar;
  }
});

async function signOut() {
  bsky.session.value.signOut();
  bsky.session.value = undefined;
}
</script>

<template>
  <div class="card">
    <a v-if="!bsky.session.value" :href="signInUrl">Sign In</a>
    <div v-else>
      <img width="50px" v-if="profilePic" :src="profilePic" alt="Profile Picture" />
      <p v-if="username">{{ username }}</p>
    </div>
    <button v-if="bsky.session.value" @click="signOut">Sign Out</button>
  </div>
</template>

<style scoped></style>
