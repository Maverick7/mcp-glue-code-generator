<template>
  <div class="ds-card" :class="variant">
    <div class="card-header">
      <h3 class="title">{{ title }}</h3>
      <span class="badge" :class="variant">{{ status }}</span>
    </div>
    <p class="subtitle">{{ subtitle }}</p>
    <p class="description">{{ description }}</p>
    <div class="amount-section">
      <span class="amount">{{ formattedAmount }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  title: string;
  subtitle?: string;
  description?: string;
  amount?: number;
  status?: string;
  variant?: 'success' | 'warning' | 'error' | 'neutral';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'neutral',
});

const formattedAmount = computed(() => {
  if (!props.amount) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(props.amount);
});
</script>

<style scoped>
.ds-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #fff;
}

.badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge.success { background: #10B981; color: #fff; }
.badge.warning { background: #F59E0B; color: #fff; }
.badge.error { background: #EF4444; color: #fff; }
.badge.neutral { background: #6B7280; color: #fff; }

.subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  margin-bottom: 8px;
}

.description {
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
  margin-bottom: 16px;
}

.amount {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
}
</style>
