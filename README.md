<div align="center">
  
# MITS Campus Navigation System

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**An enterprise-grade, full-stack 3D geospatial navigation platform engineered for the Muthoot Institute of Technology and Science (MITS).**

[Features](#key-features) • [Architecture](#system-architecture) • [Installation](#getting-started) • [Tech Stack](#technology-stack)

</div>

---

## Overview
This application delivers real-time, interactive indoor and outdoor routing, solving complex spatial navigation challenges. By combining highly optimized graph algorithms (Dijkstra) with WebGL-based 3D rendering, it provides an intuitive, step-by-step navigation experience across multi-story campus infrastructure.

---

## Key Features

* **Interactive 3D Geospatial Engine**: Leverages `react-three-fiber` and `Three.js` to render highly performant, rotatable isometric 3D models of multi-story infrastructure.
* **Algorithmic Pathfinding**: Implements a highly optimized Dijkstra's Shortest Path algorithm across a custom node-edge graph architecture to deliver instantaneous route calculations.
* **Dynamic Accessibility Routing**: Features context-aware routing parameters that dynamically recalculate traversal graphs to avoid stairs and prioritize elevators for wheelchair accessibility.
* **Multi-Layer Floor Traversal**: Programmatically handles vertical graph traversal, seamlessly animating user paths across varying Z-axis elevations (e.g., Basement to First Floor).
* **Location Intelligence (QR)**: Integrates device camera APIs with deterministic QR parsing to establish exact user coordinates in physical space, verifying location at staircases and lifts.
* **Secure Content Management System (CMS)**: Includes a role-based Admin Dashboard protected by stateless JWT authentication and bcrypt password hashing for managing spatial graph data (Nodes, Edges, Facilities) in real-time.

---

## Technology Stack

### Client-Side Architecture
* **Framework:** React.js powered by Vite
* **3D Graphics:** React-Three-Fiber, Three.js, Drei
* **Styling:** Modular CSS & Inline Flexbox Layouts

### Server-Side Architecture
* **Runtime:** Node.js
* **API Framework:** Express.js REST API
* **Security:** JWT (JSON Web Tokens), Bcrypt.js Cryptography
* **Asset Pipeline:** Multer middleware for robust multipart/form-data vector graphic processing

### Database Layer
* **Database:** MongoDB (NoSQL)
* **ODM:** Object Data Modeling via Mongoose

---

## Getting Started

### Prerequisites
* Node.js (v16.0.0 or higher)
* MongoDB instance (Local or Atlas)
* Git

### Installation Guide

**1. Clone the repository:**
```bash
git clone https://github.com/FaseehHarisM/mits-campus-navigation.git
cd mits-campus-navigation
```

**2. Initialize Backend Environment:**
```bash
cd backend
npm install
```

**3. Initialize Frontend Environment:**
```bash
cd ../campus-navigation-main
npm install
```

**4. Environment Variables:**
Create a `.env` file in the `backend` directory and add your MongoDB URI:
```env
MONGO_URI=mongodb://localhost:27017/CampusNav
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
```

### Execution
Run the provided bootstrap script from the root directory to initiate both the frontend and backend microservices concurrently:

**Windows:**
```bash
./start.bat
```

Navigate to `http://localhost:5173` in your browser to view the application.

---

## Engineering Showcase
This platform was developed as a comprehensive demonstration of applied software engineering principles. It highlights the successful integration of complex Data Structures (Graph Theory), scalable Full-Stack Web Architecture (MERN), and performant Client-Side 3D Graphics rendering within a production-ready application environment.

---

<div align="center">
  <p>&copy; 2026 Faseeh Haris M. All rights reserved.</p>
</div>
