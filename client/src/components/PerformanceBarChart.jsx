import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function PerformanceBarChart({ labels = [], dataPoints = [], label = 'Average Score' }) {
  const data = {
    labels: labels.length > 0 ? labels : ['Engineering', 'Marketing', 'Sales', 'Product'],
    datasets: [
      {
        label,
        data: dataPoints.length > 0 ? dataPoints : [86.5, 82.0, 78.4, 88.0],
        backgroundColor: 'rgba(56, 189, 248, 0.75)',
        borderColor: '#38bdf8',
        borderWidth: 1,
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(56, 189, 248, 0.95)',
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
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
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 11
          }
        }
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 11
          },
          stepSize: 20
        }
      }
    }
  };

  return (
    <div className="w-full h-64 md:h-72">
      <Bar data={data} options={options} />
    </div>
  );
}
