export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher';
  created_at: Date;
}

export interface Case {
  id: string;
  title: string;
  created_by: string;
  created_at: Date;
}

export interface Hint {
  id: string;
  case_id: string;
  hint_order: number;
  content: string;
  image_url: string | null;
  labs: string | null;
}

export interface Submission {
  id: string;
  user_id: string;
  case_id: string;
  diagnosis: string;
  submitted_after_hint: number;
  created_at: Date;
  is_final: boolean;
}