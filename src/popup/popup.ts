import { fetchUserInfo, fetchUserSubmissions, fetchUserRatingHistory, fetchProblemset, CodeforcesApiError } from '@/services/codeforcesApi';
import { analyzeSubmissions } from '@/services/submissionAnalyzer';
import { computeTopicStrength } from '@/services/topicStrengthEngine';
import { buildGrindPlan } from '@/services/grindCoach';
import { recommendProblems } from '@/services/recommendationEngine';
import { analyzeContests } from '@/services/contestAnalytics';
import { computeStreaks, motivationalMessage } from '@/services/streakSystem';
import { getSettings, updateSettings } from '@/services/settingsService';
import { getCachedOrFetch, storageSet } from '@/storage/storage';
import { STORAGE_KEYS, RANK_COLORS } from '@/constants';
import { renderRadarChart, renderRatingLineChart, renderBarChart } from '@/components/charts';
import { escapeHtml, formatDate } from '@/utils';
import type { CFUser, SubmissionAnalysis, GrindPlan, RecommendedProblem, ContestAnalytics, StreakData } from '@/types';

const handleInput = document.getElementById('handle-input') as HTMLInputElement;
const loadBtn = document.getElementById('load-btn') as HTMLButtonElement;
const handleError = document.getElementById('handle-error') as HTMLDivElement;
const loadingEl = document.getElementById('loading') as HTMLDivElement;
const tabsEl = document.getElementById('tabs') as HTMLElement;
const panelsEl = document.getElementById('panels') as HTMLElement;
const settingsBtn = document.getElementById('settings-btn') as HTMLButtonElement;

settingsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

function setLoading(isLoading: boolean) {
  loadingEl.classList.toggle('hidden', !isLoading);
}

function showError(message: string) {
  handleError.textContent = message;
}

function activateTab(tabName: string) {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.tab === tabName);
  });
  document.querySelectorAll('.panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === `panel-${tabName}`);
  });
}

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => activateTab((btn as HTMLElement).dataset.tab!));
});

function renderProfile(user: CFUser, analysis: SubmissionAnalysis) {
  const panel = document.getElementById('panel-profile')!;
  const rankColor = RANK_COLORS[(user.rank ?? '').toLowerCase()] ?? '#8b97ab';
  panel.innerHTML = `
    <div class="profile-header">
      <img src="${user.titlePhoto ?? user.avatar ?? ''}" alt="${escapeHtml(user.handle)}" onerror="this.style.display='none'" />
      <div>
        <div class="handle">${escapeHtml(user.handle)}</div>
        <div class="rank" style="color:${rankColor}">${escapeHtml(user.rank ?? 'Unrated')}</div>
      </div>
    </div>
    <div class="stat-grid">
      <div class="stat-box"><div class="label">Rating</div><div class="value">${user.rating ?? '—'}</div></div>
      <div class="stat-box"><div class="label">Max Rating</div><div class="value">${user.maxRating ?? '—'}</div></div>
      <div class="stat-box"><div class="label">Max Rank</div><div class="value">${escapeHtml(user.maxRank ?? '—')}</div></div>
      <div class="stat-box"><div class="label">Contribution</div><div class="value">${user.contribution}</div></div>
      <div class="stat-box"><div class="label">Friend Of</div><div class="value">${user.friendOfCount}</div></div>
      <div class="stat-box"><div class="label">Country</div><div class="value">${escapeHtml(user.country ?? '—')}</div></div>
      <div class="stat-box"><div class="label">Organization</div><div class="value">${escapeHtml(user.organization ?? '—')}</div></div>
      <div class="stat-box"><div class="label">Total Solved</div><div class="value">${analysis.totalSolved}</div></div>
    </div>
    <div class="section-title">Solved by Rating Bucket</div>
    <canvas id="chart-buckets" height="160"></canvas>
  `;
  renderBarChart(
    'chart-buckets',
    analysis.ratingBuckets.map((b) => b.bucket),
    analysis.ratingBuckets.map((b) => b.count)
  );
}

