import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import AuthGuard from "@guards/AuthGuard";
import RoleGuard from "@guards/RoleGuard";
import PermissionGuard from "@guards/PermissionGuard";
import AuthLayout from "@layouts/auth-layout/AuthLayout";
import PageLoader from "@components/PageLoader";

const Login = lazy(() => import("@features/auth/pages/Login"));
const NotAuthorized = lazy(() => import("@features/auth/pages/NotAuthorized"));
const PublicRequestWizard = lazy(() =>
  import("@features/public/pages/PublicRequestWizard")
);
const PublicTracking = lazy(() => import("@features/public/pages/PublicTracking"));
const Dashboard = lazy(() => import("@features/dashboard/pages/Dashboard"));
const ServiceRequests = lazy(() =>
  import("@features/service-requests/pages/ServiceRequests")
);
const Inventory = lazy(() => import("@features/inventory/pages/Inventory"));
const MaterialApprovals = lazy(() =>
  import("@features/material-approvals/pages/MaterialApprovals")
);
const Customers = lazy(() => import("@features/customers/pages/Customers"));
const Subscription = lazy(() =>
  import("@features/subscription/pages/Subscription")
);
const Simulator = lazy(() => import("@features/simulator/pages/Simulator"));
const Users = lazy(() => import("@features/users/pages/Users"));
const Profile = lazy(() => import("@features/profile/pages/Profile"));
const Log = lazy(() => import("@features/log/pages/Log"));
const RolesAndPermissions = lazy(() =>
  import("@features/roles-permissions/pages/RolesAndPermissions")
);
const ReleaseNotes = lazy(() =>
  import("@features/releases-notes/pages/ReleaseNotes")
);
const EditReleaseNote = lazy(() =>
  import("@features/releases-notes/pages/EditReleaseNote")
);
const ViewReleaseNote = lazy(() =>
  import("@features/releases-notes/pages/ViewReleaseNote")
);

const suspense = (element) => (
  <Suspense fallback={<PageLoader />}>{element}</Suspense>
);

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
        path: "/not-authorized",
        element: suspense(<NotAuthorized />),
      },
      {
        path: "/",
        element: <RoleGuard allowedRoles={["OWNER", "DISPATCHER"]} />,
        children: [
          {
            path: "/",
            element: <AuthLayout />,
            children: [
              {
                index: true,
                element: (
                  <Navigate
                    to="dashboard"
                    replace
                  />
                ),
              },
              {
                path: "dashboard",
                element: suspense(<Dashboard />),
              },
              {
                path: "service-requests",
                element: suspense(<ServiceRequests />),
              },
              {
                path: "inventory",
                element: suspense(<Inventory />),
              },
              {
                path: "materials-approval",
                element: suspense(<MaterialApprovals />),
              },
              {
                path: "customers",
                element: suspense(<Customers />),
              },
              {
                path: "subscription",
                element: suspense(<Subscription />),
              },
              {
                path: "simulator",
                element: suspense(<Simulator />),
              },
              {
                path: "profile",
                element: suspense(<Profile />),
              },
              {
                path: "users",
                element: (
                  <PermissionGuard permission="view.users.option">
                    {suspense(<Users />)}
                  </PermissionGuard>
                ),
              },
              {
                path: "roles-permissions",
                element: (
                  <PermissionGuard permission="view.roles.option">
                    {suspense(<RolesAndPermissions />)}
                  </PermissionGuard>
                ),
              },
              {
                path: "log",
                element: (
                  <PermissionGuard permission="view.log.option">
                    {suspense(<Log />)}
                  </PermissionGuard>
                ),
              },
              {
                path: "release-notes",
                element: (
                  <PermissionGuard permission="release_notes.general.manage_release_notes">
                    {suspense(<ReleaseNotes />)}
                  </PermissionGuard>
                ),
              },
              {
                path: "release-notes/:id/edit",
                element: (
                  <PermissionGuard permission="release_notes.general.manage_release_notes">
                    {suspense(<EditReleaseNote />)}
                  </PermissionGuard>
                ),
              },
              {
                path: "release-notes/:id/view",
                element: (
                  <PermissionGuard permission="release_notes.general.manage_release_notes">
                    {suspense(<ViewReleaseNote />)}
                  </PermissionGuard>
                ),
              },
            ],
          },
        ],
      },
    ],
  },
];

export default routes;
