import React, { useState, useEffect } from 'react';
import { getFaculty } from '../services/api';

export default function Faculty({ setActiveTab, handleNavigation }) {
  const [facultyList, setFacultyList] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [facultyData, nodesData] = await Promise.all([
          getFaculty(),
          import('../services/api').then(m => m.getNodes())
        ]);
        setFacultyList(facultyData);
        setNodes(nodesData);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getRoomName = (nodeId) => {
    const node = nodes.find(n => n.NodeID === nodeId);
    return node ? node.Name : nodeId;
  };

  return (
    <div style={{ padding: '24px', paddingBottom: '90px', animation: 'fadeIn 0.3s ease-in-out' }}>
      
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--mits-red)', fontSize: '1.8rem' }}>badge</span>
          Faculty Directory
        </h1>
      </header>

      <div className="search-bar" style={{ marginBottom: '24px' }}>
        <span className="material-symbols-outlined">search</span>
        <input type="text" placeholder="Search faculty name..." style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', color: 'var(--text-primary)' }} />
      </div>
      
      {loading ? (
        <p>Loading faculty...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {facultyList.map((faculty, idx) => (
            <div key={idx} className="card">
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem' }}>{faculty.Name}</h3>
              <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>domain</span> {faculty.Department} Department
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>location_on</span> {getRoomName(faculty.RoomNodeID)}
                </span>
              </p>
              <button className="btn-outline" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }} onClick={() => handleNavigation(getRoomName(faculty.RoomNodeID))}>
                <span className="material-symbols-outlined">directions</span> Navigate to Location
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
