<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBluesky } from '../libs/bluesky'
import { AppBskyFeedPost } from '@atproto/api'

const { agent } = useBluesky()
const postText = ref('')
const isPosting = ref(false)
const errorMessage = ref('')
const latitude = ref('')
const longitude = ref('')
const locationName = ref('')
const map = ref<google.maps.Map | null>(null)
const marker = ref<google.maps.Marker | null>(null)

onMounted(() => {
  initializeMap()
})

const initializeMap = async () => {
  const mapElement = document.getElementById('map') as HTMLElement;

  const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
  const { Marker } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

  map.value = new Map(mapElement, {
    center: { lat: 40.7414599557659, lng: -74.00339116926585}, // Default to Google NYC
    zoom: 13,
    streetViewControl: false,
    zoomControl: true,
  });

  marker.value = new Marker({
    position: map.value.getCenter(),
    map: map.value
  });

  map.value.addListener('center_changed', () => {
    const location = map.value!.getCenter();
    if (marker.value) {
      marker.value.setPosition(map.value!.getCenter());
    }
    latitude.value = location.lat().toString();
    longitude.value = location.lng().toString();
  })
}

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
    <div class="location-picker">
      <div id="map"></div>
      <input
        v-model="locationName"
        type="text"
        placeholder="Location Name (optional)"
        :disabled="isPosting"
      />
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
    </div>
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
  box-sizing: border-box; /* Add this to include padding in width calculation */
}

/* Remove margin from last input in each container */
.location-picker input:last-of-type,
textarea:last-of-type {
  margin-bottom: 0;
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

.location-picker {
  margin: 10px 0;
}

#map {
  width: 100%;
  height: 300px;
  margin: 10px 0;
  border-radius: 4px;
}
</style>
