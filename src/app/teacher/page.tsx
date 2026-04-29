"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TEACHER_EMAILS = ['soniasethi66@hotmail.com', 'buttabomma67@outlook.com'];

export default function Teacher() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<Record<string, string>>({});

  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true" || 
      (!localStorage.getItem("darkMode") && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add("dark");

    fetch("/api/auth/me")
      .then(res => res.json())
      .then(userData => {
        if (userData.error) {
          router.push('/auth/signin');
          return;
        }
        setUser(userData);
        if (!TEACHER_EMAILS.includes(userData.email)) {
          router.push('/dashboard');
          return;
        }
        fetch("/api/submissions")
          .then(res => res.json())
          .then(data => setSubmissions(Array.isArray(data) ? data : []));
        fetch("/api/cases")
          .then(res => res.json())
          .then(data => Array.isArray(data) && setCases(data));
      });
  }, [router]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem("darkMode", String(!darkMode));
    document.documentElement.classList.toggle("dark");
  };

  const handleSignOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push('/auth/signin');
  };

  const loadComments = (submissionId: string) => {
    fetch(`/api/teacher-comments?submission_id=${submissionId}`)
      .then(res => res.json())
      .then(data => {
        setComments(prev => ({ ...prev, [submissionId]: Array.isArray(data) ? data : [] }));
      });
  };

  const submitComment = async (submissionId: string) => {
    const comment = newComment[submissionId];
    if (!comment?.trim()) {
      setCommentError(prev => ({ ...prev, [submissionId]: 'Comment cannot be empty' }));
      return;
    }
    
    console.log('Submitting for:', submissionId, comment);
    
    const res = await fetch("/api/teacher-comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submission_id: submissionId, comment }),
    });
    
    console.log('Response:', res.status, res.ok);
    
    if (res.ok) {
      setNewComment(prev => ({ ...prev, [submissionId]: '' }));
      setCommentError(prev => ({ ...prev, [submissionId]: '' }));
      // Add to local state immediately with teacher name
      setComments(prev => ({
        ...prev,
        [submissionId]: [...(prev[submissionId] || []), { 
          id: 'new-' + Date.now(), 
          comment, 
          teacher_name: 'Teacher',
          created_at: new Date().toISOString() 
        }]
      }));
      // Also reload from server
      loadComments(submissionId);
    } else {
      const data = await res.json();
      console.log('Error response:', data);
      setCommentError(prev => ({ ...prev, [submissionId]: data.error || 'Failed to add comment' }));
    }
  };

  const deleteComment = async (commentId: string, submissionId: string) => {
    await fetch(`/api/teacher-comments?comment_id=${commentId}`, { method: 'DELETE' });
    loadComments(submissionId);
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 header-accent">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Teacher Dashboard</h1>
        <div className="flex items-center gap-4">
          <button onClick={toggleDarkMode} className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">🌙</button>
          <button onClick={() => router.push('/teacher/create')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            Create Case
          </button>
          <button onClick={handleSignOut} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 dark:text-white rounded-lg">
            Sign Out
          </button>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto py-8 px-6">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-6">Cases</h2>
        {cases.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400 mb-8">No cases yet!</p>
        ) : (
          <div className="grid gap-4 mb-8">
            {cases.map((c: any) => (
              <button key={c.id} onClick={() => router.push(`/teacher/cases/${c.id}`)}
                className="flex items-center justify-between p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 text-left">
                <span className="text-lg font-medium text-zinc-900 dark:text-white">{c.title}</span>
                <span className="text-zinc-500">→</span>
              </button>
            ))}
          </div>
        )}

        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-6">Student Submissions</h2>
        {submissions.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">No submissions yet.</p>
        ) : (
          <div className="space-y-6">
            {(() => {
              const grouped = submissions.reduce((acc: Record<string, any>, s: any) => {
                const key = `${s.student_email || s.user_email || 'unknown'}-${s.case_id}`;
                if (!acc[key]) {
                  acc[key] = { email: s.student_email || s.user_email || 'unknown', case_title: s.case_title || 'Unknown', case_id: s.case_id, submissions: [], created_at: s.created_at };
                }
                acc[key].submissions.push(s);
                return acc;
              }, {});
              
              return Object.values(grouped).map((g: any) => (
                <div key={`${g.email}-${g.case_id}`} className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-zinc-900 dark:text-white">{g.email}</h3>
                      <p className="text-sm text-zinc-500">{g.case_title}</p>
                    </div>
                    <span className="text-xs text-zinc-400">{new Date(g.created_at).toLocaleString()}</span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {(() => {
                      const hintCounts: Record<number, any> = {};
                      g.submissions.forEach((sub: any) => {
                        hintCounts[sub.submitted_after_hint] = sub;
                      });
                      const maxHint = Math.max(...Object.keys(hintCounts).map(Number), 2);
                      return [...Array(maxHint)].map((_, i) => {
                        const hintNum = i + 1;
                        const sub = hintCounts[hintNum];
                        return (
                          <div key={hintNum} className="flex items-start gap-2 text-sm p-2 rounded bg-zinc-50 dark:bg-zinc-800">
                            <span className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-medium">H{hintNum}</span>
                            <span className="text-zinc-700 dark:text-zinc-300">{sub ? sub.diagnosis : 'No diagnosis'}</span>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Teacher Comment Section */}
                  <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3">
                    <button 
                      onClick={() => {
                        if (!comments[g.submissions[0]?.id]) {
                          loadComments(g.submissions[0].id);
                        }
                        setCommentingOn(commentingOn === g.submissions[0].id ? null : g.submissions[0].id);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 mb-2"
                    >
                      {comments[g.submissions[0]?.id]?.length > 0 
                        ? `View Comments (${comments[g.submissions[0].id].length})` 
                        : 'Add Comment'}
                    </button>

                    {commentingOn === g.submissions[0].id && (
                      <div className="space-y-2">
                        {comments[g.submissions[0].id]?.map((c: any) => (
                          <div key={c.id} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm flex justify-between items-start">
                            <div>
                              <span className="font-medium text-blue-700 dark:text-blue-300">{c.teacher_name}: </span>
                              <span className="text-zinc-700 dark:text-zinc-300">{c.comment}</span>
                              <span className="block text-xs text-zinc-400 mt-1">
                                {c.created_at ? new Date(c.created_at).toLocaleString() : 'Just now'}
                              </span>
                            </div>
                            <button 
                              onClick={() => deleteComment(c.id, g.submissions[0].id)}
                              className="text-red-500 hover:text-red-600 text-xs ml-2"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Write a comment..."
                            value={newComment[g.submissions[0].id] || ''}
                            onChange={(e) => setNewComment(prev => ({ ...prev, [g.submissions[0].id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') submitComment(g.submissions[0].id); }}
                            className="flex-1 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                          />
                          <button 
                            onClick={() => submitComment(g.submissions[0].id)}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg"
                          >
                            Send
                          </button>
                        </div>
                        {commentError[g.submissions[0].id] && (
                          <p className="text-red-500 text-xs">{commentError[g.submissions[0].id]}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </main>
    </div>
  );
}