function renderTopics(analysis: SubmissionAnalysis) {
  const panel = document.getElementById('panel-topics')!;
  const { strongest, weakest, radarTopics } = computeTopicStrength(analysis.topicStats);

  const rowHtml = (tag: string, confidence: number) => `
    <div class="topic-row">
      <span>${escapeHtml(tag)}</span>
      <div class="confidence-bar"><div style="width:${confidence}%"></div></div>
    </div>
  `;

  panel.innerHTML = `
    <div class="section-title">Topic Radar</div>
    <canvas id="chart-radar" height="220"></canvas>
    <div class="section-title">💪 Strongest Topics</div>
    ${strongest.map((t) => rowHtml(t.tag, t.confidence)).join('') || '<div class="empty-state">Not enough data yet.</div>'}
    <div class="section-title">⚠️ Weakest Topics</div>
    ${weakest.map((t) => rowHtml(t.tag, t.confidence)).join('') || '<div class="empty-state">Not enough data yet.</div>'}
  `;
  renderRadarChart(
    'chart-radar',
    radarTopics.map((t) => t.tag),
    radarTopics.map((t) => t.confidence)
  );
}

function renderCoach(plan: GrindPlan) {
  const panel = document.getElementById('panel-coach')!;
  panel.innerHTML = `
    <div class="stat-grid">
      <div class="stat-box"><div class="label">Current Rating</div><div class="value">${plan.currentRating}</div></div>
      <div class="stat-box"><div class="label">Target Rating</div><div class="value">${plan.targetRating}</div></div>
    </div>
    <div class="section-title">Estimated Timeline</div>
    <p style="font-size:12px;color:var(--text-muted)">${plan.estimatedWeeks} week${plan.estimatedWeeks === 1 ? '' : 's'} of focused practice</p>
    <div class="section-title">Your Plan</div>
    ${plan.items
      .map(
        (item) => `
      <div class="plan-item">
        <span class="type-badge">${item.type.replace('-', ' ')}</span>
        ${escapeHtml(item.description)}
      </div>`
      )
      .join('')}
  `;
}

function renderRecommendations(recs: RecommendedProblem[]) {
  const panel = document.getElementById('panel-recs')!;
  if (recs.length === 0) {
    panel.innerHTML = '<div class="empty-state">No recommendations available. Try again later.</div>';
    return;
  }
  panel.innerHTML = `
    <div class="section-title">Top Recommendations</div>
    ${recs
      .map(
        (p) => `
      <div class="rec-item">
        <a href="https://codeforces.com/problemset/problem/${p.contestId}/${p.index}" target="_blank" rel="noopener">
          ${p.contestId}${p.index} — ${escapeHtml(p.name)}
        </a>
        <div class="meta">Rating: ${p.rating ?? '—'} · Tags: ${p.tags.join(', ')}</div>
        <div class="reason">${escapeHtml(p.reason)}</div>
      </div>`
      )
      .join('')}
  `;
}

function renderContests(analytics: ContestAnalytics) {
  const panel = document.getElementById('panel-contests')!;
  if (analytics.history.length === 0) {
    panel.innerHTML = '<div class="empty-state">No rated contests found for this handle.</div>';
    return;
  }
  panel.innerHTML = `
    <div class="section-title">Rating History</div>
    <canvas id="chart-rating" height="160"></canvas>
    <div class="stat-grid">
      <div class="stat-box"><div class="label">Best Contest</div><div class="value">${analytics.bestContest ? `+${analytics.bestContest.newRating - analytics.bestContest.oldRating}` : '—'}</div></div>
      <div class="stat-box"><div class="label">Worst Contest</div><div class="value">${analytics.worstContest ? `${analytics.worstContest.newRating - analytics.worstContest.oldRating}` : '—'}</div></div>
      <div class="stat-box"><div class="label">Avg Gain</div><div class="value">+${analytics.averageGain}</div></div>
      <div class="stat-box"><div class="label">Avg Loss</div><div class="value">${analytics.averageLoss}</div></div>
      <div class="stat-box"><div class="label">Volatility</div><div class="value">${analytics.volatility}</div></div>
      <div class="stat-box"><div class="label">Total Contests</div><div class="value">${analytics.history.length}</div></div>
    </div>
    <div class="section-title">Last 10 Contests</div>
    <table class="contest-table">
      <thead><tr><th>Contest</th><th>Rank</th><th>Δ</th></tr></thead>
      <tbody>
        ${analytics.last10
          .map((c) => {
            const delta = c.newRating - c.oldRating;
            const cls = delta >= 0 ? 'gain' : 'loss';
            return `<tr><td>${escapeHtml(c.contestName)}</td><td>${c.rank}</td><td class="${cls}">${delta >= 0 ? '+' : ''}${delta}</td></tr>`;
          })
          .join('')}
      </tbody>
    </table>
  `;
  renderRatingLineChart(
    'chart-rating',
    analytics.history.map((c) => new Date(c.ratingUpdateTimeSeconds * 1000).toLocaleDateString()),
    analytics.history.map((c) => c.newRating)
  );
}

