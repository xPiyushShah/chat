This file is for making real-time chat application and communication via calling or video calling using PHP.
step 1 - install  ratchaet via composer.
step 2 - ratchet would be server2.php to launch the server.
step 3 - design your view and use scirpt.js for video calling and msg use your own knowledge and logic to build.
step 4 - this is based on web socket so run - php server2.php to start web scoker server for changing ip on server file  give ypur server ip.
step 5 - do from your own.

+-------------------+      +---------------------------+      +---------------------------+
|                   |      |                           |      |                           |
|   User Frontend   +----->|   WebSocket Server (Ratchet) +----->|   Backend (CI)         |
|                   |      |                           |      |                           |
+-------------------+      +---------------------------+      +---------------------------+
       |                          |                                  |
       |    WebSocket             |    Store Messages in DB          |    Send/Receive Messages
       |    Connects to           |                                  |
       |    WebSocket Server      |                                  |
       |                          |                                  |
       v                          v                                  v
  Send Messages        Real-Time Message Broadcast           Save Messages to DB
                        (check condition to make 
                           sure reciver is well)
