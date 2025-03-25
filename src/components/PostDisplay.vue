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
        if (segment.isLink()) {
            html += `<a href="${segment.link?.uri}">${segment.text}</a>`
        } else if (segment.isMention()) {
            html += `<a href="https://bsky.app/profile/${segment.mention?.did}">${segment.text}</a>`
        } else if (segment.isTag()) {
            const tagText = segment.text.replace(/^#/, ''); // Strip leading #
            html += `<a href="https://bsky.app/hashtag/${encodeURIComponent(tagText)}">${segment.text}</a>`
        } else {
            html += segment.text
        }
    }
    return html
};
</script>

<template>
    <div class="post">
        <h4>{{ post.post.author?.displayName || post.post.author?.handle }}</h4>
        <p v-html="renderTextWithFacets(post.post.record.text as string, post.post.record.facets as Facet[])"></p>
        <!-- @vue-expect-error -->
        <div v-if="post.post.record.embed?.$type === 'community.lexicon.embed.geo'">
            <!-- @vue-expect-error -->
            <iframe :src="getGoogleMapsEmbedUrl(post.post.record.embed.latitude, post.post.record.embed.longitude)"
                width="400" height="200" style="border:0;" allowfullscreen="false" loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>
    </div>
</template>

<style scoped>
.post {
    padding: 10px;
    margin-bottom: 10px;
    border-bottom: 1px solid #eee;
}

a {
    color: #1DA1F2;
    text-decoration: none;
}

a:hover {
    text-decoration: underline;
}
</style>
