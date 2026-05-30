# Intelligent Retail Operations Platform

A modern, enterprise-grade SaaS platform designed for real-time retail operations, inventory management, logistics synchronization, and workforce attendance tracking.

## 🚀 Live Demo

**[Intelligent Retail Operations Platform](https://intelligent-retail-572455089707.us-central1.run.app/login)**

---

## 🏗️ Architecture & Data Flow

The application follows a decoupled client-server architecture, built for scalability and high performance, with a Databricks Lakehouse backend serving as the centralized source of truth.

```mermaid
graph TD
    %% Define Styles
    classDef frontend fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff
    classDef backend fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff
    classDef db fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff
    classDef cloud fill:#6366f1,stroke:#4338ca,stroke-width:2px,color:#fff

    User((User / Device)) -->|HTTPS Requests| CloudRun[Google Cloud Run]
    
    subgraph CloudRun[Google Cloud Run Environment]
        UI[React + Vite Frontend]:::frontend
        API[Express.js Node Backend]:::backend
        
        UI -->|REST API calls| API
    end
    
    API -->|Databricks SQL Driver| Databricks[(Databricks Lakehouse)]:::db

    subgraph Databricks[(Databricks Data Intelligence Platform)]
        DB_Identity[Identity Management Schema]
        DB_Logistics[Logistics OS Schema]
    end
```

---

## 🛠️ Tech Stack & Tools

### Frontend
* **React 19** - Modern component-based UI library
* **Vite** - Lightning-fast frontend build tool
* **Tailwind CSS (v4)** - Utility-first CSS framework for custom, premium styling
* **Zustand** - Lightweight global state management
* **Lucide React** - Clean and consistent iconography
* **Recharts & Leaflet** - Data visualization and geographical mapping

### Backend
* **Node.js (v20)** - High-performance JavaScript runtime
* **Express.js** - Minimal and flexible web application framework
* **Databricks SQL Driver** - Native integration for Databricks SQL warehouses
* **Bcrypt & JSONWebToken** - Secure password hashing and stateless authentication

### Infrastructure & DevOps
* **Google Cloud Run** - Fully managed serverless execution environment
* **Docker** - Multi-stage containerization using Node.js base images for optimized footprints
* **Cloud Run MCP Server** - Context-aware agentic deployments and configuration management
* **Databricks** - Cloud-based data engineering and warehousing

---

## ⚙️ Features

1. **Role-Based Access Control (RBAC):** Secure access tiers for Super Admins, Store Managers, Inventory Handlers, and Delivery Staff.
2. **Real-time Inventory Tracking:** Centralized oversight of stock levels across multiple geographical store locations.
3. **Logistics & Transfer Management:** End-to-end tracking of intra-store stock transfers, complete with mapping.
4. **Workforce Attendance:** Live worker tracking, shift management, and digital clock-in/out integration.
5. **Analytics Dashboards:** High-level executive views aggregating system uptime, workforce metrics, and stock alerts.

---

## 💻 Local Development

### Prerequisites
- Node.js (v20+)
- A Databricks Workspace & SQL Warehouse
- Personal Access Token for Databricks

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Arpit599222/intelligent-retail-ops.git
   cd intelligent-retail-ops
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   DATABRICKS_HOST=your-workspace.cloud.databricks.com
   DATABRICKS_SERVER_HOSTNAME=your-workspace.cloud.databricks.com
   DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/your-warehouse-id
   DATABRICKS_TOKEN=your-personal-access-token
   DATABRICKS_CATALOG=logistics_os
   DATABRICKS_SCHEMA=identity_management
   PORT=8080
   ```

4. **Run the application locally:**
   ```bash
   npm run dev:all
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```
