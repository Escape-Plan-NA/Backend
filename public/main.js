const socket = io();

document.addEventListener('DOMContentLoaded', () => {
    const clientsTotal = document.getElementById('client-total');

    const messageContainer = document.getElementById('message-container');
    const nameInput = document.getElementById('name-input');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');    

    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        sendMessage();
    })
  
    // Now you can access the messageContainer element safely
    socket.on('clients-total', (data) => {
        clientsTotal.innerText = `Total Clients: ${data}`;
    });

    function sendMessage() {
        if (messageInput.value === '') return;

        const data = {
            name: nameInput.value,
            message: messageInput.value,
            date: new Date() 
        };
        socket.emit('message', data);
        addMessageToUI(true, data);
        messageInput.value = '';
    }

    socket.on('chat-message', (data) => {
        addMessageToUI(false, data); 
    })

    function addMessageToUI(isOwnMessage, data) {
        const element = `
            <li class="${isOwnMessage ? "message-right" : "message-left"}">
                <p class="message">
                    ${data.message}
                    <span>${data.name} • ${moment(data.date).fromNow()}</span>
                </p>
            </li>
        `;

        messageContainer.innerHTML += element;
        scrollToBottom();
    }

    function scrollToBottom() {
        messageContainer.scrollTo(0, messageContainer.scrollHeight);
    }
});


