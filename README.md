# Real-Time Chat and Video Calling Application

This project enables real-time communication between users through text messaging and video calling using PHP and WebSockets. The server-side functionality is powered by **Ratchet**, a PHP WebSocket library, and the frontend communicates with the WebSocket server for real-time updates. The app also supports messaging functionality, ensuring efficient communication in a modern application.

## Features

- Real-time messaging using WebSockets
- Video calling integration
- Full-duplex communication for chat and video call features
- Simple architecture and easy setup
- User authentication and message history (with backend integration)

## Prerequisites

Before you start, make sure you have the following installed:

- PHP (>= 7.4)
- Composer (for managing PHP dependencies)
- A web server (Apache or Nginx)
- MySQL or another database (optional for storing messages)

## Steps to Set Up the Application

### Step 1: Install Ratchet via Composer

To get started, you need to install **Ratchet** using Composer. Open your terminal and run the following command in your project directory:

```bash
composer require cboden/ratchet
```
----
start server by this - in php
$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new Chat()
        )
    ),
    8080,
    'YOUR_SERVER_IP'  // Replace with your actual server IP address
);
