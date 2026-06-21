import { fetchUserInfo } from '@/services/codeforcesApi';
import { getSettings } from '@/services/settingsService';
import { generateHint } from '@/services/ai';
import type { HintRequest } from '@/types';

function parseProblemFromUrl(): { contestId?: string; index?: string } | null {
  const match = window.location.pathname.match(
    /\/(?:contest|problemset\/problem|gym)\/(\d+)\/(?:problem\/)?([A-Za-z0-9]+)/
  );
  if (!match) return null;
  return { contestId: match[1], index: match[2] };
}

function getProblemName(): string {
  const el = document.querySelector('.problem-statement .header .title');
  return el?.textContent?.trim() ?? document.title;
}

function getProblemRating(): number | undefined {
  const tagEl = document.querySelector('.tag-box[title]');
  // Codeforces sometimes exposes rating via a span with class like "tag-box" containing "*1500"
  const allTags = Array.from(document.querySelectorAll('.tag-box'));
  for (const t of allTags) {
    const text = t.textContent?.trim() ?? '';
    const m = text.match(/\*(\d{3,4})/);
    if (m) return parseInt(m[1], 10);
  }
  return tagEl ? undefined : undefined;
}

function getProblemTags(): string[] {
  const allTags = Array.from(document.querySelectorAll('.tag-box'));
  return allTags
    .map((t) => t.textContent?.trim() ?? '')
    .filter((t) => t && !t.startsWith('*'));
}

function difficultyBand(problemRating: number, userRating: number): {
  label: string;
  cssClass: string;
  solveProbability: number;
} {
  const diff = problemRating - userRating;
  if (diff <= -200) return { label: 'Easier', cssClass: 'ace-easier', solveProbability: 0.92 };
  if (diff <= 100) return { label: 'Appropriate', cssClass: 'ace-appropriate', solveProbability: 0.7 };
  if (diff <= 300) return { label: 'Challenging', cssClass: 'ace-challenging', solveProbability: 0.4 };
  return { label: 'Very Hard', cssClass: 'ace-veryhard', solveProbability: 0.15 };
}

async function buildSidebar() {
  const problemMeta = parseProblemFromUrl();
  if (!problemMeta) return; // not a problem page

  const settings = await getSettings();
  const problemName = getProblemName();
  const problemTags = getProblemTags();
  const problemRating = getProblemRating();

  const sidebar = document.createElement('div');
  sidebar.id = 'ace-sidebar';

  let comparisonHtml = '<div class="ace-prob">Set your handle in Settings to see a comparison.</div>';
  if (settings.handle) {
    try {
      const user = await fetchUserInfo(settings.handle);
      if (problemRating && user.rating) {
        const band = difficultyBand(problemRating, user.rating);
        comparisonHtml = `
          <div class="ace-prob">Problem rating: <strong>${problemRating}</strong> · Your rating: <strong>${user.rating}</strong></div>
          <span class="ace-badge ${band.cssClass}">${band.label}</span>
          <div class="ace-prob">Estimated solve probability: <strong>${Math.round(band.solveProbability * 100)}%</strong></div>
        `;
      } else {
        comparisonHtml = '<div class="ace-prob">Problem has no rating yet (unrated/gym).</div>';
      }
    } catch (e) {
      comparisonHtml = `<div class="ace-error">${(e as Error).message}</div>`;
    }
  }

  const tagsHtml = problemTags.map((t) => `<span class="ace-tag">${t}</span>`).join('');

  sidebar.innerHTML = `
    <button class="ace-toggle" id="ace-close">✕</button>
    <h3>🏆 ACE ICPC | CF GRIND</h3>
    ${comparisonHtml}
    <div style="margin-top:8px;">${tagsHtml}</div>
    <div class="ace-hint-buttons">
      <button data-level="hint1">Hint 1</button>
      <button data-level="hint2">Hint 2</button>
      <button data-level="hint3">Hint 3</button>
      <button data-level="approach">Approach</button>
      <button data-level="related">Related Concepts</button>
    </div>
    <div class="ace-hint-output" id="ace-hint-output" style="display:none;"></div>
  `;

  document.body.appendChild(sidebar);

  document.getElementById('ace-close')?.addEventListener('click', () => {
    sidebar.remove();
  });

  const output = sidebar.querySelector<HTMLDivElement>('#ace-hint-output')!;
  const buttons = sidebar.querySelectorAll<HTMLButtonElement>('.ace-hint-buttons button');

  buttons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const level = btn.dataset.level as HintRequest['level'];
      buttons.forEach((b) => (b.disabled = true));
      output.style.display = 'block';
      output.textContent = 'Thinking...';

      try {
        const text = await generateHint(settings.ai.provider, settings.ai.apiKey, {
          problemName,
          problemTags,
          problemRating,
          level
        });
        output.textContent = text;
      } catch (e) {
        output.innerHTML = `<span class="ace-error">${(e as Error).message}</span>`;
      } finally {
        buttons.forEach((b) => (b.disabled = false));
      }
    });
  });
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  void buildSidebar();
} else {
  document.addEventListener('DOMContentLoaded', () => void buildSidebar());
}
