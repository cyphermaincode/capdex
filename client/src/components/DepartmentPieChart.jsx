import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

export default function DepartmentPieChart({ labels = [], dataPoints = [] }) {
  const data = {
    labels: labels.length > 0 ? labels : ['< 70 (Under)', '70-79 (Developing)', '80-89 (Proficient)', '90-100 (Exceptional)'],
    datasets: [
      {
        data: dataPoints.length > 0 ? dataPoints : [1, 2, 4, 3],
        backgroundColor: [
          'rgba(244, 63, 94, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(56, 189, 248, 0.8)',
          'rgba(34, 197, 94, 0.8)',
        ],
        borderColor: '#0f172a',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#cbd5e1',
          boxWidth: 12,
          padding: 15,
          font: {
            size: 11
          }
        }
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
    cutout: '65%'
  };

  return (
    <div className="w-full h-64 md:h-72">
      <Doughnut data={data} options={options} />
    </div>
  );
}
