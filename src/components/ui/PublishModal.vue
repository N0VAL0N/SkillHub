<!-- components/ui/PublishModal.vue -->
<template>
  <div class="modal" @click.self="close">
    <div class="modal-content">
      <h2>Опубликовать задание</h2>
      <p class="description">Выберите классы, для которых будет доступно задание</p>
      <div class="classes-list">
        <label v-for="cls in classes" :key="cls.id" class="class-checkbox">
          <input type="checkbox" :value="cls.id" v-model="selectedClasses" />
          <span>{{ cls.name }}</span>
        </label>
      </div>
      <div class="modal-actions">
        <button @click="publish" class="btn-primary">Опубликовать</button>
        <button @click="close" class="btn-secondary">Отмена</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { db } from '@/services/firebase';
import { collection, getDocs } from 'firebase/firestore';

const props = defineProps({
  examId: { type: String, required: true }
});
const emit = defineEmits(['published', 'close']);

const classes = ref([]);
const selectedClasses = ref([]);

onMounted(async () => {
  const classesSnap = await getDocs(collection(db, 'classes'));
  classes.value = classesSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
});

const publish = () => {
  emit('published', selectedClasses.value);
  close();
};

const close = () => {
  emit('close');
};
</script>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  width: 90%;
  max-width: 400px;
}
.classes-list {
  margin: 1rem 0;
  max-height: 200px;
  overflow-y: auto;
}
.class-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
}
.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}
</style>