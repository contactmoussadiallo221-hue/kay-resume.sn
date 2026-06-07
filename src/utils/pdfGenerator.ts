import { jsPDF } from 'jspdf';
import { Summary } from '../types';

export function generateCoursePDF(summary: Summary): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  let y = 20;

  // Helper function to check space and add new page
  const checkPageSpace = (neededSpace: number) => {
    if (y + neededSpace > pageHeight - margin) {
      doc.addPage();
      drawPageBorder();
      y = margin + 10;
    }
  };

  // Helper function to draw stylish page borders and header
  const drawPageBorder = () => {
    // Subtle borders
    doc.setDrawColor(226, 232, 240); // tailwind slate-200
    doc.setLineWidth(0.3);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
    
    // Page header watermarks
    doc.setFont('Helvetica', 'oblique');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // tailwind slate-400
    doc.text('Mon Prof IA - Fiche de révision intelligente', margin, 15);
    doc.text(`Matière: ${summary.subject}`, pageWidth - margin - 40, 15, { align: 'right' });
  };

  // Draw border on first page
  drawPageBorder();

  // Draw subject badge
  doc.setFillColor(79, 70, 229); // Indigo bg
  doc.roundedRect(margin, y, 40, 7, 1.5, 1.5, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(summary.subject.toUpperCase(), margin + 20, y + 4.5, { align: 'center' });
  
  // Draw difficulty badge
  const diffLabels: Record<string, string> = {
    primary: 'ÉLÉMENTAIRE',
    college: 'COLLÈGE',
    lycee: 'LYCÉE',
    uni: 'UNIVERSITÉ'
  };
  doc.setFillColor(245, 158, 11); // Amber bg
  doc.roundedRect(margin + 45, y, 35, 7, 1.5, 1.5, 'F');
  doc.text(diffLabels[summary.difficulty] || 'SANS NIVEAU', margin + 62.5, y + 4.5, { align: 'center' });

  y += 15;

  // Course Title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // slate-900
  const splitTitle = doc.splitTextToSize(summary.title, contentWidth);
  doc.text(splitTitle, margin, y);
  y += splitTitle.length * 8 + 5;

  // Separation Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Introduction / Summary
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text('1. Résumé du Cours', margin, y);
  y += 6;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(51, 65, 85); // slate-700
  const splitSummary = doc.splitTextToSize(summary.summaryText, contentWidth);
  doc.text(splitSummary, margin, y);
  y += splitSummary.length * 5.5 + 10;

  // Key points
  checkPageSpace(30);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(79, 70, 229);
  doc.text('2. Points Clés à Retenir', margin, y);
  y += 7;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  summary.keyPoints.forEach((point) => {
    checkPageSpace(12);
    const splitPoint = doc.splitTextToSize(`•  ${point}`, contentWidth - 5);
    doc.text(splitPoint, margin, y);
    y += splitPoint.length * 5 + 2;
  });
  y += 6;

  // Definitions
  if (summary.definitions && summary.definitions.length > 0) {
    checkPageSpace(30);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(79, 70, 229);
    doc.text('3. Définitions Essentielles', margin, y);
    y += 8;

    summary.definitions.forEach((def) => {
      const termStr = `${def.term} : `;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42); // dark black
      
      const termWidth = doc.getTextWidth(termStr);
      
      doc.text(termStr, margin, y);
      
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(71, 85, 105); // slate-600
      
      const splitDef = doc.splitTextToSize(def.definition, contentWidth - termWidth - 2);
      doc.text(splitDef, margin + termWidth + 1, y);
      
      y += splitDef.length * 5 + 4;
      checkPageSpace(12);
    });
    y += 4;
  }

  // Formulas or dates
  if (summary.formulasOrDates && summary.formulasOrDates.length > 0) {
    checkPageSpace(35);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(79, 70, 229);
    doc.text('4. Formules, Théorèmes ou Dates Clés', margin, y);
    y += 7;

    summary.formulasOrDates.forEach((form) => {
      checkPageSpace(12);
      
      // Light highlight box behind each formula
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(241, 245, 249); // slate-100
      doc.setLineWidth(0.2);
      
      const splitFormula = doc.splitTextToSize(form, contentWidth - 10);
      const boxHeight = splitFormula.length * 5 + 4;
      
      doc.roundedRect(margin, y - 4, contentWidth, boxHeight, 1, 1, 'FD');
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(180, 83, 9); // Amber-700
      doc.text(splitFormula, margin + 5, y);
      
      y += boxHeight + 4;
    });
    y += 4;
  }

  // Explanation level simplification
  checkPageSpace(35);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(79, 70, 229);
  doc.text(`5. Explication Simplifiée (Niveau ${diffLabels[summary.difficulty]})`, margin, y);
  y += 7;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  const splitExplanation = doc.splitTextToSize(summary.simplification, contentWidth);
  doc.text(splitExplanation, margin, y);
  y += splitExplanation.length * 5.5 + 10;

  // Quiz Questions
  if (summary.quiz && summary.quiz.length > 0) {
    checkPageSpace(40);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(79, 70, 229);
    doc.text('6. Quiz de Révision & Auto-évaluation', margin, y);
    y += 8;

    summary.quiz.forEach((q, qIndex) => {
      checkPageSpace(35);
      
      // Question Title
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      const splitQ = doc.splitTextToSize(`Question ${qIndex + 1}: ${q.question}`, contentWidth);
      doc.text(splitQ, margin, y);
      y += splitQ.length * 5 + 3;

      // Options
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      
      q.options.forEach((opt, oIndex) => {
        checkPageSpace(10);
        const optLetter = String.fromCharCode(65 + oIndex); // A, B, C, D
        const isCorrect = opt === q.correctAnswer;
        
        if (isCorrect) {
          doc.setFont('Helvetica', 'bold');
          doc.setTextColor(22, 101, 52); // green-800 for correct highlight
        } else {
          doc.setFont('Helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
        }

        const splitOpt = doc.splitTextToSize(`[${optLetter}]  ${opt}`, contentWidth - 5);
        doc.text(splitOpt, margin + 4, y);
        y += splitOpt.length * 4.5 + 1.5;
      });

      // Explanation
      checkPageSpace(15);
      doc.setFont('Helvetica', 'oblique');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // slate-500
      
      const explStr = `Réponse correcte : ${q.correctAnswer} - ${q.explanation}`;
      const splitExpl = doc.splitTextToSize(explStr, contentWidth - 8);
      
      doc.setFillColor(240, 253, 244); // light green bg
      doc.roundedRect(margin, y - 3.5, contentWidth, splitExpl.length * 4.5 + 4, 1, 1, 'F');
      doc.text(splitExpl, margin + 4, y);
      
      y += splitExpl.length * 4.5 + 10;
    });
  }

  // Footer footer info
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Fiche créée sur Mon Prof IA • Page ${i} sur ${pageCount}`,
      pageWidth / 2,
      pageHeight - 12,
      { align: 'center' }
    );
  }

  // Trigger download
  const formattedTitle = summary.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  doc.save(`fiche_revision_${formattedTitle || 'cours'}.pdf`);
}
