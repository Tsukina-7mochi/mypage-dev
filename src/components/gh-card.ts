import { css, html, LitElement } from 'lit';
import { Task } from 'lit/task';

// The html, styles and basic logic is quoted from tarptaeya/repo-card (public domain)
// https://github.com/tarptaeya/repo-card/blob/master/repo-card.js

type Emojis = Record<string, string>;
let _emojis: Emojis | null = null;
const getEmojis = async function (signal: AbortSignal): Promise<Emojis> {
  if (_emojis === null) {
    const res = await fetch('https://api.github.com/emojis', { signal });
    if (!res.ok) {
      throw Error(`${res.status} ${await res.text()}`);
    }

    _emojis = await res.json() as Emojis;
  }

  return _emojis;
};

type Colors = Record<string, { color: string; url: string }>;
let _colors: Colors | null = null;
const getColors = async function (signal: AbortSignal): Promise<Colors> {
  if (_colors === null) {
    const res = await fetch(
      'https://raw.githubusercontent.com/ozh/github-colors/master/colors.json',
      { signal },
    );
    if (!res.ok) {
      throw Error(`${res.status} ${await res.text()}`);
    }
    _colors = await res.json() as Colors;
  }

  return _colors;
};

type GhRepository = {
  name: string;
  html_url: string;
  description?: string;
  fork: boolean;
  stargazers_count: number;
  forks: number;
  language?: string;
  source: {
    full_name: string;
    html_url: string;
  };
};
const fetchGhRepository = async function (
  slug: string,
  signal: AbortSignal,
): Promise<GhRepository> {
  const url = `https://api.github.com/repos/${slug}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw Error(`${res.status} ${await res.text()}`);
  }
  return await res.json() as GhRepository;
};

const replaceEmojis = function (text: string, emojis: Emojis): string {
  return text.replace(
    /:\w+:/g,
    function (match) {
      const name = match.substring(1, match.length - 1);
      const emoji = emojis[name];

      if (emoji) {
        return `<span><img src="${emoji}" style="width: 1rem; height: 1rem; vertical-align: -0.2rem;" alt="${name}"></span>`;
      }

      return match;
    },
  );
};

const pendingElement = html`
  <div class="card">Loading repository data...</div>
`;

const errorElement = html`
  <div class="card">Failed to fetch repository data.</div>
`;

const theme = {
  background: css`white`,
  borderColor: css`#e1e4e8`,
  color: css`#586069`,
  linkColor: css`#0366d6`,
};

class GhCard extends LitElement {
  static properties = {
    slug: {},
  };
  static styles = css`
    div.card {
      font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji;
      border: 1px solid ${theme.borderColor};
      border-radius: 6px;
      background: ${theme.background};
      padding: 16px;
      font-size: 14px;
      line-height: 1.5;
      color: #24292e;
    }
  `;

  declare slug: string;

  _fatchDataTask = new Task(this, {
    task: ([slug], { signal }) => {
      return Promise.all([
        fetchGhRepository(slug, signal),
        getEmojis(signal),
        getColors(signal),
      ]);
    },
    args: () => [this.slug],
  });

  constructor() {
    super();
    this.slug = '';
  }

  render() {
    return this._fatchDataTask.render({
      pending: () => pendingElement,
      error: () => errorElement,
      complete: ([data, emojis, colors]) => {
        data.description = replaceEmojis(data.description || '', emojis);

        return html`
          <div class="card">
          <div style="display: flex; align-items: center;">
            <svg style="fill: ${theme.color}; margin-right: 8px;" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"></path></svg>
            <span style="font-weight: 600; color: ${theme.linkColor};">
              <a style="text-decoration: none; color: inherit;" href="${data.html_url}">${data.name}</a>
            </span>
          </div>
          <div style="display: ${
          data.fork ? 'block' : 'none'
        }; font-size: 12px; color: ${theme.color};">Forked from <a style="color: inherit; text-decoration: none;" href="${
          data.fork ? data.source.html_url : ''
        }">${data.fork ? data.source.full_name : ''}</a></div>
          <div style="font-size: 12px; margin-bottom: 16px; margin-top: 8px; color: ${theme.color};">${data.description}</div>
    
          <div style="font-size: 12px; color: ${theme.color}; display: flex;">
            <div style="${
          data.language ? '' : 'display: none;'
        } margin-right: 16px;">
              <span style="width: 12px; height: 12px; border-radius: 100%; background-color: ${
          data.language ? colors[data.language].color : ''
        }; display: inline-block; top: 1px; position: relative;"></span>
              <span>${data.language}</span>
            </div>
            <div style="display: ${
          data.stargazers_count === 0 ? 'none' : 'flex'
        }; align-items: center; margin-right: 16px;">
              <svg style="fill: ${theme.color};" aria-label="stars" viewBox="0 0 16 16" version="1.1" width="16" height="16" role="img"><path fill-rule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694v.001z"></path></svg>
              &nbsp; <span>${data.stargazers_count}</span>
            </div>
            <div style="display: ${
          data.forks === 0 ? 'none' : 'flex'
        }; align-items: center;">
              <svg style="fill: ${theme.color};" aria-label="fork" viewBox="0 0 16 16" version="1.1" width="16" height="16" role="img"><path fill-rule="evenodd" d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"></path></svg>
              &nbsp; <span>${data.forks}</span>
            </div>
          </div>
        </div>
        `;
      },
    });
  }
}

export default GhCard;
