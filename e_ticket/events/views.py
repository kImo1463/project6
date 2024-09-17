from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import User, Event, Ticket, Order
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from .models import User
from django.contrib import messages
from django.urls import reverse
from django.shortcuts import HttpResponse, HttpResponseRedirect, render
from django.views.decorators.http import require_http_methods
import json


def index(request):
    # Authenticated users view their dashboard
    if request.user.is_authenticated:
        if request.user.is_event_manager:
            return render(request, 'events/event_manager_dashboard.html')
        else:
            return render(request, 'events/user_dashboard.html')
    
    # Everyone else is prompted to register or login
    else:
       #return redirect(reverse('login'))
       return render(request, 'events/login.html')



@csrf_exempt
def register(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        is_event_manager = request.POST.get('is_event_manager') == 'on'

        if User.objects.filter(username=username).exists():
            messages.error(request, 'Username already exists')
            return redirect('register')

        user = User.objects.create_user(
            username=username,
            password=password,
            is_event_manager=is_event_manager
        )
        messages.success(request, 'User registered successfully')
        return redirect('login')

    return render(request, 'events/register.html')

@csrf_exempt
def user_login(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return redirect('index')
        else:
            messages.error(request, 'Invalid username or password')
            return redirect('login')

    return render(request, 'events/login.html')
 
def user_logout(request):
    logout(request)
    return redirect('login')

@login_required
def user_dashboard(request):
    events = Event.objects.all()
    return render(request, 'events/user_dashboard.html', {'events': events})

@login_required
def event_manager_dashboard(request):
    events = Event.objects.all()
    tickets = Ticket.objects.all()
    orders = Order.objects.all()
    return render(request, 'events/event_manager_dashboard.html', {
        'events': events, 'tickets': tickets, 'orders': orders
    })

@csrf_exempt
@require_http_methods(["GET", "POST", "PUT", "DELETE"])
def event_detail(request, event_id=None):
    if request.method == 'GET':
        if event_id:
            try:
                event = Event.objects.get(id=event_id)
                return JsonResponse({
                    'id': event.id,
                    'name': event.name,
                    'description': event.description,
                    'date': event.date.isoformat(),
                    'location': event.location
                })
            except Event.DoesNotExist:
                return JsonResponse({'error': 'Event not found'}, status=404)
        else:
            events = Event.objects.all()
            events_list = list(events.values('id', 'name', 'description', 'date', 'location'))
            return JsonResponse(events_list, safe=False)

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            event = Event.objects.create(
                name=data['name'],
                description=data['description'],
                date=data['date'],
                location=data['location']
            )
            return JsonResponse({'id': event.id, 'name': event.name}, status=201)
        except KeyError:
            return HttpResponseBadRequest('Missing fields')

    elif request.method == 'PUT' and event_id:
        try:
            data = json.loads(request.body)
            event = Event.objects.get(id=event_id)
            event.name = data.get('name', event.name)
            event.description = data.get('description', event.description)
            event.date = data.get('date', event.date)
            event.location = data.get('location', event.location)
            event.save()
            return JsonResponse({'id': event.id, 'name': event.name}, status=200)
        except Event.DoesNotExist:
            return JsonResponse({'error': 'Event not found'}, status=404)

    elif request.method == 'DELETE' and event_id:
        try:
            event = Event.objects.get(id=event_id)
            event.delete()
            return JsonResponse({'message': 'Event deleted'}, status=204)
        except Event.DoesNotExist:
            return JsonResponse({'error': 'Event not found'}, status=404)

    return HttpResponseBadRequest('Invalid HTTP method')

@csrf_exempt
@require_http_methods(["GET", "POST", "PUT", "DELETE"])
def ticket_detail(request, ticket_id=None):
    if request.method == 'GET':
        if ticket_id:
            try:
                ticket = Ticket.objects.get(id=ticket_id)
                return JsonResponse({
                    'id': ticket.id,
                    'name': ticket.name,
                    'description': ticket.description,
                    'price': str(ticket.price),
                    'quantity': ticket.quantity,
                    'event_id': ticket.event.id
                })
            except Ticket.DoesNotExist:
                return JsonResponse({'error': 'Ticket not found'}, status=404)
        else:
            tickets = Ticket.objects.all()
            tickets_list = list(tickets.values('id', 'name', 'description', 'price', 'quantity', 'event_id'))
            return JsonResponse(tickets_list, safe=False)

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            event = Event.objects.get(id=data['event_id'])
            ticket = Ticket.objects.create(
                event=event,
                name=data['name'],
                description=data.get('description', ''),
                price=data['price'],
                quantity=data['quantity']
            )
            return JsonResponse({'id': ticket.id, 'name': ticket.name}, status=201)
        except (KeyError, Event.DoesNotExist):
            return HttpResponseBadRequest('Invalid data or missing fields')

    elif request.method == 'PUT' and ticket_id:
        try:
            data = json.loads(request.body)
            ticket = Ticket.objects.get(id=ticket_id)
            ticket.quantity = data.get('quantity', ticket.quantity)
            ticket.save()
            return JsonResponse({'id': ticket.id, 'name': ticket.name}, status=200)
        except Ticket.DoesNotExist:
            return JsonResponse({'error': 'Ticket not found'}, status=404)

    elif request.method == 'DELETE' and ticket_id:
        try:
            ticket = Ticket.objects.get(id=ticket_id)
            ticket.delete()
            return JsonResponse({'message': 'Ticket deleted'}, status=204)
        except Ticket.DoesNotExist:
            return JsonResponse({'error': 'Ticket not found'}, status=404)

    return HttpResponseBadRequest('Invalid HTTP method')

@csrf_exempt
@require_http_methods(["GET", "POST"])
def order_detail(request, order_id=None):
    if request.method == 'GET':
        if order_id:
            try:
                order = Order.objects.get(id=order_id)
                tickets = order.tickets.all()
                tickets_list = list(tickets.values('id', 'name', 'price'))
                return JsonResponse({
                    'id': order.id,
                    'user': order.user.username,
                    'event': order.event.name,
                    'total_cost': str(order.total_cost),
                    'tickets': tickets_list,
                    'created_at': order.created_at.isoformat()
                })
            except Order.DoesNotExist:
                return JsonResponse({'error': 'Order not found'}, status=404)
        else:
            orders = Order.objects.all()
            orders_list = []
            for order in orders:
                tickets = order.tickets.all()
                tickets_list = list(tickets.values('id', 'name', 'price'))
                orders_list.append({
                    'id': order.id,
                    'user': order.user.username,
                    'event': order.event.name,
                    'total_cost': str(order.total_cost),
                    'tickets': tickets_list,
                    'created_at': order.created_at.isoformat()
                })
            return JsonResponse(orders_list, safe=False)

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            user = User.objects.get(id=data['user_id'])
            event = Event.objects.get(id=data['event_id'])
            tickets = Ticket.objects.filter(id__in=data['ticket_ids'])
            total_cost = sum(ticket.price for ticket in tickets)

            order = Order.objects.create(
                user=user,
                event=event,
                total_cost=total_cost
            )
            order.tickets.set(tickets)
            order.save()

            return JsonResponse({
                'id': order.id,
                'user': order.user.username,
                'event': order.event.name,
                'total_cost': str(order.total_cost),
                'created_at': order.created_at.isoformat()
            }, status=201)
        except (KeyError, User.DoesNotExist, Event.DoesNotExist, Ticket.DoesNotExist):
            return HttpResponseBadRequest('Invalid data or missing fields')

    return HttpResponseBadRequest('Invalid HTTP method')

