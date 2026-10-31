export const endPoint = "/__reload";

function liveReloadCode() {
  return `(() => {
  let bootId;
  new EventSource("${endPoint}").addEventListener("boot", (event) => {
    if (bootId === undefined) {
      bootId = event.data;
    } else if (bootId !== event.data) {
      location.reload();
    }
  });
})()`;
}

export function liveReloadScript() {
  return `<script>${liveReloadCode()}</script>`;
}
