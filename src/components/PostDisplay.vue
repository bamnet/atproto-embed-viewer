<script setup lang="ts">
import type { FeedViewPost } from '@atproto/api/dist/client/types/app/bsky/feed/defs';
import { RichText, type Facet } from '@atproto/api';

defineProps<{
    post: FeedViewPost
}>();

const MAPS_API_KEY = import.meta.env.VITE_MAPS_API_KEY;

const getGoogleMapsEmbedUrl = (latitude: string, longitude: string): string => {
    return `https://www.google.com/maps/embed/v1/place?key=${MAPS_API_KEY}&center=${latitude},${longitude}&zoom=14&q=${latitude},${longitude}`;
}

const renderTextWithFacets = (text: string, facets?: Array<Facet>) => {
    const rt = new RichText({ text, facets });
    let html = ''
    for (const segment of rt.segments()) {
        let segmentText = segment.text.replace(/\n/g, '<br>')
        if (segment.isLink()) {
            html += `<a href="${segment.link?.uri}">${segmentText}</a>`
        } else if (segment.isMention()) {
            html += `<a href="https://bsky.app/profile/${segment.mention?.did}">${segmentText}</a>`
        } else if (segment.isTag()) {
            const tagText = segmentText.replace(/^#/, ''); // Strip leading #
            html += `<a href="https://bsky.app/hashtag/${encodeURIComponent(tagText)}">${segment.text}</a>`
        } else {
            html += segmentText
        }
    }
    return html
};

const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
}

const getPostId = (uri: string): string => {
    // Convert from at://did:plc:xxx/app.bsky.feed.post/xxx to did:plc:xxx/app.bsky.feed.post/xxx
    return encodeURIComponent(uri.replace('at://', ''));
}

const stripMapLink = (text: string): string => {
    return text.replace(/\n\n(?:View map|View on map): https?:\/\/[^\s]+\/post\/eid\/geo-\d+/g, '');
};

const getBskyAppUrl = (post: FeedViewPost): string => {
    const uri = post.post.uri;
    // URI format: at://did:plc:something/app.bsky.feed.post/rkey
    const matches = uri.match(/at:\/\/[^/]+\/[^/]+\/(.+)$/);
    const rkey = matches ? matches[1] : '';
    return `https://bsky.app/profile/${post.post.author.handle}/post/${rkey}`;
};
</script>

<template>
    <div class="post">
        <h4>{{ post.post.author?.displayName || post.post.author?.handle }}</h4>
        <p
            v-html="renderTextWithFacets(stripMapLink(post.post.record.text as string), post.post.record.facets as Facet[])">
        </p>
        <!-- @vue-expect-error -->
        <div
            v-if="post.post.record.embed?.$type === 'community.lexicon.location.geo' || post.post.record.embed?.$type === 'community.lexicon.embed.geo'">
            <!-- @vue-expect-error -->
            <iframe :src="getGoogleMapsEmbedUrl(post.post.record.embed.latitude, post.post.record.embed.longitude)"
                allowfullscreen="false" loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>
        <div class="timestamp">
            <router-link :to="`/post/uri/${getPostId(post.post.uri)}`">
                {{ formatTimestamp(post.post.indexedAt) }}
            </router-link>
            ·
            <a :href="getBskyAppUrl(post)" target="_blank">view on bsky.app</a>
        </div>
    </div>
</template>

<style scoped>
.post {
  padding: 12px; /* Using spacing guideline */
  margin-bottom: 12px; /* Using spacing guideline */
  border-bottom: 1px solid var(--border-color); /* Using CSS variable */
  border-radius: 8px; /* Added border-radius */
}

a {
  color: var(--primary-color); /* Using CSS variable */
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

.timestamp {
  font-size: 0.9em; /* Adjusted font size */
  color: var(--secondary-text-color); /* Using CSS variable */
  margin-top: 6px; /* Adjusted margin */
}

.timestamp a {
  color: var(--secondary-text-color); /* Using CSS variable */
}

iframe {
  width: 100%;
  max-width: 400px;
  height: 200px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

@media (max-width: 768px) {
  iframe {
    max-width: 100%;
    height: 180px; /* Slightly smaller height on mobile */
  }
}
</style>
