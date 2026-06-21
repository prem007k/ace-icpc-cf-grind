import {
  Chart,
  RadarController,
  RadialLinearScale,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  BarController,
  BarElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

Chart.register(
  RadarController,
  RadialLinearScale,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  BarController,
  BarElement,
  Filler,
  Tooltip,
  Legend
);

const chartInstances = new Map<string, Chart>();

function destroyExisting(canvasId: string) {
  const existing = chartInstances.get(canvasId);
  if (existing) {
    existing.destroy();
    chartInstances.delete(canvasId);
  }
}

export function renderRadarChart(
  canvasId: string,
  labels: string[],
  data: number[]
): void {
  destroyExisting(canvasId);
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) return;
  const chart = new Chart(canvas, {
    type: 'radar',
    data: {
      labels,
      datasets: [
        {
          label: 'Confidence',
          data,
          backgroundColor: 'rgba(30,144,210,0.25)',
          borderColor: '#1e90d2',
          pointBackgroundColor: '#1e90d2'
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { display: false },
          grid: { color: '#2a3140' },
          pointLabels: { color: '#8b97ab', font: { size: 9 } }
        }
      },
      plugins: { legend: { display: false } }
    }
  });
  chartInstances.set(canvasId, chart);
}

export function renderRatingLineChart(
  canvasId: string,
  labels: string[],
  data: number[]
): void {
  destroyExisting(canvasId);
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) return;
  const chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Rating',
          data,
          borderColor: '#1e90d2',
          backgroundColor: 'rgba(30,144,210,0.15)',
          fill: true,
          tension: 0.25,
          pointRadius: 2
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: { ticks: { color: '#8b97ab', font: { size: 8 } }, grid: { display: false } },
        y: { ticks: { color: '#8b97ab', font: { size: 9 } }, grid: { color: '#2a3140' } }
      },
      plugins: { legend: { display: false } }
    }
  });
  chartInstances.set(canvasId, chart);
}

export function renderBarChart(
  canvasId: string,
  labels: string[],
  data: number[],
  color = '#1e90d2'
): void {
  destroyExisting(canvasId);
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) return;
  const chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Solved', data, backgroundColor: color }]
    },
    options: {
      responsive: true,
      scales: {
        x: { ticks: { color: '#8b97ab', font: { size: 8 } }, grid: { display: false } },
        y: { ticks: { color: '#8b97ab', font: { size: 9 } }, grid: { color: '#2a3140' } }
      },
      plugins: { legend: { display: false } }
    }
  });
  chartInstances.set(canvasId, chart);
}
