import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import AuthGuard from "@guards/AuthGuard";
import PermissionGuard from "@guards/PermissionGuard";
import AuthLayout from "@layouts/auth-layout/AuthLayout";
import PageLoader from "@components/PageLoader";

const Login = lazy(() => import("@features/auth/pages/Login"));
const Dashboard = lazy(() => import("@features/dashboard/pages/Dashboard"));
const Users = lazy(() => import("@features/users/pages/Users"));
const Profile = lazy(() => import("@features/profile/pages/Profile"));

const suspense = (element) => (
  <Suspense fallback={<PageLoader />}>{element}</Suspense>
);

const routes = [
  {
    path: "/",
    element: <AuthGuard />,
    children: [
      {
        path: "/login",
        element: suspense(<Login />),
      },
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
        ],
      },
    ],
  },
];

export default routes;
