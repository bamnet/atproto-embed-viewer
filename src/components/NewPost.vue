<script setup lang="ts">
import { ref } from 'vue'
import { useBluesky } from '../libs/bluesky'
import { AppBskyFeedPost } from '@atproto/api'

const { agent } = useBluesky()
const postText = ref('')
const isPosting = ref(false)
const errorMessage = ref('')
const latitude = ref('')
const longitude = ref('')
const locationName = ref('')

const handleSubmit = async () => {
  if (!agent?.value || !postText.value.trim()) {
    return
  }

  isPosting.value = true
  errorMessage.value = ''

  try {
    const post = {
        text: postText.value.trim(),
        createdAt: new Date().toISOString(),
        embed: {
            $type: 'community.lexicon.embed.geo',
            latitude: latitude.value,
            longitude: longitude.value,
            name: locationName.value.trim(),
        },
    };

    if (!AppBskyFeedPost.isRecord(post)) {
        console.log("Invalid post");
    }
    if (!AppBskyFeedPost.validateRecord(post)) {
        console.log("Invalid post");
    }

    await agent.value.post(post)
    postText.value = ''
    latitude.value = ''
    longitude.value = ''
    locationName.value = ''
    emit('post-created')
  } catch (error) {
    errorMessage.value = 'Failed to create post'
    console.error('Post creation error:', error)
  } finally {
    isPosting.value = false
  }
}

const emit = defineEmits<{
  'post-created': []
}>()
</script>

<template>
  <div class="new-post">
    <textarea
      v-model="postText"
      placeholder="What's on your mind?"
      :disabled="isPosting"
    ></textarea>
    <input
      v-model="latitude"
      type="text"
      placeholder="Latitude"
      :disabled="isPosting"
    />
    <input
      v-model="longitude"
      type="text"
      placeholder="Longitude"
      :disabled="isPosting"
    />
    <input
      v-model="locationName"
      type="text"
      placeholder="Location Name"
      :disabled="isPosting"
    />
    <div class="actions">
      <span class="error" v-if="errorMessage">{{ errorMessage }}</span>
      <button
        @click="handleSubmit"
        :disabled="isPosting || !postText.trim()"
      >
        {{ isPosting ? 'Posting...' : 'Post' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.new-post {
  margin: 20px 0;
  padding: 15px;
  background-color: #666;
  border-radius: 8px;
}

textarea, input {
  width: 100%;
  padding: 12px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
}

.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

button {
  padding: 8px 16px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.error {
  color: #ef4444;
}
</style>
