import { use } from "react";
import { Suspense } from "react";

async function load(): Promise<boolean> {
  await new Promise((resolve) => {
    setTimeout(resolve, 100);
  });
  return true;
}

function Content(props: { dataPromise: Promise<boolean> }) {
  const _ = use(props.dataPromise);
  return (
    <>
      <div>Hello from Server Island!</div>
      <div>User Agent: {navigator.userAgent}</div>
    </>
  );
}

export default function () {
  const dataPromise = load();

  return (
    <Suspense fallback="Loading...">
      <Content dataPromise={dataPromise} />
    </Suspense>
  );
}
