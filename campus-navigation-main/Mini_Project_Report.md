# MITS Campus Navigation System - Mini Project Report

**Note:** Copy this content into Microsoft Word and apply the necessary formatting (page breaks, bolding, logos, etc.) to match your college's exact template. Replace all bracketed placeholders like `[Your Name]` with your actual details.

---

[Insert College Logo Here]
**Muthoot Institute of Technology and Science (Autonomous)**
**Department Of Computer Applications**

# MITS CAMPUS NAVIGATION SYSTEM (3D WEBGL INDOOR NAVIGATION)

**A250201/CA330V MINI PROJECT REPORT**
Submitted In Partial Fulfilment Of The Requirements For The Award Of
**MASTER OF COMPUTER APPLICATIONS**

Submitted by
**[Your Name]**
**[Your Register Number]**

Under the guidance of
**[Guide's Name]**
**[Guide's Designation, e.g., ASSISTANT PROFESSOR]**

MCA 2025–2027 Batch
October 2026

---
*(Page Break)*

[Insert College Logo Here]
**Muthoot Institute of Technology and Science (Autonomous)**
**Department Of Computer Applications**

## BONAFIDE CERTIFICATE

This is to certify that the project report entitled **“MITS Campus Navigation System (3D WebGL Indoor Navigation)”** is a bonafide record of the work carried out by **[Your Name]** Reg. No. **[Your Register Number]**, under my supervision, in partial fulfilment of the requirements for the award of the Master of Computer Applications degree of Muthoot Institute of Technology & Science.

Place: Varikoli  
Date: 

| Project Guide | Project Coordinators | HOD |
| :--- | :--- | :--- |
| **[Guide's Name]** | **Dr Smitha Anu Thomas** | **Dr Saritha K** |
| | **Jiss Kuruvilla** | |

Submitted for the Final Evaluation held on ………………………

Name and Signature of the Examiner: _______________________

---
*(Page Break)*

## DECLARATION

I hereby declare that the Mini Project report **“MITS Campus Navigation System (3D WebGL Indoor Navigation)”** submitted for the partial fulfilment of the requirements for the award of degree of Master of Computer Applications of the Muthoot Institute of Technology and Science is a bonafide work done by me under the supervision of **[Guide's Name]**. External sources used are acknowledged in the references. This report has not been previously formed the basis for the award of any degree, diploma or similar title of any other University.

**[Your Name]**  
**[Your Register Number]**  

Place: Varikoli  
Date: 

---
*(Page Break)*

## ACKNOWLEDGEMENT

I would like to express my sincere gratitude to all those who have supported me throughout my project entitled **MITS Campus Navigation System (3D WebGL Indoor Navigation)**. First, I extend my heartfelt thanks to our Principal, **Dr Neelakantan P C**, for providing a conductive learning environment. My appreciation also goes to my Head of Department, **Dr Saritha K**, whose guidance and encouragement have been invaluable.

I am particularly thankful to my project coordinators for this Mini Project, **Dr Smitha Anu Thomas** and **Jiss Kuruvilla**, for their support in managing the project, and especially to my Project Guide, **[Guide's Name]**, for mentorship and insightful feedback. Their expertise and feedback has influenced my work.

I would also like to acknowledge my department and fellow classmates for their camaraderie, which has made this journey enjoyable. Lastly, my deepest appreciation goes to my family for their unwavering love and support. This project would not have been possible without the collective encouragement from all these individuals. Thank you for believing in me and for being a part of my academic journey.

---
*(Page Break)*

## ABSTRACT

The **MITS Campus Navigation System** is a responsive, web-based 3D indoor navigation application developed to help students, faculty, and visitors effortlessly locate rooms, labs, and facilities within the Muthoot Institute of Technology and Science (MITS) campus, with a primary focus on the Ramanujan Block. Traditional 2D campus maps are often confusing and lack interactive routing. This project solves that by rendering a fully interactive 3D WebGL model of the campus floors directly in the browser, allowing users to visualize their routes in real-time.

The application is built using a modern JavaScript stack. The frontend is powered by **React.js** and **React Three Fiber (R3F)** for high-performance 3D rendering, while **Vite** is used as the build tool to ensure rapid deployment and mobile optimization. The backend API is constructed using **Node.js** and **Express**, with **MongoDB** serving as the database to store the spatial graph data of nodes (rooms, junctions, stairs) and edges (walkways). 

Key features include a QR code scanning system that allows users to instantly set their current location by scanning physical codes placed around the campus, a dynamic shortest-path routing algorithm, an accessibility toggle to avoid stairs, and an **Admin Map Editor**. The Admin Map Editor is a specialized interface that allows administrators to visually add, move, and link nodes, as well as physically draw continuous navigation paths directly onto the 3D floor models, ensuring the map data can be easily updated as the campus evolves.

By integrating optimized GLTF 3D models with a mathematical graph-routing backend, this project delivers a seamless, app-like navigation experience that is fully accessible via any mobile browser without requiring app store downloads, significantly improving the campus experience for all visitors.

---
*(Page Break)*

## TABLE OF CONTENTS

1. Introduction
   1.1 Background & Motivation
   1.2 Problem Statement
   1.3 Objectives
   1.4 Scope of the Project
   1.5 Scrum Methodology
2. Literature Review
3. System Study and Requirements
   3.1 Existing System
   3.2 Proposed System
   3.3 Technologies Used
   3.4 Software and Hardware Requirements
   3.5 Module Description
4. Methodology and Implementation
   4.1 System Architecture
   4.2 Database Design
   4.3 Admin Map Editor Module
   4.4 3D Navigation & Routing Module
   4.5 QR Code Scanner Module
   4.6 Methodology
5. Results and Discussion
   5.1 Testing Strategy
   5.2 Results and Discussion
6. Conclusion and Future Scope
   6.1 Conclusion
   6.2 Limitations
   6.3 Future Scope
7. References
8. Appendix

---
*(Page Break)*

## LIST OF ABBREVIATIONS

| Abbreviation | Full Form |
| :--- | :--- |
| API | Application Programming Interface |
| GLTF / GLB | GL Transmission Format (Binary) |
| JSON | JavaScript Object Notation |
| R3F | React Three Fiber |
| UI / UX | User Interface / User Experience |
| WebGL | Web Graphics Library |
| QR | Quick Response |
| REST | Representational State Transfer |

---
*(Page Break)*

## CHAPTER 1: INTRODUCTION

### 1.1 Background & Motivation
Navigating a large educational institution can be a daunting task for new students, parents, and visiting faculty. Large multi-story buildings like the Ramanujan Block feature complex layouts, multiple staircases, and dozens of specialized laboratories and offices. While static 2D maps and physical signboards provide some assistance, they do not offer personalized, point-to-point routing. The motivation behind this project is to leverage modern web technologies to bring GPS-like indoor routing directly to the user's smartphone. By utilizing WebGL, we can render the actual architectural geometry of the campus in 3D, providing a highly intuitive and visually accurate navigation experience.

### 1.2 Problem Statement
The current method of finding locations within the MITS campus relies entirely on static floor plans and asking for directions. When users need to find a specific faculty cabin or laboratory, they often get lost transitioning between floors or misinterpreting 2D diagrams. Furthermore, keeping static maps updated when room assignments change is tedious. There is a strong need for an interactive, web-based 3D routing system that can instantly calculate the shortest path between any two points in the building, account for accessibility needs (like avoiding stairs), and provide an administrative tool to easily update the map's graph data.

### 1.3 Objectives
The primary objective of this project is to design and develop a responsive 3D indoor navigation system.
The specific objectives are:
1. Develop an interactive 3D map of the Ramanujan Block using React Three Fiber.
2. Implement a shortest-path graph routing algorithm to calculate routes between rooms.
3. Create a QR code scanning feature that allows users to instantly establish their starting location.
4. Develop an Admin Map Editor that allows authorized personnel to add nodes, draw paths, and update the graph visually.
5. Optimize 3D models and rendering logic to ensure smooth performance on low-end mobile devices over local networks.

### 1.4 Scope of the Project
The scope of this project encompasses the frontend 3D visualization, the backend API, and the database management for the MITS Campus Navigation System. The initial implementation focuses primarily on the Ramanujan Block (Ground, First, and Second floors). It includes an Admin Editor for map maintenance and a User Navigation portal for point-to-point routing. The system is designed to be highly scalable, allowing for the future addition of other campus blocks.

### 1.5 Scrum Methodology
#### 1.5.1 Overview of Scrum Framework
The project was developed using the Scrum framework, an Agile methodology suited for projects requiring iterative development. It involves organizing work into fixed-length iterations called sprints, allowing for continuous feedback, rapid prototyping, and the ability to adapt to complex technical challenges, such as optimizing 3D draw calls for mobile devices.

#### 1.5.2 Implementation of Scrum in Project
The development was divided into sprints focusing on specific deliverables:
*   **Sprint 1:** Foundation. Setting up Vite, React, Node.js backend, and MongoDB. Integrating basic 3D model loading using R3F.
*   **Sprint 2:** Data Structure & Admin Editor. Creating the graph node/edge system and building the Admin Map Editor to visually place nodes and link paths.
*   **Sprint 3:** Routing & UI. Implementing the shortest-path algorithm, QR scanner, and user interface for destination selection.
*   **Sprint 4:** Optimization. Drastically reducing GLTF draw calls using `gltf-transform` to fix mobile lag, and resolving WebGL DOM occlusion issues.

---
*(Page Break)*

## CHAPTER 2: LITERATURE REVIEW

**2.1 "A Review of Indoor Positioning Systems and Routing Algorithms"**
Research into indoor navigation emphasizes the limitations of traditional GPS, which fails to penetrate building structures. Studies show that representing indoor environments as a node-edge graph is the most efficient way to handle multi-floor routing. 

**2.2 "Performance Optimization of WebGL for Mobile Browsers"**
Literature regarding WebGL and Three.js highlights that the primary bottleneck for mobile devices is not polygon count, but rather the number of individual "draw calls." Research suggests that merging meshes and baking materials is critical for maintaining 60 FPS on mobile web browsers, a concept heavily utilized in this project via `gltf-transform`.

---
*(Page Break)*

## CHAPTER 3: SYSTEM STUDY AND REQUIREMENTS

### 3.1 Existing System
The existing system relies on physical signboards and static 2D floor plans posted on notice boards. There is no digital, interactive routing system. If a room changes its purpose, a new map must be physically printed. Visitors with accessibility needs cannot easily determine routes that avoid stairs.

### 3.2 Proposed System
The proposed system is a centralized web application. Users access the app via a browser (no installation required). They can scan a QR code on the wall to set their start point, select a destination from a dropdown, and instantly view a 3D animated path guiding them to their destination. The system includes a backend database to store map nodes, and an Admin Map Editor to visually update the map.

### 3.3 Technologies Used
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
jsQR is a JavaScript library used to interface directly with the device's camera. It enables the application to scan physical QR codes placed around the campus to instantly calibrate the user's starting position.

### 3.4 Software and Hardware Requirements
**Software Requirements:**
*   **OS:** Windows, macOS, or Linux (Development), iOS/Android (Client)
*   **Browser:** WebGL-compatible browser (Chrome, Safari, Firefox)
*   **Database:** MongoDB
*   **Environment:** Node.js

**Hardware Requirements:**
*   **Client Device:** Smartphone or Laptop with basic GPU acceleration.
*   **Server:** Standard web server with at least 2GB RAM.

### 3.5 Module Description
*   **3D Navigation Module:** Responsible for rendering the GLTF models, plotting the calculated path in 3D space, and managing the camera.
*   **Routing Module:** Implements algorithms to calculate the shortest path traversing through nodes and across floors via stair/elevator junctions.
*   **Admin Map Editor:** An interactive 3D UI allowing admins to drop nodes, draw edges, and delete paths.
*   **QR Scanner Module:** Interfaces with the device camera to read location codes.

---
*(Page Break)*

## CHAPTER 4: METHODOLOGY AND IMPLEMENTATION

### 4.1 System Architecture
The system uses a 3-tier architecture. The Frontend (React/R3F) handles all visual rendering and 3D interactions. It communicates via REST API to the Backend (Node.js/Express), which processes the business logic. The Backend reads from and writes to the Database (MongoDB), which stores the spatial graph.

### 4.2 Database Design
The database consists primarily of two collections:
*   **Nodes:** Contains `NodeID`, `Name`, `Type` (Room, Junction, Stairs, etc.), `Floor`, `X`, `Y`.
*   **Edges:** Contains `StartNodeID`, `EndNodeID`, `Distance`, `EdgeType`.

### 4.3 Admin Map Editor Implementation
The Map Editor was built as a specialized R3F canvas. It features different "Tool Modes" (Add Node, Link Nodes, Draw Path, Select). The "Draw Path" feature allows admins to rapidly click through hallways to spawn junctions and connect them continuously. The editor uses Raycasting to determine exact X/Y coordinates on the 3D floor models.

### 4.4 Optimization Methodology
Initial iterations of the project suffered from severe lag on mobile devices due to the fragmented nature of architectural CAD exports. Using the `@gltf-transform/cli`, over 700 individual meshes per floor were joined into a single mesh. This drastically reduced GPU draw calls and stabilized the mobile framerate. Furthermore, HTML node labels were converted to wrap inside native WebGL `mesh` elements to bypass strict mobile DOM occlusion bugs.

---
*(Page Break)*

## CHAPTER 5: RESULTS AND DISCUSSION

### 5.1 Testing Strategy
Testing focused heavily on cross-device compatibility and mobile network performance. 
*   **Unit Testing:** Verified the graph routing algorithm correctly prioritized elevators over stairs when the "Avoid Stairs" accessibility flag was checked.
*   **Performance Testing:** Tested framerates on low-end Android devices to ensure the WebGL canvas maintained usable performance.
*   **Functional Testing:** Verified that deleting a node or path in the Admin Editor properly updated the database and removed orphan edges from the graph.

### 5.2 Results and Discussion
The implementation successfully provided a smooth, interactive 3D navigation experience. Users were able to load the map via a local hotspot, scan a QR code, and receive an accurate 3D route. The Admin Map Editor proved highly effective, allowing real-time modification of the campus layout without altering code. 

A significant challenge encountered was mobile browser engines hiding HTML overlays (`<Html>`) layered over the WebGL canvas. This was resolved by wrapping the HTML text within a native 3D Sphere geometry, ensuring the markers were bulletproof against CSS/DOM rendering bugs on mobile devices. Furthermore, API error tracking successfully caught and handled graph corruption caused by orphan edges during the administrative editing phase.

---
*(Page Break)*

## CHAPTER 6: CONCLUSION AND FUTURE SCOPE

### 6.1 Conclusion
The MITS Campus Navigation System successfully modernizes campus wayfinding by providing a high-performance, 3D WebGL application accessible entirely via the browser. By combining optimized GLTF models, mathematical graph routing, and a custom-built Admin Map Editor, the system is both highly useful for visitors and easily maintainable by the administration.

### 6.2 Limitations
*   **Offline Capability:** The system currently requires a local or internet connection to fetch graph data and routing logic.
*   **GPS Integration:** Standard GPS is not accurate enough indoors, so the system relies entirely on static QR codes for starting location calibration rather than live blue-dot tracking.

### 6.3 Future Scope
*   **Live Event Routing:** Integrating the map with the college events calendar to automatically route users to seminar halls based on the time of day.
*   **BLE Beacons:** Replacing QR codes with Bluetooth Low Energy (BLE) beacons for true live indoor positioning and real-time step tracking.
*   **Expansion:** Adding 3D models for all other blocks and hostels on the campus.

---
*(Page Break)*

## CHAPTER 7: REFERENCES
1. React Three Fiber Documentation. https://docs.pmnd.rs/react-three-fiber
2. Three.js Documentation. https://threejs.org/
3. GLTF-Transform CLI. https://gltf-transform.dev/
4. MongoDB Documentation. https://www.mongodb.com/docs/
5. Vite Documentation. https://vitejs.dev/

---
*(Page Break)*

## CHAPTER 8: APPENDIX

### 8.1 Screenshots

*(Insert screenshot of the 3D Route Planner Interface here)*
**Fig 8.1: 3D Route Planner Interface**

*(Insert screenshot of the Admin Map Editor here)*
**Fig 8.2: Admin Map Editor**

*(Insert screenshot of Mobile View with Route Active here)*
**Fig 8.3: Mobile Route View**

*(Insert screenshot of QR Code Scanner here)*
**Fig 8.4: QR Code Scanner Interface**

---
