import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import AuthGuard from "@guards/AuthGuard";
import RoleGuard from "@guards/RoleGuard";
import PermissionGuard from "@guards/PermissionGuard";
import AuthLayout from "@layouts/auth-layout/AuthLayout";
import PageLoader from "@components/PageLoader";
import { useAuth } from "@context/AuthProvider";

const Login = lazy(() => import("@features/auth/pages/Login"));
const Register = lazy(() => import("@features/auth/pages/Register"));
const NotAuthorized = lazy(() => import("@features/auth/pages/NotAuthorized"));
const PublicRequestWizard = lazy(() =>
  import("@features/public/pages/PublicRequestWizard")
);
const PublicTracking = lazy(() => import("@features/public/pages/PublicTracking"));
const Dashboard = lazy(() => import("@features/dashboard/pages/Dashboard"));
const WorkOrders = lazy(() => import("@features/work-orders/pages/WorkOrders"));
const Assignments = lazy(() =>
  import("@features/assignments/pages/Assignments")
);
const ServiceRequests = lazy(() =>
  import("@features/service-requests/pages/ServiceRequests")
);
const Inventory = lazy(() => import("@features/inventory/pages/Inventory"));
const MaterialApprovals = lazy(() =>
  import("@features/material-approvals/pages/MaterialApprovals")
);
const Customers = lazy(() => import("@features/customers/pages/Customers"));
const Users = lazy(() => import("@features/users/pages/Users"));
const Companies = lazy(() => import("@features/companies/pages/Companies"));
const Profile = lazy(() => import("@features/profile/pages/Profile"));
const Agenda = lazy(() => import("@features/technician/pages/Agenda"));

const suspense = (element) => (
  <Suspense fallback={<PageLoader />}>{element}</Suspense>
);

const HomeRedirect = () => {
  const { user, loadingUser } = useAuth();

  if (loadingUser) {
    return <PageLoader />;
  }

  if (user?.is_superuser) {
    return <Navigate to="/companies" replace />;
  }

  if (user?.role === "TECHNICIAN") {
    return <Navigate to="/agenda" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

const routes = [
  {
    path: "/solicitud/:companySlug",
    element: suspense(<PublicRequestWizard />),
  },
  {
    path: "/rastreo/:trackingToken",
    element: suspense(<PublicTracking />),
  },
  {
    path: "/",
    element: <AuthGuard />,
    children: [
      {
        path: "/login",
        element: suspense(<Login />),
      },
      {
        path: "/register",
        element: suspense(<Register />),
      },
      {
        path: "/not-authorized",
        element: suspense(<NotAuthorized />),
      },
      {
        path: "/",
        element: <AuthLayout />,
        children: [
          {
            index: true,
            element: <HomeRedirect />,
          },
          {
            path: "profile",
            element: suspense(<Profile />),
          },
          {
            path: "/",
            element: <RoleGuard superuserOnly />,
            children: [
              {
                path: "companies",
                element: suspense(<Companies />),
              },
            ],
          },
          {
            path: "/",
            element: (
              <RoleGuard
                allowedRoles={["OWNER", "DISPATCHER"]}
                allowSuperuser={false}
              />
            ),
            children: [
              {
                path: "dashboard",
                element: suspense(<Dashboard />),
              },
              {
                path: "inventory",
                element: suspense(<Inventory />),
              },
              {
                path: "customers",
                element: suspense(<Customers />),
              },
              {
                path: "users",
                element: (
                  <PermissionGuard permission="view.users.option">
                    {suspense(<Users />)}
                  </PermissionGuard>
                ),
              },
            ],
          },
          {
            path: "/",
            element: (
              <RoleGuard
                allowedRoles={["DISPATCHER"]}
                allowSuperuser={false}
              />
            ),
            children: [
              {
                path: "work-orders",
                element: suspense(<WorkOrders />),
              },
              {
                path: "assignments",
                element: suspense(<Assignments />),
              },
              {
                path: "service-requests",
                element: suspense(<ServiceRequests />),
              },
              {
                path: "materials-approval",
                element: suspense(<MaterialApprovals />),
              },
            ],
          },
          {
            path: "/",
            element: (
              <RoleGuard
                allowedRoles={["TECHNICIAN"]}
                allowSuperuser={false}
              />
            ),
            children: [
              {
                path: "agenda",
                element: suspense(<Agenda />),
              },
            ],
          },
        ],
      },
    ],
  },
];

export default routes;
