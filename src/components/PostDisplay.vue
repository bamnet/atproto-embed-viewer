<script setup lang="ts">
import type { FeedViewPost } from '@atproto/api/dist/client/types/app/bsky/feed/defs';

defineProps<{
  post: FeedViewPost
}>();

const MAPS_API_KEY = import.meta.env.VITE_MAPS_API_KEY;

const getGoogleMapsEmbedUrl = (latitude: string, longitude: string): string => {
  return `https://www.google.com/maps/embed/v1/place?key=${MAPS_API_KEY}&center=${latitude},${longitude}&zoom=14&q=${latitude},${longitude}`;
}
</script>

<template>
  <div class="post">
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
</template>

<style scoped>
.post {
  padding: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid #eee;
}
</style>
