<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useBluesky } from '../libs/bluesky'
import type { PostView } from '@atproto/api/dist/client/types/app/bsky/feed/defs'
import PostDisplay from './PostDisplay.vue'

const props = defineProps<{
    uri?: string
    id?: string
}>()

const { agent, publicAgent } = useBluesky()
const post = ref<PostView>()
const isLoading = ref(false)

const fetchPostByCustomId = async () => {
    if (!props.id) {
        return
    }

    isLoading.value = true
    try {
        const activeAgent = agent?.value || publicAgent?.value
        const response = await activeAgent!.app.bsky.feed.searchPosts({ q: props.id, limit: 1 })
        if (response.data.posts?.length > 0) {
            post.value = response.data.posts[0]
        }
    } catch (error) {
        console.error('Failed to fetch post by ID:', error)
    } finally {
        isLoading.value = false
    }
}

const fetchPost = async () => {
    if (props.uri) {
        isLoading.value = true
        try {
            const activeAgent = agent?.value || publicAgent?.value
            const fullUri = `at://${props.uri}`
            const response = await activeAgent!.getPostThread({ uri: decodeURIComponent(fullUri) })
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

watch(() => props.uri, (newUri) => {
    if (newUri) {
        fetchPost()
    }
})

watch(() => props.id, (newId) => {
    if (newId) {
        fetchPost()
    }
})

onMounted(() => {
    fetchPost()
})
</script>

<template>
    <div class="single-post">
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
</template>

<style scoped>
.single-post {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
}
</style>
