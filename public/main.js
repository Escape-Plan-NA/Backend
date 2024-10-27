const socket = io();

document.addEventListener('DOMContentLoaded', () => {
    const clientsTotal = document.getElementById('client-total');
  
    // Now you can access the messageContainer element safely
    socket.on('clients-total', (data) => {
        clientsTotal.innerText = `Total Clients: ${data}`;
    });
});

