document.addEventListener('DOMContentLoaded', function() {
    fetchEvents();

    const closeButton = document.querySelector('.close-button');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            const ticketsForm = document.getElementById('tickets-form');
            ticketsForm.style.display = 'none';
        });
    }
});

function fetchEvents() {
    fetch('/events/')
        .then(response => response.json())
        .then(events => {
            const eventsContainer = document.getElementById('events-container');
            eventsContainer.innerHTML = ''; // Clear existing events
            events.forEach(event => {
                const eventElement = createEventElement(event);
                eventsContainer.appendChild(eventElement);
            });
        })
        .catch(error => console.error('Error fetching events:', error));
}

function createEventElement(event) {
    const eventElement = document.createElement('div');
    eventElement.className = 'event';
    eventElement.setAttribute('data-event-id', event.id);
    eventElement.innerHTML = `
        <h3>${event.name}</h3>
        <p>${event.description}</p>
        <p>Date: ${new Date(event.date).toLocaleString()}</p>
        <p>Location: ${event.location}</p>
        <button onclick="showTickets(${event.id})">View Tickets</button>
    `;
    return eventElement;
}

function showTickets(eventId) {
    fetch(`/tickets/?event_id=${eventId}`)
      .then(response => response.json())
      .then(tickets => {
        const eventElement = document.querySelector(`.event[data-event-id="${eventId}"]`);
        const ticketsForm = document.getElementById('tickets-form');
        const ticketsContainer = document.getElementById('tickets-container');
        const eventNameElement = document.getElementById('event-name');
  
        fetch(`/events/${eventId}/`)
          .then(response => response.json())
          .then(event => {
            eventNameElement.textContent = event.name;
          });
  
        ticketsContainer.innerHTML = '';
  
        tickets.forEach(ticket => {
          const ticketElement = createTicketElement(ticket, eventId);
          ticketsContainer.appendChild(ticketElement);
        });
  
        if (eventElement) {
          eventElement.after(ticketsForm);
        }
  
        ticketsForm.style.display = 'block';
      })
      .catch(error => console.error('Error fetching tickets:', error));
  }

function createTicketElement(ticket, eventId) {
    const ticketElement = document.createElement('div');
    ticketElement.className = 'ticket';
    ticketElement.innerHTML = `
        <h4>${ticket.name}</h4>
        <p>${ticket.description}</p>
        <p>Price: $${ticket.price}</p>
        <p>Quantity Available: ${ticket.quantity}</p>
        <button onclick="addToCart(${ticket.id}, ${eventId})">Add to Cart</button>
    `;
    return ticketElement;
}

function addToCart(ticketId, eventId) {
    updateCart(ticketId, true);
    console.log('Added ticket with ID', ticketId, 'to the cart.');

    updateTicketQuantity(ticketId, -1)
        .then(() => {
            updateOrderSummary(eventId);
        })
        .catch(error => console.error('Error updating ticket quantity:', error));
}

function removeFromCart(ticketId, eventId) {
    updateCart(ticketId, false);

    updateTicketQuantity(ticketId, 1)
        .then(() => {
            updateOrderSummary(eventId);
        })
        .catch(error => console.error('Error updating ticket quantity:', error));
}

function updateCart(ticketId, add) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (add) {
        cart.push(ticketId);
    } else {
        cart = cart.filter(id => id !== ticketId);
    }
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateTicketQuantity(ticketId, quantityChange) {
    return fetch(`/tickets/${ticketId}/`)
        .then(response => response.json())
        .then(ticket => {
            const newQuantity = ticket.quantity + quantityChange;
            if (newQuantity >= 0) {
                return fetch(`/tickets/${ticketId}/`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ quantity: newQuantity })
                });
            } else {
                throw new Error('No tickets available');
            }
        });
}

function updateOrderSummary(eventId) {
    const orderSummaryContainer = document.getElementById('order-summary-container');
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    let totalCost = 0;

    orderSummaryContainer.innerHTML = '';
    const promises = cart.map(ticketId => {
        return fetch(`/tickets/${ticketId}/`)
            .then(response => response.json())
            .then(ticket => {
                const orderItemElement = createOrderItemElement(ticket, eventId);
                orderSummaryContainer.appendChild(orderItemElement);
                totalCost += ticket.price;
            });
    });

    Promise.all(promises).then(() => {
        if (cart.length > 0) {
            const orderTotalElement = createOrderTotalElement(totalCost, eventId);
            orderSummaryContainer.appendChild(orderTotalElement);
        }
    });
}

function createOrderTotalElement(totalCost, eventId) {
    console.log('Total cost:', totalCost); // Debugging line
    return createElement('div', 'order-total', `
        <h4>Total: $${parseFloat(totalCost).toFixed(2)}</h4>
        <button onclick="approveOrder(${eventId})">Approve Order</button>
        <button onclick="declineOrder(${eventId})">Decline Order</button>
    `);
}

function createOrderItemElement(ticket, eventId) {
    return createElement('div', 'order-item', `
        <h4>${ticket.name}</h4>
        <p>Price: $${ticket.price}</p>
        <button onclick="removeFromCart(${ticket.id}, ${eventId})">Remove from Cart</button>
    `);
}

function approveOrder(eventId) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length > 0) {
        calculateTotalCost(cart).then(totalCost => {
            fetch('/orders/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId, // Assuming you have the user ID available
                    event_id: eventId,
                    ticket_ids: cart,
                    total_cost: totalCost
                })
            })
            .then(response => response.json())
            .then(order => {
                console.log('Order created:', order);
                localStorage.removeItem('cart');
                updateOrderSummary(eventId);
                alert('Order approved successfully!');
            })
            .catch(error => console.error('Error creating order:', error));
        });
    } else {
        alert('Cart is empty. Please add tickets to the cart before approving the order.');
    }
}

function declineOrder(eventId) {
    localStorage.removeItem('cart');
    updateOrderSummary(eventId);
    alert('Order declined. Cart cleared.');
}

async function calculateTotalCost(cart) {
    let totalCost = 0;
    const promises = cart.map(ticketId => {
        return fetch(`/tickets/${ticketId}/`)
            .then(response => response.json())
            .then(ticket => {
                totalCost += ticket.price;
            });
    });
    await Promise.all(promises);
    return totalCost;
}

function createElement(tag, className, innerHTML) {
    const element = document.createElement(tag);
    element.className = className;
    element.innerHTML = innerHTML;
    return element;
}