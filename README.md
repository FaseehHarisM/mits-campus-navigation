# MITS Campus Navigation System 🗺️🎓

A full-stack, mobile-friendly 3D campus navigation system built specifically for **Muthoot Institute of Technology and Science (MITS)**. This application was developed to help students, faculty, and visitors seamlessly navigate the complex layout of the MITS college campus using a custom Dijkstra-based pathfinding algorithm and an interactive 3D floor plan.

## ✨ Key Features
* **Interactive 3D Maps**: Built with React-Three-Fiber to provide an intuitive, rotatable isometric 3D view of the MITS campus buildings.
* **Smart Pathfinding (Dijkstra)**: Calculates the absolute shortest walking path between any two locations on campus.
* **Accessibility Modes**: Users can toggle "Wheelchair Accessible" routing, which automatically reroutes the path to avoid stairs and prioritize elevators.
* **Cross-Floor Navigation**: Seamlessly guides users between different floors (Basement, Ground, First Floor) using visually animated elevators and stairs.
* **QR Code Integration**: Scan physical QR codes placed around the MITS campus to instantly detect your current location and get directions.
* **Admin Dashboard**: A secure, JWT-authenticated control panel to manage nodes, drawing edges, faculty office locations, and live campus events.

## 🛠️ Tech Stack & Architecture
* **Frontend**: React.js, Vite, React-Three-Fiber (3D engine), Three.js
* **Backend**: Node.js, Express.js
* **Database**: MongoDB, Mongoose
* **Security & Auth**: JWT (JSON Web Tokens), Bcrypt.js password hashing
* **File Processing**: Multer (for SVG floor plan uploads)

## 🚀 Getting Started

### Prerequisites
* Node.js (v16+)
* MongoDB

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/mits-campus-navigation.git
   ```
2. Install Backend Dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Install Frontend Dependencies:
   ```bash
   cd campus-navigation-main
   npm install
   ```

### Running the App
Run the provided startup script from the root directory to launch both servers simultaneously:
```bash
./start.bat
```
Navigate to `http://localhost:5173` in your browser.

## 🎓 Academic Context & Showcase
This project was developed as an MCA Mini Project. It serves as a practical demonstration of integrating complex Data Structures (Graph Theory & Dijkstra's Algorithm) into a modern Full-Stack Web Application (MERN), while also exploring 3D Graphics rendering in the browser. 
