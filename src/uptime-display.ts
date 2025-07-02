const startDate = new Date('2001-08-28T00:00:00Z');

export function initUptimeDisplay() {
  const element = document.getElementById('uptime-display');
  if (!element) {
    console.warn('Uptime display element not found.');
    return;
  }

  const now = new Date();
  const uptime = Math.floor(now.getTime() - startDate.getTime());
  const uptimeYears = Math.floor(uptime / (1000 * 60 * 60 * 24 * 365));
  const uptimeDays = Math.floor(uptime / (1000 * 60 * 60 * 24)) % 365;

  const uptimeText = `${uptimeYears} years and ${uptimeDays} day(s)`;

  element.textContent = `${uptimeText}`;
}
