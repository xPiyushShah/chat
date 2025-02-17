<?php


use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;

require 'vendor/autoload.php';

class WebRTCSignalingServer implements MessageComponentInterface {

    // Array to store active connections
    protected $clients;

    public function __construct() {
        $this->clients = new \SplObjectStorage;
    }

    public function onOpen(ConnectionInterface $conn) {
        $this->clients->attach($conn);
        echo "New connection for Calling..! ({$conn->resourceId})\n";
    }

    public function onMessage(ConnectionInterface $from, $msg) {
        // Broadcasting the message to all connected clients
        foreach ($this->clients as $client) {
            // Send the message to everyone except the sender
            if ($from !== $client) {
                $client->send($msg);
            }
        }
    }

    public function onClose(ConnectionInterface $conn) {
        $this->clients->detach($conn);
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        $conn->close();
    }
}

// Run WebSocket server
$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new WebRTCSignalingServer()
        )
    ),
    8080
);

$server->run();
