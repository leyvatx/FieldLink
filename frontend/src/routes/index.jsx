import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import AuthGuard from "@guards/AuthGuard";
import RoleGuard from "@guards/RoleGuard";
import PermissionGuard from "@guards/PermissionGuard";
import AuthLayout from "@layouts/auth-layout/AuthLayout";
import PageLoader from "@components/PageLoader";
import { useAuth } from "@context/AuthProvider";
import {
  COMPANY_OPERATION_ROLES,
  COMPANY_ROLE,
  TECHNICIAN_ROLE,
  isPlatformAdmin,
} from "@utils/constants/roles";

const Login = lazy(() => import("@features/auth/pages/Login"));
const Register = lazy(() => import("@features/auth/pages/Register"));
const NotAuthorized = lazy(() => import("@features/auth/pages/NotAuthorized"));
const PublicRequestWizard = lazy(() =>
  import("@features/public/pages/PublicRequestWizard")
);
const LandingManager = lazy(() => import("@features/public/pages/LandingManager"));
const PublicTracking = lazy(() => import("@features/public/pages/PublicTracking"));
const Landing = lazy(() => import("@features/public/pages/Landing"));
const TermsOfService = lazy(() =>
  import("@features/public/pages/TermsOfService")
);
const PrivacyPolicy = lazy(() =>
  import("@features/public/pages/PrivacyPolicy")
);
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
const Subscription = lazy(() => import("@features/subscription/pages/Subscription"));
const RolesAndPermissions = lazy(() =>
  import("@features/roles-permissions/pages/RolesAndPermissions")
);
const ReleaseNotes = lazy(() =>
  import("@features/releases-notes/pages/ReleaseNotes")
);
const ViewReleaseNote = lazy(() =>
  import("@features/releases-notes/pages/ViewReleaseNote")
);
const EditReleaseNote = lazy(() =>
  import("@features/releases-notes/pages/EditReleaseNote")
);
const Log = lazy(() => import("@features/log/pages/Log"));
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

  if (isPlatformAdmin(user)) {
    return <Navigate to="/companies" replace />;
  }

  if (user?.role === TECHNICIAN_ROLE) {
    return <Navigate to="/agenda" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

const routes = [
  // ── Public routes (no auth) ──
  {
    path: "/",
    element: suspense(<Landing />),
  },
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
    path: "/solicitud",
    element: suspense(<PublicRequestWizard />),
  },
  {
    path: "/solicitud/:companySlug",
    element: suspense(<PublicRequestWizard />),
  },
  {
    path: "/solicitud/l/:landingSlug",
    element: suspense(<PublicRequestWizard />),
  },
  {
    path: "/solicitud/:companySlug/l/:landingSlug",
    element: suspense(<PublicRequestWizard />),
  },
  {
    path: "/rastreo/:trackingToken",
    element: suspense(<PublicTracking />),
  },
  {
    path: "/terminos",
    element: suspense(<TermsOfService />),
  },
  {
    path: "/privacidad",
    element: suspense(<PrivacyPolicy />),
  },

  // ── Authenticated routes ──
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: "/home",
            element: <HomeRedirect />,
          },
          {
            path: "/profile",
            element: suspense(<Profile />),
          },
          // Platform admin routes
          {
            element: <RoleGuard superuserOnly />,
            children: [
              {
                path: "/companies",
                element: suspense(<Companies />),
              },
              {
                path: "/roles-permissions",
                element: suspense(<RolesAndPermissions />),
              },
              {
                path: "/release-notes",
                element: suspense(<ReleaseNotes />),
              },
              {
                path: "/release-notes/:id/view",
                element: suspense(<ViewReleaseNote />),
              },
              {
                path: "/release-notes/:id/edit",
                element: suspense(<EditReleaseNote />),
              },
              {
                path: "/log",
                element: suspense(<Log />),
              },
            ],
          },
          // Company operation routes
          {
            element: (
              <RoleGuard
                allowedRoles={COMPANY_OPERATION_ROLES}
                allowSuperuser={false}
              />
            ),
            children: [
              {
                path: "/dashboard",
                element: suspense(<Dashboard />),
              },
              {
                path: "/inventory",
                element: suspense(<Inventory />),
              },
              {
                path: "/customers",
                element: suspense(<Customers />),
              },
              {
                path: "/users",
                element: (
                  <PermissionGuard permission="view.users.option">
                    {suspense(<Users />)}
                  </PermissionGuard>
                ),
              },
              {
                path: "/work-orders",
                element: suspense(<WorkOrders />),
              },
              {
                path: "/assignments",
                element: suspense(<Assignments />),
              },
              {
                path: "/service-requests",
                element: suspense(<ServiceRequests />),
              },
              {
                path: "/landings",
                element: suspense(<LandingManager />),
              },
              {
                path: "/materials-approval",
                element: suspense(<MaterialApprovals />),
              },
            ],
          },
          // Company admin only
          {
            element: (
              <RoleGuard
                allowedRoles={[COMPANY_ROLE]}
                allowSuperuser={false}
              />
            ),
            children: [
              {
                path: "/subscription",
                element: suspense(<Subscription />),
              },
            ],
          },
          // Technician only
          {
            element: (
              <RoleGuard
                allowedRoles={[TECHNICIAN_ROLE]}
                allowSuperuser={false}
              />
            ),
            children: [
              {
                path: "/agenda",
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
