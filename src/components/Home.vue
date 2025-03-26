<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useBluesky } from '../libs/bluesky'
import type { ProfileViewDetailed } from '@atproto/api/dist/client/types/app/bsky/actor/defs'
import type { FeedViewPost } from '@atproto/api/dist/client/types/app/bsky/feed/defs'
import NewPost from './NewPost.vue'
import PostDisplay from './PostDisplay.vue'

// Use the Bluesky plugin.
const { agent, generateSigninUrl, signOut, isSignedIn } = useBluesky();

const handle = ref('');
const timeline = ref<FeedViewPost[]>([]);
const profile = ref<ProfileViewDetailed>();
const isLoading = ref(false);

// Fetch the user's profile.
const fetchProfile = async () => {
    if (!isSignedIn?.value || !agent?.value) {
        return;
    }

    try {
        const response = await agent.value.getProfile({ actor: agent.value.did! });
        profile.value = response.data;
    } catch (error) {
        console.error('Failed to fetch profile:', error);
    }
}

// Fetch timeline when signed in.
const fetchTimeline = async () => {
    if (!isSignedIn?.value || !agent?.value) {
        return;
    }

    isLoading.value = true;
    try {
        const response = await agent.value.getTimeline();
        timeline.value = response.data.feed;
    } catch (error) {
        console.error('Failed to fetch timeline:', error);
    } finally {
        isLoading.value = false;
    }
}

// Handle sign in - starts the OAuth flow.
const handleSignIn = async () => {
    const url = await generateSigninUrl!(handle.value);
    // The page will redirect to Bluesky's auth page
    window.open(url!, '_self', 'noopener');
    return;
}

// Handle sign out.
const handleSignOut = async () => {
    await signOut!();
    timeline.value = [];
    profile.value = undefined;
}

// Handle post created event.
const handlePostCreated = () => {
    fetchTimeline()
}

// Watch for sign-in status.
watch(isSignedIn!, (signedIn) => {
    if (signedIn) {
        fetchProfile();
        fetchTimeline();
    }
})

// Fetch data on mount if signed in.
onMounted(() => {
    if (isSignedIn?.value) {
        fetchProfile();
        fetchTimeline();
    }
})
</script>

<template>
    <div class="bluesky-component">
        <div v-if="isSignedIn">
            <button @click="handleSignOut" class="btn-signout">Sign Out</button>
            <div v-if="profile" class="profile-section">
                <h3>Welcome, {{ profile.displayName || profile.handle }}</h3>
                <div v-if="profile.avatar" class="avatar">
                    <img :src="profile.avatar" alt="Profile picture" width="50" height="50" />
                </div>
                <p>{{ profile.description }}</p>
            </div>

            <div class="feed-section">
                <NewPost @post-created="handlePostCreated" />
                <h3>Your Timeline</h3>
                <div v-if="timeline.length > 0">
                    <PostDisplay v-for="post in timeline" :key="post.post.uri" :post="post" />
                </div>
                <div v-else-if="isLoading">
                    Loading timeline...
                </div>
                <div v-else>
                    No posts found
                </div>
            </div>
        </div>

        <div v-else class="login-section">
            <h3>Sign in to Bluesky</h3>
            <form @submit.prevent="handleSignIn">
                <div>
                    <label for="handle">Handle (optional):</label>
                    <input id="handle" v-model="handle" placeholder="yourusername.bsky.social" />
                </div>
                <button type="submit" class="btn-signin">Sign In with Bluesky</button>
            </form>
        </div>
        <footer class="cute-footer">
            <span>🔨 with 💙 by </span>
            <a href="https://github.com/bamnet/atproto-embed-viewer" target="_blank" rel="noopener noreferrer">
                <span class="github-icon">🐙</span> source code
            </a>
        </footer>
    </div>
</template>

<style scoped>
.bluesky-component {
  max-width: 600px;
  margin: 0 auto;
  padding: 16px; /* Using spacing guideline */
}

@media (max-width: 768px) {
  .bluesky-component {
    max-width: 100%; /* Adjust max-width for smaller screens */
    padding: 12px;
  }
}

.loading {
  text-align: center;
  padding: 16px; /* Using spacing guideline */
  color: var(--secondary-text-color);
}

.profile-section {
  margin-bottom: 12px;
  padding: 4px 8px;
  border-radius: 8px;
  background-color: var(--secondary-color);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  margin: 0;
  flex-shrink: 0;
}

.avatar img {
  border-radius: 50%;
}

.feed-section {
  margin-top: 16px; /* Using spacing guideline */
}

.login-section {
  max-width: 400px;
  margin: 0 auto;
  padding: 16px; /* Using spacing guideline */
  background-color: var(--surface-color); /* Using CSS variable */
  border-radius: 8px;
  border: 1px solid var(--border-color); /* Adding border for better definition */
}

.login-section input {
  width: 100%;
  padding: 8px;
  margin: 8px 0; /* Using spacing guideline, removed extra margin */
  border: 1px solid var(--border-color); /* Using CSS variable */
  border-radius: 4px;
  box-sizing: border-box; /* Ensures padding is included in width */
}

.btn-signin,
.btn-signout {
  padding: 10px 20px; /* Increased padding */
  margin: 8px 4px; /* Adjusted margin */
  background-color: var(--primary-color); /* Using CSS variable */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-signout {
  background-color: var(--error-color); /* Using CSS variable */
}

.cute-footer {
  text-align: center;
  padding: 16px; /* Using spacing guideline */
  margin-top: 32px; /* Using spacing guideline */
  font-size: 0.9em;
  color: var(--secondary-text-color); /* Using CSS variable */
}

.cute-footer a {
  color: var(--primary-color); /* Using CSS variable */
  text-decoration: none;
  transition: color 0.2s ease;
}

.cute-footer a:hover {
  color: #2563eb; /* This color seems specific, keep for now */
}

.github-icon {
  font-size: 1.2em;
  vertical-align: middle;
}
</style>