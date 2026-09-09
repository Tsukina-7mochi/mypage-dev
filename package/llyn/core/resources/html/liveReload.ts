export const endPoint = "/__reload";

function liveReloadCode() {
  return `new EventSource("${endPoint}").addEventListener("reload",  () => location.reload())`;
}

export function liveReloadScript() {
  return `<script>${liveReloadCode()}</script>`;
}