function renderStreak(streak: StreakData) {
  const panel = document.getElementById('panel-streak')!;
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  panel.innerHTML = `
    <div class="streak-flame">🔥</div>
    <div class="streak-number">${streak.currentStreak} day${streak.currentStreak === 1 ? '' : 's'}</div>
    <div class="motivation">${escapeHtml(motivationalMessage(streak))}</div>
    <div class="stat-grid" style="margin-top:16px;">
      <div class="stat-box"><div class="label">Longest Streak</div><div class="value">${streak.longestStreak}</div></div>
      <div class="stat-box"><div class="label">Last Solve</div><div class="value">${streak.lastSolveDate ? formatDate(streak.lastSolveDate) : '—'}</div></div>
    </div>
    <div class="section-title">Last 7 Days</div>
    <div class="week-grid">
      ${streak.weeklyActivity.map((solved, i) => `<div class="week-cell ${solved ? 'solved' : ''}" title="${dayLabels[i]}"></div>`).join('')}
    </div>
  `;
}

async function loadDashboard(handle: string) {
  showError('');
  setLoading(true);
  tabsEl.classList.add('hidden');
  panelsEl.classList.add('hidden');

  try {
    const user = await fetchUserInfo(handle);
    const submissions = await getCachedOrFetch(
      `${STORAGE_KEYS.SUBMISSIONS_CACHE}_${handle}`,
      30,
      () => fetchUserSubmissions(handle)
    );
    const ratingHistory = await getCachedOrFetch(
      `${STORAGE_KEYS.RATING_CACHE}_${handle}`,
      30,
      () => fetchUserRatingHistory(handle)
    );
    const problemset = await getCachedOrFetch(STORAGE_KEYS.PROBLEMSET_CACHE, 360, () =>
      fetchProblemset()
    );

    const analysis = analyzeSubmissions(submissions);
    const currentRating = user.rating ?? (analysis.averageRating || 1200);
    const plan = buildGrindPlan(currentRating, analysis.topicStats);
    const recs = recommendProblems(problemset, {
      currentRating,
      solvedIds: analysis.solvedProblemIds,
      topicStats: analysis.topicStats
    });
    const contestAnalytics = analyzeContests(ratingHistory);
    const streak = computeStreaks(submissions);

    renderProfile(user, analysis);
    renderTopics(analysis);
    renderCoach(plan);
    renderRecommendations(recs);
    renderContests(contestAnalytics);
    renderStreak(streak);

    await storageSet(STORAGE_KEYS.USER_PROFILE, user);
    await storageSet(STORAGE_KEYS.STREAK, streak);
    await updateSettings({ handle });

    tabsEl.classList.remove('hidden');
    panelsEl.classList.remove('hidden');
    activateTab('profile');
  } catch (err) {
    const message =
      err instanceof CodeforcesApiError ? err.message : 'Something went wrong. Please try again.';
    showError(message);
  } finally {
    setLoading(false);
  }
}

loadBtn.addEventListener('click', () => {
  const handle = handleInput.value.trim();
  if (!handle) {
    showError('Please enter a Codeforces handle.');
    return;
  }
  void loadDashboard(handle);
});

handleInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loadBtn.click();
});

async function init() {
  const settings = await getSettings();
  document.body.className = settings.theme === 'dark' ? 'theme-dark' : 'theme-light';
  if (settings.handle) {
    handleInput.value = settings.handle;
    void loadDashboard(settings.handle);
  }
}

void init();
