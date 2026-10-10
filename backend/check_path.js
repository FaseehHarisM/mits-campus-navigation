const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/campus-navigation')
.then(async () => {
    const db = mongoose.connection.db;
    const nodesData = await db.collection('nodes').find({}).toArray();
    const edgesData = await db.collection('edges').find({}).toArray();
    
    const g = {};
    nodesData.forEach(n => g[n.NodeID] = {});
    edgesData.forEach(e => {
        g[e.StartNodeID][e.EndNodeID] = { distance: e.Distance, type: e.EdgeType || 'walkway' };
        g[e.EndNodeID][e.StartNodeID] = { distance: e.Distance, type: e.EdgeType || 'walkway' };
    });

    const startNode = nodesData.find(n => n.Name === 'COMPUTER SCIENCE DEPT');
    
    function runDijkstra(startNodeID, endNodeID) {
        const distances = {};
        const previous = {};
        const unvisited = new Set();
      
        nodesData.forEach(n => {
          distances[n.NodeID] = Infinity;
          previous[n.NodeID] = null;
          unvisited.add(n.NodeID);
        });
      
        distances[startNodeID] = 0;
      
        while (unvisited.size > 0) {
          let currNode = null;
          let minDistance = Infinity;
          
          for (let node of unvisited) {
            if (distances[node] < minDistance) {
              minDistance = distances[node];
              currNode = node;
            }
          }
      
          if (currNode === null || currNode === endNodeID) break;
      
          unvisited.delete(currNode);
      
          for (let neighbor in g[currNode]) {
            if (!unvisited.has(neighbor)) continue;
            
            const edge = g[currNode][neighbor];
      
            const newDist = distances[currNode] + edge.distance;
            if (newDist < distances[neighbor]) {
              distances[neighbor] = newDist;
              previous[neighbor] = currNode;
            }
          }
        }
      
        if (distances[endNodeID] === Infinity) return null;
      
        const path = [];
        let curr = endNodeID;
        while (curr !== null) {
          path.unshift(curr);
          curr = previous[curr];
        }
      
        return {
          pathNodeIDs: path,
          totalDistance: distances[endNodeID]
        };
    }

    const exits = nodesData.filter(n => 
      n.Type === 'Exit' || 
      (n.Name && (n.Name.toLowerCase().includes('exit') || n.Name.toLowerCase().includes('main door')))
    );

    console.log(`Found ${exits.length} exits.`);

    exits.forEach(ex => {
        const res = runDijkstra(startNode.NodeID, ex.NodeID);
        if (res) {
            console.log(`Path to ${ex.Name} found! Distance: ${res.totalDistance}`);
        } else {
            console.log(`NO path to ${ex.Name} from CS DEPT.`);
        }
    });
    
    process.exit(0);
})
