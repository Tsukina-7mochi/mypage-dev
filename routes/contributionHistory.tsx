import { hc, type InferResponseType, parseResponse } from "hono/client";
import { Suspense } from "react";

import { type ApiType } from "../src/api/index.ts";

const isPrerender = !!new URL(import.meta.url).searchParams.get("prerender");
const client = hc<ApiType>("http://localhost:8080/api");

type ContributionHistory = InferResponseType<
  typeof client.contributionHistory.$get,
  200
>;

async function fetchContributionHistory(): Promise<ContributionHistory | null> {
  try {
    return await parseResponse(client.contributionHistory.$get());
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function ContributionHistory() {
  const contributionHistory = await fetchContributionHistory();
  if (contributionHistory === null) {
    return <ErrorFallback />;
  }

  const { counts } = contributionHistory;
  const numCols = Math.ceil(counts.length / 7);

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

function Fallback() {
  return <p className="fallback">[Loading]</p>;
}

function ErrorFallback() {
  return <p className="fallback">[Load Failed]</p>;
}

export default function () {
  if (isPrerender) {
    return <Fallback />;
  }

  return (
    <Suspense fallback={<Fallback />}>
      <ContributionHistory />
    </Suspense>
  );
}
