function formatToMarkdown(questions) {
  try {
    const sectionA = questions.filter(q => q.type === 'short');
    const sectionB = questions.filter(q => q.type === 'medium');
    const sectionC = questions.filter(q => q.type === 'long');
    const sectionD = questions.filter(q => q.type === 'numerical');
    
    // For Section E (Most Expected), we pick a mix of medium and long questions.
    // In a real scenario, we might use Gemini again, but JS only is required here.
    const expectedCandidates = [...sectionB, ...sectionC];
    // Simple pseudo-random selection (or just take the first 5-10)
    const sectionE = expectedCandidates.slice(0, 10);

    let md = '';

    md += `## SECTION A\n### Short Answer Questions (2 Marks)\n\n`;
    if (sectionA.length > 0) {
      sectionA.forEach((q, i) => {
        md += `**Q${i + 1}.** ${q.question} *(Topic: ${q.topic}, Difficulty: ${q.difficulty})*\n\n`;
      });
    } else {
      md += `*No short questions generated.*\n\n`;
    }
    
    md += `----------------------------------------\n\n`;

    md += `## SECTION B\n### Medium Questions (3–5 Marks)\n\n`;
    if (sectionB.length > 0) {
      sectionB.forEach((q, i) => {
        md += `**Q${i + 1}.** ${q.question} *(Topic: ${q.topic}, Difficulty: ${q.difficulty})*\n\n`;
      });
    } else {
      md += `*No medium questions generated.*\n\n`;
    }

    md += `----------------------------------------\n\n`;

    md += `## SECTION C\n### Long Questions (7–10 Marks)\n\n`;
    if (sectionC.length > 0) {
      sectionC.forEach((q, i) => {
        md += `**Q${i + 1}.** ${q.question} *(Topic: ${q.topic}, Difficulty: ${q.difficulty})*\n\n`;
      });
    } else {
      md += `*No long questions generated.*\n\n`;
    }

    md += `----------------------------------------\n\n`;

    md += `## SECTION D\n### Application / Numerical Questions\n\n`;
    if (sectionD.length > 0) {
      sectionD.forEach((q, i) => {
        md += `**Q${i + 1}.** ${q.question} *(Topic: ${q.topic}, Difficulty: ${q.difficulty})*\n\n`;
      });
    } else {
      md += `*No numerical questions generated. (Skip this section if chapter doesn't support numericals)*\n\n`;
    }

    md += `----------------------------------------\n\n`;

    md += `## SECTION E\n### Most Expected Exam Questions\n\n`;
    if (sectionE.length > 0) {
      sectionE.forEach((q, i) => {
        md += `**Q${i + 1}.** ${q.question}\n\n`;
      });
    } else {
      md += `*No specific expected questions identified.*\n\n`;
    }

    console.log(`[Stage 7] Markdown formatting complete. Output length: ${md.length} chars`);
    return md;
  } catch (error) {
    throw new Error(`[Stage 7 Failed] Error formatting markdown: ${error.message}`);
  }
}

module.exports = { formatToMarkdown };
