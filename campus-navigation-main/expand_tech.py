import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
# Wait, not Navigate.jsx. The file is Mini_Project_Report.md
filepath = "Mini_Project_Report.md"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_tech = """### 3.3 Technologies Used
*   **React.js & Vite:** Frontend framework and build tool for fast, reactive UI.
*   **React Three Fiber (R3F) & Drei:** WebGL wrappers for rendering 3D models and handling camera controls.
*   **Node.js & Express:** Backend server handling API requests.
*   **MongoDB:** NoSQL database for storing dynamic graph data (Nodes and Edges).
*   **Axios:** For API communication between frontend and backend.
*   **jsQR:** For reading QR codes via the device camera."""

new_tech = """### 3.3 Technologies Used
The MITS Campus Navigation System is developed using modern web technologies to support 3D rendering, interactive routing, and dynamic data management.

#### 3.3.1 React.js
React.js is used as the core frontend library for building the user interface. It allows for the creation of reusable UI components and efficiently updates the view when the user's location or destination changes.

#### 3.3.2 React Three Fiber (R3F) & Drei
React Three Fiber is a React reconciler for Three.js, used to render the 3D architectural models of the campus in WebGL. Drei provides useful helper components for camera controls and HTML overlays within the 3D scene.

#### 3.3.3 Vite
Vite is used as the frontend build tool. It provides a lightning-fast development server with Hot Module Replacement (HMR) and highly optimized production builds, which is essential for handling large 3D assets on mobile devices.

#### 3.3.4 Node.js and Express.js
Node.js is the backend runtime environment, while Express.js serves as the web framework. Together, they handle API requests, process the routing logic, and act as a bridge between the React frontend and the database.

#### 3.3.5 MongoDB
MongoDB is a NoSQL database used to store the dynamic spatial graph data. Its flexible document structure allows for efficient storage and retrieval of complex map nodes and relational edge paths.

#### 3.3.6 HTML5 and CSS3
HTML5 provides the structural foundation for the web application, while CSS3 is utilized to style the interface, ensuring a responsive, app-like experience across both desktop laptops and mobile smartphones.

#### 3.3.7 JavaScript (ES6+)
JavaScript is the primary programming language used across the entire stack (MERN stack). It powers the complex routing algorithms, 3D interactions, and API communication.

#### 3.3.8 jsQR
jsQR is a JavaScript library used to interface directly with the device's camera. It enables the application to scan physical QR codes placed around the campus to instantly calibrate the user's starting position."""

content = content.replace(old_tech, new_tech)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Expanded Technologies Used section")
