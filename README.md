<div align="center">

# 🌐 hieraNet

**A Next-Generation Decentralized Healthcare Information Management System built on Web3.**

[![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Web3.js](https://img.shields.io/badge/web3.js-F16822?style=for-the-badge&logo=web3.js&logoColor=white)](https://web3js.readthedocs.io/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![IPFS](https://img.shields.io/badge/IPFS-65C2CB?style=for-the-badge&logo=IPFS&logoColor=white)](https://ipfs.tech/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[Explore the Docs](#) · [Report Bug](#) · [Request Feature](#)

</div>

---

## 🌟 Overview

Welcome to **hieraNet**, a cutting-edge web application designed to revolutionize how medical records and healthcare data are stored, shared, and accessed. By leveraging Blockchain technology (Ethereum/Multichain) and Decentralized Storage (IPFS/Pinata), hieraNet ensures absolute data integrity, privacy, and immutability. 

Say goodbye to fragmented medical histories and single points of failure. hieraNet empowers patients to control their data while granting seamless, verifiable access to doctors and trusted healthcare providers.

## ✨ Key Features

*   **🔐 Immutable Medical Records**: All transactions and access logs are permanently recorded on the blockchain via custom Smart Contracts.
*   **📂 Decentralized Storage**: Electronic Health Records (EHR) and documents are securely encrypted and pinned to IPFS for highly available, distributed storage.
*   **👥 Role-Based Access Control**: Fully fledged hierarchical access patterns customized for Patients, Doctors, and Admin personnel.
*   **⚡ Modern Next.js UI**: Fast, responsive, and intuitive glassmorphic dashboards powered by Tailwind CSS and Shadcn UI.
*   **🛡️ Cryptographic Security**: End-to-end encryption using robust crypto libraries right from the browser interface.

## 🛠️ Architecture Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend UI** | `Next.js`, `React`, `Tailwind CSS` | Handles user interactions, dashboard routing, and client-side encryption. |
| **Backend & ORM** | `Node.js`, `Prisma Client` | Manages relational application state and RESTful API endpoints. |
| **Blockchain** | `Web3.js`, `Smart Contracts` | The trustless trust-layer validating permissions and health signatures. |
| **Storage layer** | `IPFS`, `@pinata/sdk` | Web3-native decentralized file hosting for unstructured health scans. |

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v20+)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
*   Git

### Installation & Run

1. **Clone the repository**
   ```bash
   git clone https://github.com/niroopn2005-art/hieraNet.git
   cd hieraNet
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Set up your `.env` file with your Blockchain node URL, IPFS Pins (Pinata Keys), and Database connection strings.

4. **Initialize Database and Smart Contracts**
   ```bash
   npx prisma generate
   # Deploy necessary contracts before proceeding
   ```

5. **Start the Frontend Application**
   ```bash
   npm run dev
   ```

6. **Experience hieraNet**: Open [http://localhost:3000](http://localhost:3000) in your browser!

## Code Diagnostics & Testing suite
hieraNet comes equipped with extensive script suites to ensure rigorous stability:
*   `npm run test:system`: Execute full end-to-end system connectivity validations.
*   `npm run test:medical`: Execute specific E-Medical storage logic tests.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---
<div align="center">
  <b>Built with passion by <a href="https://github.com/niroopn2005-art">Niroop</a></b>
</div>