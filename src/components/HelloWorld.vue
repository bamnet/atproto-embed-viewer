<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useBluesky } from '../libs/bluesky'
import type { ProfileViewDetailed } from '@atproto/api/dist/client/types/app/bsky/actor/defs';
import type { FeedViewPost } from '@atproto/api/dist/client/types/app/bsky/feed/defs';
import NewPost from './NewPost.vue'

// Use the Bluesky plugin.
const { agent, generateSigninUrl, signOut, isSignedIn } = useBluesky();

const handle = ref('');
const timeline = ref<FeedViewPost[]>([]);
const profile = ref<ProfileViewDetailed>();
const isLoading = ref(false);

const MAPS_API_KEY = import.meta.env.VITE_MAPS_API_KEY;

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

// Generate Google Maps embed URL.
const getGoogleMapsEmbedUrl = (latitude: string, longitude: string) => {
  return `https://www.google.com/maps/embed/v1/place?key=${MAPS_API_KEY}&center=${latitude},${longitude}&zoom=14&q=${latitude},${longitude}`;
}
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
          <div v-for="post in timeline" :key="post.post.uri" class="post">
            <h4>{{ post.post.author?.displayName || post.post.author?.handle }}</h4>
            <p>{{ post.post.record.text }}</p>
            <!-- @vue-expect-error -->
            <div v-if="post.post.record.embed?.$type === 'community.lexicon.embed.geo'">
              <!-- @vue-expect-error -->
              <iframe
                :src="getGoogleMapsEmbedUrl(post.post.record.embed.latitude, post.post.record.embed.longitude)"
                width="400"
                height="200"
                style="border:0;"
                allowfullscreen="false"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
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
  </div>
</template>

<style scoped>
.bluesky-component {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.profile-section {
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 8px;
  background-color: #666;
}

.avatar {
  margin: 10px 0;
}

.avatar img {
  border-radius: 50%;
}

.feed-section {
  margin-top: 20px;
}

.post {
  padding: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.login-section {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  background-color: #666;
  border-radius: 8px;
}

.login-section input {
  width: 100%;
  padding: 8px;
  margin: 8px 0 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.btn-signin, .btn-signout {
  padding: 8px 16px;
  margin: 8px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-signout {
  background-color: #ef4444;
}
</style>