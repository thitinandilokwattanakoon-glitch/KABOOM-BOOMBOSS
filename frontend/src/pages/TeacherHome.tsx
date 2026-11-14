import { useState } from 'react';
import { getSavedRoom, saveRoom } from '../api/rooms';
import { useAuth } from '../hooks/useAuth';
import { BossEditor } from './BossEditor';
import { CreateRoomPanel } from './CreateRoomPanel';
import { GameGuide } from './GameGuide';
import { QuestionSetEditor } from './QuestionSetEditor';
import { QuestionSetList } from './QuestionSetList';
import { BrandImage, LogoutIcon } from './student-ui';
import { TeacherReportView, TeacherResultList } from './TeacherResults';
import { TeacherRoom } from './TeacherRoom';
import './teacher-home.css';

/** undefined = showing the list, null = creating a new set, string = editing that set */
type Editing = undefined | null | string;

export function TeacherHome() {
  const { user, logout } = useAuth();
  const [editing, setEditing] = useState<Editing>(undefined);
  const [roomCode, setRoomCode] = useState<string | null>(getSavedRoom);
  const [report, setReport] = useState<string | null>(null);

  function enterRoom(code: string | null) {
    saveRoom(code);
    setRoomCode(code);
  }

  // The game room keeps its own look (the battle screen).
  if (roomCode) {
    return (
      <div className="app">
        <div className="top-nav">
          <div className="brand">Kaboom</div>
          <button type="button" className="back-link" onClick={logout}>
            ออกจากระบบ
          </button>
        </div>
        <TeacherRoom key={roomCode} code={roomCode} onLeave={() => enterRoom(null)} />
      </div>
    );
  }

  return (
    <div className="th-page">
      <header className="th-top">
        <BrandImage
          src="/brand/kaboom-logo.png"
          alt="KABOOM! บูมบอส"
          className="th-logo"
          width={426}
          height={208}
          fallback={<span className="th-logo-text">KABOOM! บูมบอส</span>}
        />
        <div className="th-account">
          <span className="th-role">อาจารย์</span>
          <span className="th-name">{user?.displayName}</span>
          <button type="button" className="th-logout" onClick={logout}>
            <LogoutIcon />
            ออกจากระบบ
          </button>
        </div>
      </header>

      <main className="th-main">
        {report ? (
          <TeacherReportView gameId={report} onBack={() => setReport(null)} />
        ) : editing === undefined ? (
          <>
            <div className="th-hello">
              <h1>สวัสดี {user?.displayName}</h1>
              <p>สร้างชุดคำถามไว้ก่อน แล้วเปิดห้องให้นักเรียนเข้ามาสู้กับบอส · เข้าสู่ระบบด้วย {user?.email}</p>
            </div>
            <div className="th-grid">
              <div className="th-side">
                <CreateRoomPanel onCreated={enterRoom} />
                <GameGuide />
              </div>
              <div className="th-content">
                <QuestionSetList onOpen={setEditing} />
                <TeacherResultList onOpen={setReport} />
              </div>
            </div>
            {user && <BossEditor teacherId={user.id} name={user.displayName} />}
          </>
        ) : (
          // key makes React start a fresh editor whenever a different set is opened
          <div className="th-editor">
            <QuestionSetEditor key={editing ?? 'new'} setId={editing} onClose={() => setEditing(undefined)} />
          </div>
        )}
      </main>
    </div>
  );
}
