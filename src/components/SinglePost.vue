<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useBluesky } from '../libs/bluesky'
import type { PostView } from '@atproto/api/dist/client/types/app/bsky/feed/defs'
import PostDisplay from './PostDisplay.vue'

const props = defineProps<{
    uri?: string
    id?: string
}>()

const { agent, isSignedIn } = useBluesky()
const post = ref<PostView>()
const isLoading = ref(false)

const fetchPostByCustomId = async () => {
    if (!isSignedIn?.value || !agent?.value || !props.id) {
        return
    }

    isLoading.value = true
    try {
        // Search for posts containing our custom ID
        const response = await agent.value.app.bsky.feed.searchPosts({
            q: props.id,
            limit: 1
        })
        if (response.data.posts.length > 0) {
            post.value = response.data.posts[0]
        }
    } catch (error) {
        console.error('Failed to fetch post by ID:', error)
    } finally {
        isLoading.value = false
    }
}

const fetchPost = async () => {
    if (!isSignedIn?.value || !agent?.value) {
        return
    }

    if (props.uri) {
        // Original URI-based fetch
        isLoading.value = true
        try {
            const response = await agent.value.getPostThread({ uri: decodeURIComponent(props.uri) })
            if ('post' in response.data.thread) {
                post.value = response.data.thread.post as PostView
            }
        } catch (error) {
            console.error('Failed to fetch post:', error)
        } finally {
            isLoading.value = false
        }
    } else if (props.id) {
        await fetchPostByCustomId()
    }
}

// Watch for sign-in status.
watch(isSignedIn!, (signedIn) => {
    if (signedIn) {
        fetchPost();
    }
})

// Watch for prop changes
watch(() => props.uri, (newUri) => {
    if (isSignedIn?.value && newUri) {
        fetchPost()
    }
})

watch(() => props.id, (newId) => {
    if (isSignedIn?.value && newId) {
        fetchPost()
    }
})

onMounted(() => {
    if (isSignedIn?.value) {
        fetchPost()
    }
})
</script>

<template>
    <div class="single-post">
        <div v-if="isSignedIn">
            <div v-if="post">
                <PostDisplay :post="{ post }" />
            </div>
            <div v-else-if="isLoading">
                Loading post...
            </div>
            <div v-else>
                Post not found
            </div>
        </div>
        <div v-else>
            Please sign in to view this post
        </div>
    </div>
</template>

<style scoped>
.single-post {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
}
</style>
