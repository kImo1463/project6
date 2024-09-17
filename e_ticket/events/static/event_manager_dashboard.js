document.addEventListener('DOMContentLoaded', function() {
    fetchEvents();
    fetchTickets();
    fetchOrders();

    const eventForm = document.getElementById('event-form');
    const eventDetails = document.getElementById('event-details');
    const ticketForm = document.getElementById('ticket-form');
    const ticketDetails = document.getElementById('ticket-details');
    const orderDetails = document.getElementById('order-details');

    document.getElementById('new-event-btn').addEventListener('click', () => {
        eventForm.reset();
        delete eventForm.dataset.eventId;
        eventForm.classList.toggle('hidden');
    });

    document.getElementById('show-events-btn').addEventListener('click', () => {
        eventDetails.classList.toggle('hidden');
    });

    document.getElementById('new-ticket-btn').addEventListener('click', () => {
        ticketForm.reset();
        delete ticketForm.dataset.ticketId;
        ticketForm.classList.toggle('hidden');
    });

    document.getElementById('show-tickets-btn').addEventListener('click', () => {
        ticketDetails.classList.toggle('hidden');
    });

    document.getElementById('show-orders-btn').addEventListener('click', () => {
        orderDetails.classList.toggle('hidden');
    });

    eventForm.addEventListener('submit', function(e) {
        e.preventDefault();
        createOrUpdateEvent(eventForm);
    });

    ticketForm.addEventListener('submit', function(e) {
        e.preventDefault();
        createOrUpdateTicket(ticketForm);
    });
});

function fetchEvents() {
    axios.get('/events/')
    .then(response => {
        const eventList = document.getElementById('event-list');
        const eventDropdown = document.getElementById('event-id');
        eventList.innerHTML = '';
        eventDropdown.innerHTML = '<option value="" disabled selected>Select Event</option>';
        response.data.forEach(event => {
            const eventItem = document.createElement('li');
            eventItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');

            eventItem.innerHTML = `
                <div>
                    <div class="fw-bold">${event.name}</div>
                    <div>Description: ${event.description}</div>
                    <div>Date: ${new Date(event.date).toLocaleDateString()}</div>
                    <div>Location: ${event.location}</div>
                </div>
            `;
            eventItem.dataset.eventId = event.id;

            const editButton = document.createElement('button');
            editButton.classList.add('btn', 'btn-sm', 'btn-warning', 'me-2');
            editButton.textContent = 'Edit';
            editButton.addEventListener('click', () => editEvent(event));

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('btn', 'btn-sm', 'btn-danger');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => deleteEvent(event.id));

            eventItem.appendChild(editButton);
            eventItem.appendChild(deleteButton);
            eventList.appendChild(eventItem);

            const option = document.createElement('option');
            option.value = event.id;
            option.textContent = event.name;
            eventDropdown.appendChild(option);
        });
    })
    .catch(error => console.error(error));
}

function fetchOrders() {
    axios.get('/orders/')
    .then(response => {
        const orderList = document.getElementById('order-list');
        orderList.innerHTML = '';
        response.data.forEach(order => {
            const orderItem = document.createElement('li');
            orderItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');

            const tickets = order.tickets.map(ticket => ticket.name).join(', ');
            orderItem.innerHTML = `
                <div>
                    <div class="fw-bold">Order #${order.id}</div>
                    <div>User: ${order.user}</div>
                    <div>Event: ${order.event}</div>
                    <div>Total Cost: $${order.total_cost}</div>
                    <div>Tickets: ${tickets}</div>
                    <div>Created At: ${new Date(order.created_at).toLocaleDateString()}</div>
                </div>
            `;
            orderList.appendChild(orderItem);
        });
    })
    .catch(error => console.error('Error fetching orders:', error));
}

function createOrUpdateEvent(eventForm) {
    const eventName = document.getElementById('event-name').value;
    const eventDescription = document.getElementById('event-description').value;
    const eventDate = document.getElementById('event-date').value;
    const eventLocation = document.getElementById('event-location').value;
    const eventId = eventForm.dataset.eventId;

    const eventData = {
        name: eventName,
        description: eventDescription,
        date: eventDate,
        location: eventLocation
    };

    const request = eventId ? axios.put(`/events/${eventId}/`, eventData) : axios.post('/events/', eventData);

    request.then(response => {
        fetchEvents();
        eventForm.reset();
        delete eventForm.dataset.eventId;
        eventForm.classList.add('hidden');
    }).catch(error => {
        console.error('Error saving event:', error);
        alert('Error saving event. Please try again later.');
    });
}

