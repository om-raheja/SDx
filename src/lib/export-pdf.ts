import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Hint {
  hint_order: number;
  content: string;
  image_url?: string;
  labs?: string;
}

interface Submission {
  id: string;
  diagnosis: string;
  submitted_after_hint: number;
  created_at: string;
  submission_type?: string;
  diagnosis_rank?: number;
  student_email?: string;
}

interface TeacherComment {
  comment: string;
  teacher_name?: string;
  created_at: string;
}

async function fetchImageAsBase64(imageUrl: string): Promise<{ data: string; type: string } | null> {
  try {
    const res = await fetch(`/api/image?url=${encodeURIComponent(imageUrl)}`);
    if (!res.ok) return null;
    const blob = await res.blob();
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onloadend = () => {
        const result = reader.result as string;
        const type = blob.type || 'image/png';
        resolve({ data: result, type });
      };
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function exportCaseToPdf(
  caseTitle: string,
  studentEmail: string,
  hints: Hint[],
  submissions: Submission[],
  comments: TeacherComment[]
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  const imageCache: Record<string, { data: string; type: string }> = {};
  for (const hint of hints) {
    if (hint.image_url) {
      const img = await fetchImageAsBase64(hint.image_url);
      if (img) imageCache[hint.image_url] = img;
    }
  }

  const sortedSubs = [...submissions].sort((a, b) => {
    if (a.submitted_after_hint !== b.submitted_after_hint) return a.submitted_after_hint - b.submitted_after_hint;
    return (a.diagnosis_rank || 999) - (b.diagnosis_rank || 999);
  });

  const diagnosesByHint: Record<number, string[]> = {};
  for (const sub of sortedSubs) {
    if (sub.submission_type !== 'problem_representation') {
      const hintOrder = sub.submitted_after_hint;
      if (!diagnosesByHint[hintOrder]) diagnosesByHint[hintOrder] = [];
      const rank = sub.diagnosis_rank ? sub.diagnosis_rank - 1 : diagnosesByHint[hintOrder].length;
      diagnosesByHint[hintOrder][rank] = sub.diagnosis;
    }
  }

  // Header
  doc.setFillColor(39, 39, 42);
  doc.rect(0, 0, pageWidth, 45, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('SDx Lab', margin, 22);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Case Submission Report', margin, 34);
  doc.setTextColor(0, 0, 0);

  y = 55;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(caseTitle, margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Student: ${studentEmail}`, margin, y);
  y += 7;
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, y);
  y += 12;
  doc.setTextColor(0, 0, 0);

  for (const hint of hints) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    // Hint header
    doc.setFillColor(244, 244, 245);
    doc.roundedRect(margin, y - 5, pageWidth - margin * 2, 10, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Hint ${hint.hint_order}`, margin + 3, y + 2);
    y += 12;

    // Hint content
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const hintLines = doc.splitTextToSize(hint.content, pageWidth - margin * 2 - 6);
    doc.text(hintLines, margin + 3, y);
    y += hintLines.length * 5 + 4;

    // Image
    const imgData = hint.image_url ? imageCache[hint.image_url] : null;
    if (imgData) {
      if (y > 220) {
        doc.addPage();
        y = 20;
      }
      try {
        const imgWidth = pageWidth - margin * 2;
        doc.addImage(imgData.data, imgData.type.split('/')[1] || 'PNG', margin, y, imgWidth, 40);
        y += 44;
      } catch {}
    }

    // Labs
    if (hint.labs) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text('Labs:', margin + 3, y);
      y += 5;
      doc.setFont('courier', 'normal');
      const labLines = doc.splitTextToSize(hint.labs, pageWidth - margin * 2 - 10);
      doc.text(labLines, margin + 6, y);
      y += labLines.length * 4 + 4;
      doc.setTextColor(0, 0, 0);
    }

    // Differential diagnoses
    const hintDiags = diagnosesByHint[hint.hint_order] || [];
    if (hintDiags.length > 0) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.setFillColor(239, 246, 255);
      doc.roundedRect(margin + 3, y - 4, pageWidth - margin * 2 - 6, 8, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(37, 99, 235);
      doc.text('Differential Diagnosis:', margin + 6, y + 1);
      y += 8;
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      for (let i = 0; i < hintDiags.length; i++) {
        if (hintDiags[i]) {
          const label = `#${i + 1} ${hintDiags[i]}`;
          const diagLines = doc.splitTextToSize(label, pageWidth - margin * 2 - 12);
          doc.text(diagLines, margin + 9, y);
          y += diagLines.length * 4 + 2;
        }
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
      }
      y += 4;
    }
  }

  // Problem Representation
  const prSub = sortedSubs.find(s => s.submission_type === 'problem_representation');
  if (prSub) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(239, 246, 255);
    doc.roundedRect(margin, y - 5, pageWidth - margin * 2, 10, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text('Problem Representation', margin + 3, y + 2);
    y += 12;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const prLines = doc.splitTextToSize(prSub.diagnosis, pageWidth - margin * 2 - 6);
    doc.text(prLines, margin + 3, y);
    y += prLines.length * 5 + 10;
  }

  // Teacher Comments
  if (comments.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Teacher Comments', margin, y);
    y += 8;

    for (const comment of comments) {
      doc.setFillColor(254, 249, 195);
      doc.roundedRect(margin, y - 4, pageWidth - margin * 2, 8, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`${comment.teacher_name || 'Teacher'}:`, margin + 3, y + 1);
      y += 7;
      doc.setFont('helvetica', 'normal');
      const commentLines = doc.splitTextToSize(comment.comment, pageWidth - margin * 2 - 6);
      doc.text(commentLines, margin + 3, y);
      y += commentLines.length * 5 + 6;

      if (y > 260) {
        doc.addPage();
        y = 20;
      }
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `SDx Lab — ${caseTitle} — Page ${i} of ${pageCount}`,
      margin,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  doc.save(`${caseTitle.replace(/[^a-z0-9]/gi, '_')}_${studentEmail.replace(/[@.]/g, '_')}.pdf`);
}
