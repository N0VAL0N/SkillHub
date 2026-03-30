<template>
  <div class="base-layout">
    <header class="header">
      <slot name="header">
        <div class="default-header">ЕГЭ‑ПРО</div>
      </slot>
    </header>
    <main class="main">
      <slot />
    </main>
    <footer class="footer">
      <slot name="footer">
        <div class="default-footer">© 2026 ЕГЭ‑ПРО</div>
      </slot>
    </footer>
  </div>
</template>

<style scoped>
.base-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.header {
  background: var(--gray-100);
  padding: 1rem;
  flex-shrink: 0;
}
.main {
  flex: 1;
  padding: 1rem;
}
.footer {
  background: var(--gray-100);
  padding: 0.5rem;
  text-align: center;
  flex-shrink: 0;
}
</style>