import { hc, InferResponseType, parseResponse } from "hono/client";
import { Suspense, use, useMemo } from "react";

import { type ApiType } from "../worker/api.ts";

const client = hc<ApiType>("http://localhost:8080/api");
type ContributionHistory = InferResponseType<
  typeof client.contributionHistory.$get,
  200
>;

function Display(props: { historyPromise: Promise<ContributionHistory> }) {
  const { counts } = use(props.historyPromise);
  const numCols = useMemo(() => {
    return Math.ceil(counts.length / 7);
  }, [counts.length]);

  return (
    <>
      <table className="contribution-calendar">
        <tbody>
          {[0, 1, 2, 3, 4, 5, 6].map((row) => (
            <tr key={row}>
              {Array.from({ length: numCols }, (_, i) => i).map((i) => (
                <td key={i} data-level={counts[7 * i + row]?.level ?? 0} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default function () {
  const history = parseResponse(client.contributionHistory.$get());

  return (
    <Suspense fallback={<div className="loading">Loading...</div>}>
      <Display historyPromise={history} />
    </Suspense>
  );
}
