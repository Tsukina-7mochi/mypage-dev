export function initKeyboard() {
  const lineHeight = 16 * 1.25;
  let cmd = '';

  const executeCommand = function () {
    if (cmd === 'j') {
      globalThis.scrollBy(0, lineHeight);
      cmd = '';
    } else if (cmd === 'k') {
      globalThis.scrollBy(0, -lineHeight);
      cmd = '';
    } else if (cmd === 'g') {
      // do nothing
    } else if (cmd === 'gg') {
      globalThis.scrollTo(0, 0);
      cmd = '';
    } else if (cmd === 'G') {
      globalThis.scrollTo(0, document.body.scrollHeight);
      cmd = '';
    } else {
      cmd = '';
      return;
    }
  };

  document.addEventListener('keypress', (event) => {
    if (event.key.length === 1) {
      cmd += event.key;
      executeCommand();
    }
  });
}