function editEvent(event) {
    const eventForm = document.getElementById('event-form');
    document.getElementById('event-name').value = event.name;
    document.getElementById('event-description').value = event.description;
    const formattedDate = new Date(event.date).toISOString().split('T')[0];
    document.getElementById('event-date').value = formattedDate;
    document.getElementById('event-location').value = event.location;
    eventForm.dataset.eventId = event.id;
    eventForm.classList.remove('hidden');
}

function deleteEvent(eventId) {
    if (confirm('Are you sure you want to delete this event?')) {
        axios.delete(`/events/${eventId}/`)
        .then(response => {
            fetchEvents();
        })
        .catch(error => {
            console.error('Error deleting event:', error);
            alert('Error deleting event. Please try again later.');
        });
    }
}

function fetchTickets() {
    axios.get('/tickets/')
    .then(response => {
        const ticketList = document.getElementById('ticket-list');
        ticketList.innerHTML = '';
        response.data.forEach(ticket => {
            const ticketItem = document.createElement('li');
            ticketItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');

            const price = parseFloat(ticket.price);
            ticketItem.innerHTML = `
                <div>
                    <div class="fw-bold">${ticket.name}</div>
                    <div>Description: ${ticket.description}</div>
                    <div>Price: $${isNaN(price) ? 'N/A' : price.toFixed(2)}</div>
                    <div>Quantity: ${ticket.quantity}</div>
                    <div>Event ID: ${ticket.event_id}</div>
                </div>
            `;
            ticketItem.dataset.ticketId = ticket.id;

            const editButton = document.createElement('button');
            editButton.classList.add('btn', 'btn-sm', 'btn-warning', 'me-2');
            editButton.textContent = 'Edit';
            editButton.addEventListener('click', () => editTicket(ticket));

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('btn', 'btn-sm', 'btn-danger');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => deleteTicket(ticket.id));

            ticketItem.appendChild(editButton);
            ticketItem.appendChild(deleteButton);
            ticketList.appendChild(ticketItem);
        });
    })
    .catch(error => console.error('Error fetching tickets:', error));
}

function createOrUpdateTicket(ticketForm) {
    const ticketName = document.getElementById('ticket-name').value;
    const ticketDescription = document.getElementById('ticket-description').value;
    const ticketPrice = parseFloat(document.getElementById('ticket-price').value);
    const ticketQuantity = parseInt(document.getElementById('ticket-quantity').value);
    const eventId = document.getElementById('event-id').value;
    const ticketId = ticketForm.dataset.ticketId;

    if (!eventId) {
        alert('Please select an event.');
        return;
    }

    const ticketData = {
        name: ticketName,
        description: ticketDescription,
        price: isNaN(ticketPrice) ? 0 : ticketPrice,
        quantity: isNaN(ticketQuantity) ? 0 : ticketQuantity,
        event_id: eventId
    };

    const request = ticketId ? axios.put(`/tickets/${ticketId}/`, ticketData) : axios.post('/tickets/', ticketData);

    request.then(response => {
        fetchTickets();
        ticketForm.reset();
        delete ticketForm.dataset.ticketId;
        ticketForm.classList.add('hidden');
    }).catch(error => {
        console.error('Error saving ticket:', error);
        alert('Error saving ticket. Please try again later.');
    });
}

function editTicket(ticket) {
    const ticketForm = document.getElementById('ticket-form');
    document.getElementById('ticket-name').value = ticket.name;
    document.getElementById('ticket-description').value = ticket.description;
    document.getElementById('ticket-price').value = ticket.price;
    document.getElementById('ticket-quantity').value = ticket.quantity;
    document.getElementById('event-id').value = ticket.event_id;
    ticketForm.dataset.ticketId = ticket.id;
    ticketForm.classList.remove('hidden');
}

function deleteTicket(ticketId) {
    if (confirm('Are you sure you want to delete this ticket?')) {
        axios.delete(`/tickets/${ticketId}/`)
        .then(response => {
            fetchTickets();
        })
        .catch(error => {
            console.error('Error deleting ticket:', error);
            alert('Error deleting ticket. Please try again later.');
        });
    }
}