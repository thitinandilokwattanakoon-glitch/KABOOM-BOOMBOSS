import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LoginPage, clearResetLink, readResetLink } from './pages/LoginPage';
import { StudentHome } from './pages/StudentHome';
import { TeacherHome } from './pages/TeacherHome';

function Gate() {
  const { state, role, logout } = useAuth();
  // Opened from a "set a new password" e-mail: show that form first, even if this browser is logged in.
  const [reset, setReset] = useState(readResetLink);

  if (state === 'loading') {
    return (
      <div className="app">
        <div className="spinner" role="status" aria-label="กำลังโหลด" />
      </div>
    );
  }

  if (reset) {
    return (
      <LoginPage
        reset={reset}
        onResetDone={() => {
          clearResetLink();
          setReset(null);
          // The new password logs the account out everywhere, so drop this browser's old login too.
          if (state === 'in') void logout();
        }}
        onResetCancel={() => {
          clearResetLink();
          setReset(null);
        }}
      />
    );
  }

  if (state === 'in') return role === 'student' ? <StudentHome /> : <TeacherHome />;
  return <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
