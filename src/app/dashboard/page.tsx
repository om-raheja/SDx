"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, ArrowRight, Pencil, Plus, Trash2, Search, X, FileDown } from "lucide-react";
import { exportCaseToPdf } from "@/lib/export-pdf";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ cases: any[]; submissions: any[]; comments: any[] } | null>(null);
  const [searching, setSearching] = useState(false);

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
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults(null);
      return;
    }

    setSearching(true);
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.cases || data.submissions || data.comments) {
            setSearchResults(data);
          }
        })
        .finally(() => setSearching(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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
    const res = await fetch(`/api/teacher-comments?comment_id=${commentId}`, {
      method: 'DELETE',
      headers: { 'x-delete-confirm': 'sdxlab-delete-2026' },
    });
    if (!res.ok) {
      setCommentError((prev) => ({ ...prev, [submissionId]: 'Failed to delete comment' }));
      return;
    }
    loadComments(submissionId);
  };

  const deleteStudentSubmissions = async (
    caseId: string,
    submissionIds: string[],
  ) => {
    const batchParams = new URLSearchParams({
      case_id: caseId,
      submission_ids: submissionIds.join(','),
    });
    let deleted = false;
    const batchRes = await fetch(`/api/submissions?${batchParams.toString()}`, {
      method: 'DELETE',
      headers: { 'x-delete-confirm': 'sdxlab-delete-2026' },
    });
    deleted = batchRes.ok;

    if (!deleted) {
      const perIdResults = await Promise.all(
        submissionIds.map((id) =>
          fetch(`/api/submissions?submission_id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: { 'x-delete-confirm': 'sdxlab-delete-2026' },
          })
        )
      );
      deleted = perIdResults.every((res) => res.ok);
    }

    if (!deleted) return;

    setTeacherSubmissions((prev) =>
      prev.filter((submission) => !submissionIds.includes(submission.id))
    );

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
    if (!confirm("Delete this case and all its submissions? This cannot be undone.")) return;
    const res = await fetch(`/api/cases/${caseId}`, {
      method: "DELETE",
      headers: { 'x-delete-confirm': 'sdxlab-delete-2026' },
    });
    if (!res.ok) return;
    setCases((prev) => prev.filter((c) => c.id !== caseId));
    setTeacherSubmissions((prev) => prev.filter((s) => s.case_id !== caseId));
  };

  const [exporting, setExporting] = useState<Record<string, boolean>>({});

  const handleExportPdf = async (caseId: string, studentEmail: string, submissions: any[]) => {
    const key = `${caseId}-${studentEmail}`;
    setExporting((prev) => ({ ...prev, [key]: true }));
    try {
      const caseRes = await fetch(`/api/cases/${caseId}`);
      if (!caseRes.ok) return;

      const caseData = await caseRes.json();
      const hints = caseData.hints || [];

      const studentSubs = submissions.map((s: any) => ({
        id: s.id,
        diagnosis: s.diagnosis,
        submitted_after_hint: s.submitted_after_hint,
        created_at: s.created_at,
        submission_type: s.submission_type,
      }));

      const caseComments = comments[submissions[0]?.id] || [];
      const teacherComments = caseComments.map((c: any) => ({
        comment: c.comment,
        teacher_name: c.teacher_name,
        created_at: c.created_at,
      }));

      await exportCaseToPdf(caseData.case?.title || 'Unknown Case', studentEmail, hints, studentSubs, teacherComments);
    } catch {
      console.error('Failed to export PDF');
    } finally {
      setExporting((prev) => ({ ...prev, [key]: false }));
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">Loading...</div>;
  }

  const isTeacher = TEACHER_EMAILS.includes(user.email);

  const getCaseSubmissionGroups = (caseId: string) => {
    const caseSubs = teacherSubmissions.filter((s: any) => s.case_id === caseId);
    const grouped = caseSubs.reduce((acc: Record<string, any>, s: any) => {
      // Group by submission_group_id only
      const groupId = s.submission_group_id || `legacy-${s.id}`;
      const key = groupId;
      
      if (!acc[key]) {
        acc[key] = {
          email: s.student_email || s.user_email || s.email || 'Unknown',
          student_user_id: s.user_id || null,
          case_id: caseId,
          submission_group_id: s.submission_group_id || null,
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

    return Object.values(grouped).sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  const getStudentSubmissionGroups = (caseId: string) => {
    const caseSubs = userSubmissions.filter((s: any) => s.case_id === caseId);
    const grouped = caseSubs.reduce((acc: Record<string, any>, s: any) => {
      const groupId = s.submission_group_id || `legacy-${s.id}`;
      if (!acc[groupId]) {
        acc[groupId] = {
          id: groupId,
          submissions: [],
          created_at: s.created_at,
        };
      }
      acc[groupId].submissions.push(s);
      if (new Date(s.created_at) > new Date(acc[groupId].created_at)) {
        acc[groupId].created_at = s.created_at;
      }
      return acc;
    }, {});

    return Object.values(grouped).sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
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
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cases, students, diagnoses, comments..."
              className="w-full pl-10 pr-10 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {searchResults && (
          <div className="mb-8 space-y-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Search Results
              {searching && <span className="ml-2 text-sm font-normal text-zinc-500">Searching...</span>}
            </h2>

            {searchResults.cases.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Cases ({searchResults.cases.length})</h3>
                <div className="space-y-2">
                  {searchResults.cases.map((c: any) => (
                    <div
                      key={c.id}
                      onClick={() => router.push(`/dashboard/${c.id}`)}
                      className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600"
                    >
                      <p className="font-medium text-zinc-900 dark:text-white">{c.title}</p>
                      <p className="text-xs text-zinc-500">{new Date(c.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchResults.submissions.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Submissions ({searchResults.submissions.length})</h3>
                <div className="space-y-2">
                  {searchResults.submissions.map((s: any) => (
                    <div
                      key={s.id}
                      onClick={() => router.push(`/dashboard/${s.case_id}`)}
                      className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-zinc-900 dark:text-white">{s.student_email}</p>
                        <span className="text-xs text-zinc-500">Hint {s.submitted_after_hint}</span>
                      </div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1">{s.diagnosis}</p>
                      <p className="text-xs text-zinc-500 mt-1">{s.case_title} · {new Date(s.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchResults.comments.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Comments ({searchResults.comments.length})</h3>
                <div className="space-y-2">
                  {searchResults.comments.map((c: any) => (
                    <div
                      key={c.id}
                      onClick={() => router.push(`/dashboard/${c.case_id}`)}
                      className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 cursor-pointer hover:border-blue-400 dark:hover:border-blue-600"
                    >
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">{c.comment}</p>
                      <p className="text-xs text-zinc-500 mt-1">{c.teacher_id} · {c.student_email} · {c.case_title} · {new Date(c.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!searching && searchResults.cases.length === 0 && searchResults.submissions.length === 0 && searchResults.comments.length === 0 && (
              <p className="text-zinc-500 dark:text-zinc-400">No results found for "{searchQuery}"</p>
            )}
          </div>
        )}

        {!searchResults && (
          <>
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
          </>
        )}

        {searchResults && isTeacher && (
          <button
            onClick={() => router.push('/teacher/create')}
            className="w-full mb-6 p-6 bg-white dark:bg-zinc-900 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-zinc-400 flex items-center justify-center gap-3 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <Plus className="w-8 h-8" />
            <span className="text-lg font-medium">Create New Case</span>
          </button>
        )}

        {!searchResults && cases.length === 0 && (
          <p className="text-zinc-600 dark:text-zinc-400">No cases available yet.</p>
        )}

        {!searchResults && cases.length > 0 && (
          <div className="grid gap-4">
            {cases.map((c) => {
                const teacherGroups = isTeacher ? getCaseSubmissionGroups(c.id) : [];
                const studentGroups = isTeacher ? [] : getStudentSubmissionGroups(c.id);
                const caseSubmissionGroups = isTeacher ? teacherGroups : studentGroups;
                const caseSubmissionCount = caseSubmissionGroups.length;

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
                        <ArrowRight className="w-7 h-7" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700">
                    <button
                      onClick={() => setExpandedCases((prev) => ({ ...prev, [c.id]: !prev[c.id] }))}
                      className="w-full px-6 py-4 flex items-center justify-between text-zinc-700 dark:text-zinc-200"
                      disabled={caseSubmissionCount === 0}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base font-medium underline">View Submissions</span>
                        <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-xs font-semibold">
                          {caseSubmissionCount}
                        </span>
                      </div>
                      {caseSubmissionCount === 0 ? (
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">(None)</span>
                      ) : expandedCases[c.id] ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>

                    {expandedCases[c.id] && caseSubmissionCount > 0 && (
                      <div className="border-t border-zinc-200 dark:border-zinc-700">
                        {isTeacher ? (
                          teacherGroups.map((g: any) => {
                            const primarySubmissionId = g.submissions[0]?.id;
                            if (!primarySubmissionId) return null;

                            return (
                              <div key={`${g.submission_group_id || g.submissions[0]?.id || `${g.email}-${g.case_id}`}`} className="px-6 py-3 border-b last:border-b-0 border-zinc-200 dark:border-zinc-700">
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-medium text-zinc-900 dark:text-white">{g.email}</h3>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleExportPdf(g.case_id, g.email, g.submissions)}
                                      disabled={exporting[`${g.case_id}-${g.email}`]}
                                      className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-50"
                                      title="Export to PDF"
                                      aria-label="Export to PDF"
                                    >
                                      {exporting[`${g.case_id}-${g.email}`] ? (
                                        <span className="text-xs">Exporting...</span>
                                      ) : (
                                        <FileDown className="w-4 h-4" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() =>
                                        deleteStudentSubmissions(
                                          g.case_id,
                                          g.submissions.map((s: any) => s.id),
                                        )
                                      }
                                      className="text-red-500 hover:text-red-600"
                                      title="Delete student submissions"
                                      aria-label="Delete student submissions"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-2 mb-3">
                                  {(() => {
                                    const groups: Record<string, any> = {};
                                    
                                    g.submissions.forEach((sub: any) => {
                                      const groupId = sub.submission_group_id || `legacy-${sub.id}`;
                                      if (!groups[groupId]) {
                                        groups[groupId] = {
                                          id: groupId,
                                          submissions: [],
                                          created_at: sub.created_at,
                                          email: sub.student_email || sub.user_email || sub.email,
                                        };
                                      }
                                      groups[groupId].submissions.push(sub);
                                      if (new Date(sub.created_at) > new Date(groups[groupId].created_at)) {
                                        groups[groupId].created_at = sub.created_at;
                                      }
                                    });
                                    
                                    const sortedGroups = Object.values(groups).sort((a: any, b: any) => 
                                      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                                    );
                                    
                                    return sortedGroups.map((group: any) => (
                                        <div key={group.id} className="border border-zinc-200 dark:border-zinc-700 rounded-md overflow-hidden">
                                          <div className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1.5 text-xs font-medium flex items-center justify-between">
                                            <span className="truncate text-zinc-600 dark:text-zinc-300">
                                              {group.submissions.length} hint{group.submissions.length > 1 ? 's' : ''}
                                            </span>
                                            <span className="text-xs text-zinc-400">
                                              {new Date(group.created_at).toLocaleString()}
                                            </span>
                                          </div>
                                          <div className="p-1.5 space-y-1">
                                            {group.submissions
                                              .sort((a: any, b: any) => (a.submitted_after_hint || 0) - (b.submitted_after_hint || 0))
                                              .map((sub: any, idx: number) => (
                                                <div key={sub.id || idx} className="flex items-start gap-1.5 text-sm p-1.5 rounded bg-zinc-50 dark:bg-zinc-900">
                                                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium min-w-[42px] text-center ${
                                                    sub.submission_type === 'problem_representation'
                                                      ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                                                      : 'bg-zinc-200 dark:bg-zinc-700'
                                                  }`}>
                                                    {sub.submission_type === 'problem_representation' ? 'PR' : (sub.submitted_after_hint || '?')}
                                                  </span>
                                                  <span className="text-zinc-700 dark:text-zinc-300">{sub.diagnosis || 'No diagnosis'}</span>
                                                </div>
                                            ))}
                                          </div>
                                        </div>
                                    ));
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
                        ) : (
                          studentGroups.map((group: any) => (
                            <div key={group.id} className="px-6 py-3 border-b last:border-b-0 border-zinc-200 dark:border-zinc-700">
                              <div className="border border-zinc-200 dark:border-zinc-700 rounded-md overflow-hidden">
                                <div className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1.5 text-xs font-medium flex items-center justify-between">
                                  <span className="truncate text-zinc-600 dark:text-zinc-300">
                                    {group.submissions.length} hint{group.submissions.length > 1 ? 's' : ''}
                                  </span>
                                  <span className="text-xs text-zinc-400">
                                    {new Date(group.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <div className="p-1.5 space-y-1">
                                  {group.submissions
                                    .sort((a: any, b: any) => (a.submitted_after_hint || 0) - (b.submitted_after_hint || 0))
                                    .map((sub: any, idx: number) => (
                                      <div key={sub.id || idx} className="p-2 rounded bg-zinc-50 dark:bg-zinc-900">
                                        <div className="flex items-start gap-1.5 text-sm">
                                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium min-w-[42px] text-center ${
                                            sub.submission_type === 'problem_representation'
                                              ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                                              : 'bg-zinc-200 dark:bg-zinc-700'
                                          }`}>
                                            {sub.submission_type === 'problem_representation' ? 'PR' : (sub.submitted_after_hint || '?')}
                                          </span>
                                          <span className="text-zinc-700 dark:text-zinc-300">{sub.diagnosis || 'No diagnosis'}</span>
                                        </div>
                                        {sub.teacher_comments?.length > 0 && (
                                          <div className="mt-2 pl-11 space-y-1">
                                            {sub.teacher_comments.map((comment: any) => (
                                              <div key={comment.id} className="p-1.5 rounded bg-blue-50 dark:bg-blue-900/20 text-xs">
                                                <span className="font-medium text-blue-700 dark:text-blue-300">Teacher: </span>
                                                <span className="text-zinc-700 dark:text-zinc-300">{comment.comment}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
