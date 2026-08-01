function buildBlueprint(topics) {
  try {
    let totalQuestionsPlanned = 0;

    const blueprint = topics.map(topic => {
      let shortQuestions = 0;
      let mediumQuestions = 0;
      let longQuestions = 0;
      let numericals = 0;

      switch (topic.importance) {
        case 'High':
          shortQuestions = 3;
          mediumQuestions = 2;
          longQuestions = 2;
          numericals = 1;
          break;
        case 'Medium':
          shortQuestions = 2;
          mediumQuestions = 1;
          longQuestions = 1;
          numericals = 0;
          break;
        case 'Low':
        default:
          shortQuestions = 1;
          mediumQuestions = 1;
          longQuestions = 0;
          numericals = 0;
          break;
      }

      totalQuestionsPlanned += (shortQuestions + mediumQuestions + longQuestions + numericals);

      return {
        topic: topic.name,
        subtopics: topic.subtopics || [], // Pass down for Stage 4 keyword matching
        importance: topic.importance,
        shortQuestions,
        mediumQuestions,
        longQuestions,
        numericals
      };
    });

    console.log(`[Stage 3] Blueprint built. Total questions planned: ${totalQuestionsPlanned}`);
    return blueprint;
  } catch (error) {
    throw new Error(`[Stage 3 Failed] Error building blueprint: ${error.message}`);
  }
}

module.exports = { buildBlueprint };
