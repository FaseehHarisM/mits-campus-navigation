import React from 'react';

export default function DeleteModal({ isOpen, onConfirm, onCancel, itemName }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: 'white', padding: '24px', borderRadius: '12px',
        width: '400px', maxWidth: '90%', boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#d32f2f' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>warning</span>
          <h2 style={{ margin: 0, fontSize: '20px' }}>Confirm Deletion</h2>
        </div>
        
        <p style={{ margin: '0 0 24px 0', color: '#5f6368', lineHeight: '1.5' }}>
          Are you sure you really want to delete <strong>{itemName || 'this item'}</strong>? This action cannot be undone.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button 
            onClick={onCancel}
            style={{
              padding: '8px 16px', borderRadius: '6px', border: '1px solid #dadce0',
              background: 'white', color: '#3c4043', cursor: 'pointer', fontWeight: 'bold'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            style={{
              padding: '8px 16px', borderRadius: '6px', border: 'none',
              background: '#d32f2f', color: 'white', cursor: 'pointer', fontWeight: 'bold'
            }}
          >
            Yes, Delete it
          </button>
        </div>
      </div>
    </div>
  );
}
