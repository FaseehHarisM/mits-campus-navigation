const http = require('http');

const edges = [
  { EdgeID: 'E_F2_18_17', StartNodeID: 'RAM-F2-18', EndNodeID: 'RAM-F2-17', Distance: 1708, EdgeType: 'walkway' },
  { EdgeID: 'E_F2_17_16', StartNodeID: 'RAM-F2-17', EndNodeID: 'RAM-F2-16', Distance: 1748, EdgeType: 'walkway' },
  { EdgeID: 'E_F2_16_15', StartNodeID: 'RAM-F2-16', EndNodeID: 'RAM-F2-15', Distance: 1732, EdgeType: 'walkway' }
];

edges.forEach(edge => {
  const data = JSON.stringify(edge);
  const options = {
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/edges',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
  };
  const req = http.request(options, res => {
    res.on('data', d => process.stdout.write(d));
  });
  req.on('error', error => console.error(error));
  req.write(data);
  req.end();
});
