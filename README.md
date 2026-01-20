# Doodle Chat — Frontend

A simple chat interface built with **React** and **TypeScript**, created as part of the **Doodle Frontend Engineer** take-home challenge.

The application consumes a provided backend API to retrieve and send chat messages, with a focus on **clean architecture**, **accessibility**, **responsiveness**, and **reviewable code**.

---

## 📌 Overview

This project implements the frontend of a chat application that:

- Fetches and displays messages from multiple senders
- Sends new messages to the backend API
- Presents a responsive, accessible UI inspired by the provided mockups

The goal is not pixel-perfect design, but a well-structured, maintainable, and user-friendly implementation.

---

## 🛠 Tech Stack

- **React**
- **TypeScript**
- **CSS Modules**
- Native browser APIs (no heavy UI or state frameworks)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (LTS recommended)
- The **Doodle Chat API** running locally  
  (see the backend repository instructions)

### Configuration

For this challenge, API configuration is defined in `src/config/env.ts` with sensible defaults for local development. The configuration includes the API base URL and authentication token, and can be overridden via environment variables if needed.
