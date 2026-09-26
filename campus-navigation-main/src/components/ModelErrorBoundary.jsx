import React, { Component } from 'react';

export class ModelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('GLB Model missing or failed to load. Please export Revit files to the public/models/ directory:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1000, 10, 1000]} />
          <meshStandardMaterial color='red' wireframe />
        </mesh>
      );
    }
    return this.props.children;
  }
}
