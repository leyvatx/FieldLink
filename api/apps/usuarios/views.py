from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import User, SubscriptionPlan, UserPlan
from .serializers import UserSerializer, UserCreateSerializer, SubscriptionPlanSerializer, UserPlanSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        return queryset

    @action(detail=False, methods=['get'])
    def technicians(self, request):
        technicians = User.objects.filter(role='TECHNICIAN')
        serializer = self.get_serializer(technicians, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def admins(self, request):
        admins = User.objects.filter(role='ADMIN')
        serializer = self.get_serializer(admins, many=True)
        return Response(serializer.data)


class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer


class UserPlanViewSet(viewsets.ModelViewSet):
    queryset = UserPlan.objects.select_related('user', 'plan').all()
    serializer_class = UserPlanSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.query_params.get('user')
        status = self.request.query_params.get('status')
        if user:
            queryset = queryset.filter(user_id=user)
        if status:
            queryset = queryset.filter(status=status)
        return queryset
