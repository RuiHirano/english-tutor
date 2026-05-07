import { createHashRouter, RouterProvider } from 'react-router-dom';
import { AppShell } from '@/components/shared/AppShell';
import { Home } from '@/pages/Home';
import { MaterialList } from '@/pages/MaterialList';
import { MaterialDetail } from '@/pages/MaterialDetail';
import { ProfileSetup } from '@/pages/ProfileSetup';
import { Study } from '@/pages/Study';
import { VocabList } from '@/pages/VocabList';
import { LevelTest } from '@/features/level-test/LevelTest';

const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Home /> },
      { path: 'study', element: <Study /> },
      { path: 'materials', element: <MaterialList /> },
      { path: 'materials/:id', element: <MaterialDetail /> },
      { path: 'vocab', element: <VocabList /> },
      { path: 'level-test', element: <LevelTest /> },
      { path: 'profile', element: <ProfileSetup /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
