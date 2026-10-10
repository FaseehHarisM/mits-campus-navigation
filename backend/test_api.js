fetch('http://localhost:5000/api/nodes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        NodeID: 'J' + Date.now().toString().slice(-6) + Math.floor(Math.random()*100),
        Name: 'Junction',
        Type: 'Junction',
        Floor: '1',
        X: 500,
        Y: 500
    })
}).then(res => res.json()).then(data => console.log(data)).catch(err => console.error(err));
