
# Register your models here.
from django.contrib import admin
from .models import User, Event, Ticket, Order

class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'is_event_manager', 'email')
    search_fields = ('username', 'email')

class EventAdmin(admin.ModelAdmin):
    list_display = ('name', 'date', 'location')
    search_fields = ('name', 'location')
    list_filter = ('date',)

class TicketAdmin(admin.ModelAdmin):
    list_display = ('name', 'event', 'price', 'quantity')
    search_fields = ('name', 'event__name')
    list_filter = ('event',)

class OrderAdmin(admin.ModelAdmin):
    list_display = ('user', 'event', 'total_cost', 'created_at')
    search_fields = ('user__username', 'event__name')
    list_filter = ('created_at',)

admin.site.register(User, UserAdmin)
admin.site.register(Event, EventAdmin)
admin.site.register(Ticket, TicketAdmin)
admin.site.register(Order, OrderAdmin)