import { Hono } from "hono";
import * as v from "valibot";

import type { Bindings } from "../bindings.ts";

const contributionLevelList = [
  "NONE",
  "FIRST_QUARTILE",
  "SECOND_QUARTILE",
  "THIRD_QUARTILE",
  "FOURTH_QUARTILE",
] as const;
const contributionLevelMap = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
} as const;

const ContributionCalendarSchema = v.object({
  data: v.object({
    user: v.object({
      contributionsCollection: v.object({
        contributionCalendar: v.object({
          weeks: v.array(
            v.object({
              contributionDays: v.array(
                v.object({
                  contributionCount: v.number(),
                  contributionLevel: v.pipe(
                    v.picklist(contributionLevelList),
                    v.transform((level) => contributionLevelMap[level]),
                  ),
                  date: v.string(),
                }),
              ),
            }),
          ),
        }),
      }),
    }),
  }),
});

const app = new Hono<Bindings>().get("/", async (c) => {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      // use Deno.env for development now
      Authorization: `bearer ${Deno.env.get("GH_API_TOKEN")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query:
        "query($userName:String!) { user(login: $userName) { contributionsCollection { contributionCalendar { weeks { contributionDays { contributionCount contributionLevel date } } } } } }",
      variables: {
        userName: "Tsukina-7mochi",
      },
    }),
  });

  if (!res.ok) {
    return c.json({ error: "bad gateway" }, 502);
  }

  const data = v.parse(ContributionCalendarSchema, await res.json());
  const calendar = data.data.user.contributionsCollection.contributionCalendar;
  const firstDate = calendar.weeks.at(0)?.contributionDays[0].date;
  const lastDate = calendar.weeks.at(-1)?.contributionDays.at(-1)?.date;
  const counts = calendar.weeks.flatMap((week) =>
    week.contributionDays.map((day) => ({
      count: day.contributionCount,
      level: day.contributionLevel,
    }))
  );

  if (!firstDate || !lastDate) {
    return c.json({ error: "no contribution data" }, 404);
  }

  return c.json({
    firstDate,
    lastDate,
    counts,
  });
});

export default app;
