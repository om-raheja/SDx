"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Eye, Pencil, Plus, Trash2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
}

const TEACHER_EMAILS = ['soniasethi66@hotmail.com', 'buttabomma67@outlook.com'];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [userSubmissions, setUserSubmissions] = useState<any[]>([]);
  const [teacherSubmissions, setTeacherSubmissions] = useState<any[]>([]);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [commentError, setCommentError] = useState<Record<string, string>>({});
  const [expandedCases, setExpandedCases] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const fetchTeacherSubmissions = () => {
    fetch("/api/submissions")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTeacherSubmissions(data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true" ||
      (!localStorage.getItem("darkMode") && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    }

    Promise.all([
      fetch("/api/auth/me"),
      fetch("/api/cases"),
      fetch("/api/auth/me/submissions"),
    ])
      .then(([userRes, casesRes, mySubRes]) => Promise.all([userRes.json(), casesRes.json(), mySubRes.json()]))
      .then(([userData, casesData, mySubData]) => {
        if (userData.error) {
          router.push('/auth/signin');
          return;
        }

        const isTeacher = TEACHER_EMAILS.includes(userData.email);
        setUser({ id: userData.id, email: userData.email, name: userData.name });
        setCases(Array.isArray(casesData) ? casesData : []);
        setUserSubmissions(Array.isArray(mySubData) ? mySubData : []);

        if (isTeacher) {
          fetchTeacherSubmissions();
        }
      })
      .catch(() => router.push('/auth/signin'))
      .finally(() => setLoading(false));
  }, [router]);

  const loadComments = (submissionId: string) => {
    fetch(`/api/teacher-comments?submission_id=${submissionId}`)
      .then((res) => res.json())
      .then((data) => {
        setComments((prev) => ({ ...prev, [submissionId]: Array.isArray(data) ? data : [] }));
      });
  };

  useEffect(() => {
    const grouped: Record<string, any[]> = {};
    teacherSubmissions.forEach((s: any) => {
      const key = `${s.case_id}::${s.student_email || s.user_email || 'unknown'}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(s);
    });

    Object.values(grouped).forEach((groupSubs: any[]) => {
      const primarySubmissionId = groupSubs[0]?.id;
      if (primarySubmissionId && comments[primarySubmissionId] === undefined) {
        loadComments(primarySubmissionId);
      }
    });
  }, [teacherSubmissions, comments]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));
    document.documentElement.classList.toggle("dark");
  };

  const handleSignOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push('/auth/signin');
  };

  const submitComment = async (submissionId: string) => {
    const comment = newComment[submissionId];
    if (!comment?.trim()) {
      setCommentError((prev) => ({ ...prev, [submissionId]: 'Comment cannot be empty' }));
      return;
    }

    const res = await fetch("/api/teacher-comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submission_id: submissionId, comment }),
    });

    if (res.ok) {
      setNewComment((prev) => ({ ...prev, [submissionId]: '' }));
      setCommentError((prev) => ({ ...prev, [submissionId]: '' }));
      setComments((prev) => ({
        ...prev,
        [submissionId]: [
          ...(prev[submissionId] || []),
          {
            id: 'new-' + Date.now(),
            comment,
            teacher_name: user?.email?.split('@')[0] || 'Teacher',
            created_at: new Date().toISOString()
          }
        ]
      }));
      loadComments(submissionId);
      return;
    }

    const data = await res.json();
    setCommentError((prev) => ({ ...prev, [submissionId]: data.error || 'Failed to add comment' }));
  };

  const deleteComment = async (commentId: string, submissionId: string) => {
    await fetch(`/api/teacher-comments?comment_id=${commentId}`, { method: 'DELETE' });
    loadComments(submissionId);
  };

  const deleteStudentSubmissions = async (caseId: string, studentEmail: string, submissionIds: string[]) => {
    await fetch(`/api/submissions?case_id=${encodeURIComponent(caseId)}&student_email=${encodeURIComponent(studentEmail)}`, {
      method: 'DELETE'
    });

    setComments((prev) => {
      const next = { ...prev };
      submissionIds.forEach((id) => delete next[id]);
      return next;
    });
    setNewComment((prev) => {
      const next = { ...prev };
      submissionIds.forEach((id) => delete next[id]);
      return next;
    });
    setCommentError((prev) => {
      const next = { ...prev };
      submissionIds.forEach((id) => delete next[id]);
      return next;
    });

    fetchTeacherSubmissions();
  };

  const deleteCase = async (caseId: string) => {
    await fetch(`/api/cases/${caseId}`, { method: "DELETE" });
    setCases((prev) => prev.filter((c) => c.id !== caseId));
    setTeacherSubmissions((prev) => prev.filter((s) => s.case_id !== caseId));
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">Loading...</div>;
  }

  const isTeacher = TEACHER_EMAILS.includes(user.email);

  const getCaseSubmissionGroups = (caseId: string) => {
    const caseSubs = teacherSubmissions.filter((s: any) => s.case_id === caseId);
    const grouped = caseSubs.reduce((acc: Record<string, any>, s: any) => {
      const email = s.student_email || s.user_email || 'unknown';
      const key = `${email}-${caseId}`;
      if (!acc[key]) {
        acc[key] = {
          email,
          case_id: caseId,
          submissions: [],
          created_at: s.created_at,
        };
      }
      acc[key].submissions.push(s);
      if (new Date(s.created_at) > new Date(acc[key].created_at)) {
        acc[key].created_at = s.created_at;
      }
      return acc;
    }, {});

    return Object.values(grouped);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
          SDx Lab {isTeacher && <span className="text-xs bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-2 py-0.5 rounded ml-2">Teacher</span>}
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button onClick={handleSignOut} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 dark:text-white rounded-lg">
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-8 px-6">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-6">Available Cases</h2>
        {isTeacher && (
          <button
            onClick={() => router.push('/teacher/create')}
            className="w-full mb-6 p-6 bg-white dark:bg-zinc-900 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-zinc-400 flex items-center justify-center gap-3 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <Plus className="w-8 h-8" />
            <span className="text-lg font-medium">Create New Case</span>
          </button>
        )}

        {cases.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">No cases available yet.</p>
        ) : (
          <div className="grid gap-4">
            {cases.map((c) => {
              const groups = isTeacher ? getCaseSubmissionGroups(c.id) : [];

              return (
                <div key={c.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
                  <div className="flex items-center justify-between p-6 bg-zinc-100 dark:bg-zinc-800">
                    <div className="flex items-center gap-3 min-w-0">
                      {isTeacher && (
                        <button
                          onClick={() => deleteCase(c.id)}
                          className="text-red-500 hover:text-red-600"
                          title="Delete case"
                          aria-label="Delete case"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <span className="text-lg font-medium text-zinc-900 dark:text-white truncate">{c.title}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {isTeacher && (
                        <button
                          onClick={() => router.push(`/teacher/cases/${c.id}`)}
                          className="text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white"
                          aria-label={`Edit ${c.title}`}
                          title="Edit case hints"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/dashboard/${c.id}`)}
                        className="text-zinc-800 dark:text-zinc-100 hover:text-black dark:hover:text-white"
                        aria-label={`Preview ${c.title}`}
                        title="Student preview"
                      >
                        <Eye className="w-7 h-7" />
                      </button>
                    </div>
                  </div>

                  {isTeacher && (
                    <div className="bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700">
                      <button
                        onClick={() => setExpandedCases((prev) => ({ ...prev, [c.id]: !prev[c.id] }))}
                        className="w-full px-6 py-4 flex items-center justify-between text-zinc-700 dark:text-zinc-200"
                      >
                        <span className="text-base font-medium underline">View Submissions</span>
                        {expandedCases[c.id] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </button>

                      {expandedCases[c.id] && (
                        <div className="border-t border-zinc-200 dark:border-zinc-700">
                          {groups.length === 0 ? (
                            <p className="px-6 py-4 text-zinc-600 dark:text-zinc-400 text-sm">No submissions yet.</p>
                          ) : (
                            groups.map((g: any) => {
                              const primarySubmissionId = g.submissions[0]?.id;
                              if (!primarySubmissionId) return null;

                              return (
                                <div key={`${g.email}-${g.case_id}`} className="px-6 py-4 border-b last:border-b-0 border-zinc-200 dark:border-zinc-700">
                                  <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-medium text-zinc-900 dark:text-white">{g.email}</h3>
                                    <div className="text-right">
                                      <span className="text-xs text-zinc-500 dark:text-zinc-400">{new Date(g.created_at).toLocaleString()}</span>
                                      <button
                                        onClick={() => deleteStudentSubmissions(g.case_id, g.email, g.submissions.map((s: any) => s.id))}
                                        className="block ml-auto mt-1 text-red-500 hover:text-red-600"
                                        title="Delete student submissions"
                                        aria-label="Delete student submissions"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
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
                                          <div key={hintNum} className="flex items-start gap-2 text-sm p-2 rounded bg-zinc-100 dark:bg-zinc-800">
                                            <span className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-medium">H{hintNum}</span>
                                            <span className="text-zinc-700 dark:text-zinc-300">{sub ? sub.diagnosis : 'No diagnosis'}</span>
                                          </div>
                                        );
                                      });
                                    })()}
                                  </div>

                                  <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3">
                                    <div className="space-y-2">
                                      <p className="text-sm text-blue-600">Comments ({comments[primarySubmissionId]?.length || 0})</p>
                                      {comments[primarySubmissionId]?.map((comment: any) => (
                                        <div key={comment.id} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm flex justify-between items-start">
                                          <div>
                                            <span className="font-medium text-blue-700 dark:text-blue-300">{(comment.teacher_name || 'Teacher')}: </span>
                                            <span className="text-zinc-700 dark:text-zinc-300">{comment.comment}</span>
                                            <span className="block text-xs text-zinc-400 mt-1">
                                              {comment.created_at ? new Date(comment.created_at).toLocaleString() : 'Just now'}
                                            </span>
                                          </div>
                                          <button
                                            onClick={() => deleteComment(comment.id, primarySubmissionId)}
                                            className="text-red-500 hover:text-red-600 ml-2"
                                            title="Delete comment"
                                            aria-label="Delete comment"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      ))}
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          placeholder="Write a comment..."
                                          value={newComment[primarySubmissionId] || ''}
                                          onChange={(e) => setNewComment((prev) => ({ ...prev, [primarySubmissionId]: e.target.value }))}
                                          onKeyDown={(e) => { if (e.key === 'Enter') submitComment(primarySubmissionId); }}
                                          className="flex-1 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                                        />
                                        <button
                                          onClick={() => submitComment(primarySubmissionId)}
                                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg"
                                        >
                                          Send
                                        </button>
                                      </div>
                                      {commentError[primarySubmissionId] && (
                                        <p className="text-red-500 text-xs">{commentError[primarySubmissionId]}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {userSubmissions.length > 0 && (
        <main className="max-w-5xl mx-auto py-8 px-6">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-6">Your Past Submissions</h2>
          {(() => {
            const grouped = userSubmissions.reduce((acc: Record<string, any>, s: any) => {
              const key = s.case_id;
              if (!acc[key]) {
                acc[key] = {
                  case_title: s.case_title || 'Unknown',
                  case_id: s.case_id,
                  submissions: [],
                  created_at: s.created_at,
                };
              }
              acc[key].submissions.push(s);
              if (new Date(s.created_at) > new Date(acc[key].created_at)) {
                acc[key].created_at = s.created_at;
              }
              return acc;
            }, {});

            return (
              <div className="space-y-6">
                {Object.values(grouped).map((g: any) => (
                  <div key={g.case_id} className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-medium text-zinc-900 dark:text-white">{g.case_title}</h3>
                      <div className="text-right">
                        <span className="text-xs text-zinc-400">
                          {g.submissions.filter((s: any) => s.is_final).length > 0 ? '✓ Complete' : `${g.submissions.length}/7`}
                        </span>
                        <p className="text-xs text-zinc-400">{new Date(g.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {[1, 2, 3, 4, 5, 6, 7].map((hintNum) => {
                        const sub = g.submissions.find((s: any) => s.submitted_after_hint === hintNum);
                        return (
                          <div key={hintNum} className="flex items-start gap-2 text-sm p-2 rounded bg-zinc-50 dark:bg-zinc-800">
                            <span className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-medium min-w-[50px] text-center">
                              H{hintNum}
                            </span>
                            {sub ? (
                              <div className="flex-1">
                                <span className="text-zinc-700 dark:text-zinc-300">{sub.diagnosis}</span>
                                {sub.teacher_comments?.length > 0 && (
                                  <div className="mt-1 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                                    <span className="text-blue-600 dark:text-blue-400 font-medium">Teacher feedback:</span>
                                    {sub.teacher_comments.map((c: any) => (
                                      <p key={c.id} className="text-blue-700 dark:text-blue-300">{c.comment}</p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-zinc-400 italic">pending</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </main>
      )}
    </div>
  );
}
