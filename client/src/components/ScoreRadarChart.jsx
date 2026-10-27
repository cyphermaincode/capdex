import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export default function ScoreRadarChart({ labels = [], scores = [], title = 'Competency Breakdown' }) {
  const data = {
    labels: labels.length > 0 ? labels : ['Metric 1', 'Metric 2', 'Metric 3', 'Metric 4', 'Metric 5'],
    datasets: [
      {
        label: 'Score (out of 10)',
        data: scores.length > 0 ? scores : [8, 9, 7.5, 8.5, 9],
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(34, 197, 94, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(34, 197, 94, 1)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        pointLabels: {
          color: '#cbd5e1',
          font: {
            size: 11,
            family: "'Plus Jakarta Sans', sans-serif"
          }
        },
        ticks: {
          display: true,
          backdropColor: 'transparent',
          color: '#64748b',
          stepSize: 2,
          min: 0,
          max: 10
        },
        suggestedMin: 0,
        suggestedMax: 10
      },
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10
      }
    },
  };

  return (
    <div className="w-full h-64 md:h-72">
      <Radar data={data} options={options} />
    </div>
  );
}
