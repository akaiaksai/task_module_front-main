// routes.tsx
import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PrivateRoute } from './security/PrivateRoute';
import Login from './security/Login';

const Tasks = lazy(() => import('./screens/tasks/TasksList'));
const ProjectsList = lazy(() => import('./screens/projects/ProjectsList'));
const Groups = lazy(() => import('./screens/groups/GroupsList'));
const TaskView = lazy(() => import('./screens/tasks/TaskView'));
const NotFound = lazy(() => import('./screens/NotFound'));

const routes: RouteObject[] = [
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <PrivateRoute />,
    children: [
      { index: true, element: <Tasks /> },
      { path: 'tasks/:id', element: <TaskView /> },
    ],
  },
  {
    path: '/groups/:projectId',
    element: <PrivateRoute />,
    children: [{ index: true, element: <Groups /> }],
  },
  {
    path: '/projects',
    element: <PrivateRoute />,
    children: [{ index: true, element: <ProjectsList /> }],
  },
  { path: '*', element: <NotFound /> },
];

export default routes;
