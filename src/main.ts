import { initUptimeDisplay } from './uptime-display.ts';

import('live-reload-plugin');

function init() {
  initUptimeDisplay();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
