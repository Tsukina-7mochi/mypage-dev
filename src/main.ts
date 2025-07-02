import { initUptimeDisplay } from './uptime-display.ts';
import { initKeyboard } from './keyboard.ts';

import('live-reload-plugin');

function init() {
  initUptimeDisplay();
  initKeyboard();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
