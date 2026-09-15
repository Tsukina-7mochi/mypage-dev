import * as parse5 from "parse5";

import { getClientIslands } from "./helper.ts";

Deno.test("island props exclude framework-reserved attributes", () => {
  const document = parse5.parse(`
    <script
      type="application/client-island"
      src="./counter.tsx"
      label="Counter"
      _prerender="forged"
      _internal="secret"
    ></script>
  `);

  const [island] = getClientIslands(document);
  if (island.src !== "./counter.tsx") {
    throw new Error(`Unexpected island src: ${island.src}`);
  }
  if (JSON.stringify(island.props) !== JSON.stringify({ label: "Counter" })) {
    throw new Error(`Unexpected island props: ${JSON.stringify(island.props)}`);
  }
});
