<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBluesky } from '../libs/bluesky'
import { AppBskyFeedPost, RichText } from '@atproto/api'
import { useRouter } from 'vue-router'

const router = useRouter()
const { agent } = useBluesky()
const postText = ref('')
const isPosting = ref(false)
const errorMessage = ref('')
const latitude = ref('')
const longitude = ref('')
const locationName = ref('')
const map = ref<google.maps.Map | null>(null)
const marker = ref<google.maps.Marker | null>(null)
const addLink = ref(true)
const baseUrl = (window.location.origin + import.meta.env.BASE_URL).slice(0, -1);

const generatePostId = () => {
  return `geo-${Date.now()}`
}

onMounted(() => {
  initializeMap()
})

const initializeMap = async () => {
  const mapElement = document.getElementById('map') as HTMLElement;

  const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
  const { Marker } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

  map.value = new Map(mapElement, {
    center: { lat: 40.7414599557659, lng: -74.00339116926585 }, // Default to Google NYC
    zoom: 13,
    streetViewControl: false,
    zoomControl: true,
  });

  marker.value = new Marker({
    position: map.value.getCenter(),
    map: map.value
  });

  map.value.addListener('center_changed', () => {
    const location = map.value!.getCenter()!;
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
    const postId = generatePostId()
    let finalText = postText.value.trim()
    if (addLink.value) {
      const postUrl = router.resolve({ path: `/post/eid/${postId}` }).href
      finalText += `\n\nView map: ${baseUrl}${postUrl}`
    }

    // Create and parse rich text
    const rt = new RichText({ text: finalText }, {cleanNewlines: true})
    await rt.detectFacets(agent.value) // This detects mentions, links, and tags

    const post = {
      text: rt.text,
      facets: rt.facets,
      createdAt: new Date().toISOString(),
      embed: {
        $type: 'community.lexicon.location.geo',
        latitude: latitude.value,
        longitude: longitude.value,
        name: locationName.value.trim(),
      },
    }

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
    <textarea v-model="postText" placeholder="What's on your mind?" :disabled="isPosting"></textarea>
    <div class="location-picker">
      <div id="map"></div>
      <input v-model="locationName" type="text" placeholder="Location Name (optional)" :disabled="isPosting" />
      <input v-model="latitude" type="text" placeholder="Latitude" :disabled="isPosting" />
      <input v-model="longitude" type="text" placeholder="Longitude" :disabled="isPosting" />
      <label class="link-option">
        <input type="checkbox" v-model="addLink" />
        Add map link for compatibility
      </label>
    </div>
    <div class="actions">
      <span class="error" v-if="errorMessage">{{ errorMessage }}</span>
      <button @click="handleSubmit" :disabled="isPosting || !postText.trim()">
        {{ isPosting ? 'Posting...' : 'Post' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.new-post {
  margin: 16px 0;
  padding: 12px;
  background-color: var(--surface-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

textarea,
input {
  width: 100%;
  padding: 10px; /* Consistent padding */
  margin-bottom: 10px; /* Consistent margin */
  border: 1px solid var(--border-color);
  border-radius: 4px;
  resize: vertical;
  box-sizing: border-box;
  color: var(--text-color);
  background-color: var(--background-color);
}

/* Remove margin from last input in each container */
.location-picker input:last-of-type,
textarea:last-of-type {
  margin-bottom: 0;
}

.actions {
  display: flex;
  justify-content: flex-end; /* Align button to the right */
  align-items: center;
  margin-top: 8px;
}

@media (max-width: 768px) {
  .actions {
    justify-content: center; /* Center button on smaller screens */
  }
}

button {
  padding: 10px 20px; /* Increased padding */
  background-color: var(--primary-color);
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
  color: var(--error-color);
  margin-right: 16px;
}

.location-picker {
  margin: 8px 0;
}

#map {
  width: 100%;
  height: 200px;
  margin: 8px 0;
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

@media (max-width: 768px) {
  #map {
    height: auto; /* Make map height responsive */
    min-height: 150px; /* Set a minimum height */
  }
}
</style>
