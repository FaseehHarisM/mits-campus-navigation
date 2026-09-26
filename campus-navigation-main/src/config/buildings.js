export const CAMPUS_BUILDINGS = {
  ramanujan: {
    id: 'ramanujan',
    name: 'Ramanujan Block',
    floors: [
      { id: '-1', label: 'G', path: '/models/ramanujan/ground.glb', heightOffset: -600, transform: { scale: [200, 200, 200], position: [0, 0, 0], rotation: [0, 0, 0] } },
      { id: '0', label: 'F1', path: '/models/ramanujan/first.glb', heightOffset: 0, transform: { scale: [200, 200, 200], position: [0, 0, 0], rotation: [0, 0, 0] } },
      { id: '1', label: 'F2', path: '/models/ramanujan/second.glb', heightOffset: 600, transform: { scale: [200, 200, 200], position: [0, 0, 0], rotation: [0, 0, 0] } }
    ]
  }
};
