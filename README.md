# OctraWallet 🛡️💰

![OctraWallet Banner](/public/images/og-image.png)

**OctraWallet** is a next-generation private blockchain wallet built with **Next.js 15**, focusing on military-grade security and premium "Obsidian Gold" aesthetics. It features advanced privacy tools, client-side encryption, and a seamless user experience.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://octrawallet.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

## 🚀 Live Demo

**[https://octrawallet.vercel.app](https://octrawallet.vercel.app)**

---

## ✨ Key Features

### 🎨 Obsidian Gold UI

- **Premium Aesthetics**: Dark mode optimization with gold accents, glassmorphism, and smooth Framer Motion animations.
- **Responsive Design**: Fully optimized for desktop and mobile interfaces.

### 🔒 Military-Grade Security

- **Secure Session Storage**: Uses AES-GCM session keys to encrypt sensitive data in memory. **Zero plaintext passwords** stored.
- **Virtual Keypad**: Randomized on-screen keypad to protect against hardware/software keyloggers.
- **Privacy Blur**: Automatically blurs sensitive content when the window loses focus or user switches tabs.
- **Paste Guard**: Intercepts clipboard actions to prevent address poisoning attacks.
- **Strict CSP**: Comprehensive Content Security Policy to prevent XSS and injection attacks.

### 🏦 Private Vault

- **Encrypted Balances**: Move funds to a private vault where balances are encrypted on-chain.
- **Dual-Mode**: Seamlessly switch between Public and Private balances.
- **Smart Inputs**: Percentage-based sliders (0-100%) and "Max" buttons for easy fund management.

### ⚡ Advanced Tools

- **Multi-Send**: Batch transactions to multiple recipients in a single action.
- **Contact Management**: Save and manage address books with a premium UI.
- **Transaction History**: Real-time tracking of all incoming and outgoing transfers.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [TailwindCSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Security**: TweetNaCl, Scrypt-js, Web Crypto API

---

## 📦 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/octrawallet.git
   cd octrawallet
   ```

2. **Install Dependencies**

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Run Development Server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

4. **Build for Production**
   ```bash
   npm run build
   ```

---

## 🛡️ Security Audit

This project has undergone a self-audit focusing on:

- XSS Prevention (Strict CSP)
- Dependency Vulnerabilities
- Replay Attack Mitigation
- Secure Key Management

> **Note**: This wallet is designed for the Octra Network testnet/devnet environment.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
