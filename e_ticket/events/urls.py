from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('register/', views.register, name='register'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    path('dashboard/', views.user_dashboard, name='user_dashboard'),
    path('event-manager-dashboard/', views.event_manager_dashboard, name='event_manager_dashboard'),
    path('events/', views.event_detail, name='event_list'),
    path('events/<int:event_id>/', views.event_detail, name='event_detail'),
    path('tickets/', views.ticket_detail, name='ticket_list'),
    path('tickets/<int:ticket_id>/', views.ticket_detail, name='ticket_detail'),
    path('orders/', views.order_detail, name='order_list'),
    path('orders/<int:order_id>/', views.order_detail, name='order_detail'),
]