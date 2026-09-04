# MITS Campus Navigation System

An enterprise-grade, full-stack 3D geospatial navigation platform engineered for the **Muthoot Institute of Technology and Science (MITS)**. This application delivers real-time, interactive indoor and outdoor routing, solving complex spatial navigation challenges using optimized graph algorithms and WebGL-based 3D rendering.

## System Architecture & Capabilities
* **Interactive 3D Geospatial Engine**: Leverages `react-three-fiber` and `Three.js` to render highly performant, rotatable isometric 3D models of multi-story infrastructure.
* **Algorithmic Pathfinding**: Implements a highly optimized Dijkstra's Shortest Path algorithm across a custom node-edge graph architecture to deliver instantaneous route calculations.
* **Dynamic Accessibility Routing**: Features context-aware routing parameters that dynamically recalculate traversal graphs to avoid stairs and prioritize elevators for wheelchair accessibility.
* **Multi-Layer Floor Traversal**: Programmatically handles vertical graph traversal, seamlessly animating user paths across varying Z-axis elevations (e.g.gg, Basement to First Floor).
* **Location Intelligence (QR)**: Integrates device camera APIs with deterministic QR parsing to establish exact user coordinates in physical space.
* **Secure Content Management System (CMS)**: Includes a role-based Admin Dashboard protected by stateless JWT authentication and bcrypt password hashing for managing spatial graph data (Nodes, Edges, Facilities) in real-time.

## Technology Stack
* **Client-Side Environment**: React.js, Vite, React-Three-Fiber, Three.js
* **Server-Side Environment**: Node.js, Express.js REST API
* **Database Layer**: MongoDB (NoSQL), Object Data Modeling via Mongoose
* **Security**: JWT (JSON Web Tokens), Bcrypt.js Cryptography
* **Asset Pipeline**: Multer middleware for robust multipart/form-data vector graphic processing.

## Getting Started

### Prerequisites
* Node.js (v16+)
* MongoDB instance

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/mits-campus-navigation.git
   ```
2. Initialize Backend Environment:
   ```bash
   cd backend
   npm install
   ```
3. Initialize Frontend Environment:
   ```bash
   cd campus-navigation-main
   npm install
   ```

### Execution
Run the provided bootstrap script from the root directory to initiate concurrent microservices:
```bash
./start.bat
```
Navigate to `http://localhost:5173` in your browser.

## Engineering Showcase
This platform was developed as a comprehensive demonstration of applied software engineering principles. It highlights the successful integration of complex Data Structures (Graph Theory), scalable Full-Stack Web Architecture (MERN), and performant Client-Side 3D Graphics rendering within a production-ready application environment.
