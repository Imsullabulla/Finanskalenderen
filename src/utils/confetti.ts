'use client';
import confetti from 'canvas-confetti';

export function fireConfetti(): void {
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2', '#b7e4c7', '#ffffff'],
    ticks: 220,
    gravity: 1.1,
    scalar: 0.9,
  });
}
