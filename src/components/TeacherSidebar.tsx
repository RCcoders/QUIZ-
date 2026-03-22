import { NavLink } from 'react-router-dom';
import {
  Play,
  LayoutDashboard,
  BookOpen,
  BarChart2,
  Library,
  LogOut,
  Zap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/teacher' },
  { icon: BookOpen, label: 'My Quizzes', path: '/teacher/my-quizzes' },
  { icon: BarChart2, label: 'Reports', path: '/teacher/reports' },
  { icon: Library, label: 'Library', path: '/teacher/library' },
];

export function TeacherSidebar() {
  const { signOut } = useAuth();

  return (
    <aside style={{
      width: '240px',
      height: '100vh',
      background: '#FFFFFF',
      borderRight: '1px solid #E5E7EB',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'fixed',
      top: 0,
      left: 0,
      overflowY: 'auto',
      zIndex: 100,
    }}>
      {/* Logo row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '24px 20px 20px',
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          background: '#FF5C1A',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          flexShrink: 0,
        }}>
          <Play fill="currentColor" size={18} />
        </div>
        <span style={{ fontWeight: 700, fontSize: '17px', color: '#111827' }}>QuizMaster</span>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.path === '/teacher'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              position: 'relative',
              background: isActive ? '#FFF3EE' : 'transparent',
              color: isActive ? '#FF5C1A' : '#374151',
              transition: 'background 0.15s, color 0.15s',
            })}
          >
            {({ isActive }) => (
              <>
                {/* Active indicator bar */}
                {isActive && (
                  <span style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: '60%',
                    background: '#FF5C1A',
                    borderRadius: '0 3px 3px 0',
                  }} />
                )}
                <item.icon size={18} color={isActive ? '#FF5C1A' : '#6B7280'} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Pro Tip card */}
      <div style={{ padding: '0 12px 12px' }}>
        <div style={{
          background: '#FFF3EE',
          borderRadius: '10px',
          padding: '14px',
          marginBottom: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Zap size={14} color="#FF5C1A" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#FF5C1A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pro Tip</span>
          </div>
          <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '10px', lineHeight: 1.5 }}>
            Unlock AI quiz generation, advanced analytics, and unlimited students.
          </p>
          <button style={{
            width: '100%',
            padding: '7px 0',
            background: 'transparent',
            border: '1.5px solid #FF5C1A',
            borderRadius: '6px',
            color: '#FF5C1A',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}>
            Upgrade to Pro
          </button>
        </div>

        {/* Sign Out */}
        <button
          onClick={() => signOut()}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            background: 'transparent',
            border: 'none',
            borderRadius: '8px',
            color: '#6B7280',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = '#FEE2E2';
            (e.currentTarget as HTMLButtonElement).style.color = '#EF4444';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = '#6B7280';
          }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
