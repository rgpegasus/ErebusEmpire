const QUERY = `
query ($idMal: Int) {
  Media(idMal: $idMal, type: ANIME) {
    duration
    relations {
      edges {
        relationType
        node { idMal type format startDate { year month day } }
      }
    }
  }
}`;

const memo = new Map();

async function anilist(id) {
  for (let retry = 0; ; retry++) {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { idMal: id } }),
      signal: AbortSignal.timeout(15000),
    });

    if (res.status === 429 && retry < 3) {
      await new Promise(r => setTimeout(r, Number(res.headers.get("Retry-After") ?? 30) * 1000));
      continue;
    }

    const json = await res.json();
    if (json.errors) throw new Error(json.errors[0].message);
    return json.data.Media;
  }
}

function fetchMedia(id) {
  if (!memo.has(id)) {
    memo.set(id, anilist(id).catch(e => (memo.delete(id), Promise.reject(e))));
  }
  return memo.get(id);
}
function next(media, type) {
  const date = ({ startDate: d }) => (d.year ?? 9999) * 10000 + (d.month ?? 0) * 100 + (d.day ?? 0);
  return media.relations.edges
    .filter(e => e.relationType === type && e.node.type === "ANIME" && e.node.idMal
      && ["TV", "TV_SHORT"].includes(e.node.format))
    .sort((a, b) => date(a.node) - date(b.node))[0]?.node.idMal;
}

async function getSeason(anyMalId, wanted) {
  const seen = new Set();
  let id = Number(anyMalId);
  for (;;) {
    seen.add(id);
    const media = await fetchMedia(id);
    const up = next(media, "PREQUEL") ?? next(media, "PARENT");
    if (!up || seen.has(up)) break;
    id = up;
  }

  seen.clear();
  for (let season = 1; ; season++) {
    seen.add(id);
    const media = await fetchMedia(id);
    if (season === wanted) return { malId: id, duration: media.duration };
    const down = next(media, "SEQUEL");
    if (!down || seen.has(down)) return null;
    id = down;
  }
}

export async function getSkipTimes(animeMalId, wantedSeason, wantedEpisode, videoLength) {
  const season = await getSeason(animeMalId, Number(wantedSeason));
  if (!season) return null;

  const len = videoLength ? Math.round(videoLength) : (season.duration ?? 24) * 60;
  const lengths = videoLength ? [len, 0] : [len, 0, len - 10, len + 10];

  return Promise.any(
    lengths.map(async l => {
      const params = new URLSearchParams({ episodeLength: l });
      ["op", "ed", "mixed-op", "mixed-ed", "recap"].forEach(t => params.append("types", t));

      const res = await fetch(`https://api.aniskip.com/v2/skip-times/${season.malId}/${wantedEpisode}?${params}`, {
        signal: AbortSignal.timeout(8000),
      });
      const data = res.ok ? await res.json() : null;
      if (!data?.found) throw new Error("empty");
      return data.results;
    })
  ).catch(() => []);
}
