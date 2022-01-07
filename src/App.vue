<template>
    <ThreeWrap :start="start" :update="update" />
</template>

<script setup lang="ts">
import { ThreeWrap, Vue3ThreeWrap } from 'vue3-three-wrap'
import * as THREE from 'three'

// build a box
const box = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshBasicMaterial({ color: 'blue' })
)
box.position.z = -5

// add the box
// `start` runs once when the scene is ready
const start: Vue3ThreeWrap.Start = (opts) => {
    opts.scene.add(box)
}

// rotate the box
// `update` runs once per frame
const update: Vue3ThreeWrap.Update = () => {
    box.rotation.y -= 0.0166
}
</script>