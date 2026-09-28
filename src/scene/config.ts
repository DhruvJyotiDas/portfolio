export const cameraStops = [
  { position: [0, 1.2, 14.1], target: [0, 0, 0], rotation: [.46, -.36, -.18] },
  { position: [0, .7, 10.7], target: [0, 0, 0], rotation: [.23, -.15, -.1] },
  { position: [-1.8, 1.4, 11.6], target: [-1.3, 0, 0], rotation: [.2, -.12, .035] },
  { position: [1, 1.8, 12.6], target: [.55, .1, 0], rotation: [.3, -.18, -.1] },
  { position: [0, 0, 13], target: [0, 0, 0], rotation: [0, 0, 0] },
  { position: [.4, 1.1, -13.7], target: [0, 0, 0], rotation: [.15, .18, -.12] },
  { position: [0, -4.2, 12.3], target: [0, -1.1, 0], rotation: [.18, -.15, -.09] },
] as const
export type Quality = 'low' | 'medium' | 'high'
