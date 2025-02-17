
        function timeSince(date) {
            const now = new Date();
            const seconds = Math.floor((now - date) / 1000);
            let interval = seconds / 31536000;

            if (interval > 1) {
                return Math.floor(interval) + " year" + (Math.floor(interval) > 1 ? "s" : "") + " ago";
            }
            interval = seconds / 2592000;
            if (interval > 1) {
                return Math.floor(interval) + " month" + (Math.floor(interval) > 1 ? "s" : "") + " ago";
            }
            interval = seconds / 86400;
            if (interval > 1) {
                return Math.floor(interval) + " day" + (Math.floor(interval) > 1 ? "s" : "") + " ago";
            }
            interval = seconds / 3600;
            if (interval > 1) {
                return Math.floor(interval) + " hour" + (Math.floor(interval) > 1 ? "s" : "") + " ago";
            }
            interval = seconds / 60;
            if (interval > 1) {
                return Math.floor(interval) + " minute" + (Math.floor(interval) > 1 ? "s" : "") + " ago";
            }
            return Math.floor(seconds) + " second" + (Math.floor(seconds) > 1 ? "s" : "") + " ago";
        }

        function updateTimes() {
            const messageElements = document.querySelectorAll('.message');
            messageElements.forEach((msg) => {
                const timeElement = msg.querySelector('.time');
                const messageTime = parseInt(msg.getAttribute('data-time'), 10);
                const timeAgo = timeSince(new Date(messageTime));
                timeElement.textContent = timeAgo;
            });
        }
        setInterval(updateTimes, 60000);

        const conn = new WebSocket('ws://localhost:8080');

        conn.onopen = () => {
            console.log('Connected to WebSocket server');
            const sender_id = <?= $this->id ?>;
            conn.send(JSON.stringify({ type: 'handshake', userId: sender_id }));
        };

        conn.onmessage = (e) => {
            const messageData = JSON.parse(e.data);
            let messageHTML = '';

            if (messageData.type === 'image') {
                messageHTML = `
            <div class="message rec" data-time="${messageData.time}">
                <div class="text">
                    <img src="${messageData.message}" alt="image" class="chat-image">
                    <span>${timeSince(messageData.time)}</span>
                </div>
            </div>`;
            } else if (messageData.type === 'msg') {
                const gettime = timeSince(messageData.time);
                messageHTML = `
            <div class="message rec" data-time="${messageData.time}">
                <div class="text">
                    <p>${messageData.message}</p>
                    <span>${gettime}</span>
                </div>
            </div>`;
            } else if (messageData.type === 'handshake') {
                // Handle handshake (if needed)
            }

            document.getElementById('messageBox').innerHTML += messageHTML;
            scrollToBottom();
            updateTimes();
        };

        function sendmsg(receiver_id) {
            const sender_id = <?= $this->id ?>;
            const message = $('#messageInput').val().trim();
            const currentTime = new Date().getTime();

            if (message === '') {
                alert('Please enter a message.');
                return;
            }
            const messageData = {
                sender: sender_id,
                receiver_id: receiver_id,
                message: message,
                type: 'msg',
                time: currentTime,
            };
            conn.send(JSON.stringify(messageData));
            $.ajax({
                type: 'POST',
                url: '<?= base_url('/sendMessage') ?>',
                data: {
                    receiver_id: receiver_id,
                    msg: message,
                },
                dataType: 'json',
                success: function (res) {
                    console.log("Message saved", res);
                },
                error: function (err) {
                    console.error("Error saving message", err);
                }
            });

            $('#messageInput').val('');
            const timeAgo = timeSince(currentTime);
            const messageHTML = `
        <div class="message own" data-time="${currentTime}">
            <div class="text">
                <p>${message}</p>
                <span class="time">${timeAgo}</span>
            </div>
        </div>`;

            document.getElementById('messageBox').innerHTML += messageHTML;
            scrollToBottom();
        }

        $('.file-btn').on('click', function () {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.click();

            fileInput.addEventListener('change', function (event) {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onloadend = function () {
                        const base64Image = reader.result;
                        const sender_id = <?= $this->id ?>;
                        const receiver_id = receiver_id;
                        const currentTime = new Date().getTime();

                        const messageData = {
                            sender: sender_id,
                            receiver_id: receiver_id,
                            message: base64Image,
                            type: 'image',
                            time: currentTime,
                        };
                        conn.send(JSON.stringify(messageData));

                        const messageHTML = `
                    <div class="message own" data-time="${currentTime}">
                        <div class="text">
                            <img src="${base64Image}" alt="image" class="chat-image">
                            <span>${timeSince(currentTime)}</span>
                        </div>
                    </div>`;

                        document.getElementById('messageBox').innerHTML += messageHTML;
                        scrollToBottom();
                    };
                    reader.readAsDataURL(file);
                }
            });
        });
