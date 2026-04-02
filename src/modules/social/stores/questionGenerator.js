// src/modules/social/stores/questionGenerator.js
import { defineStore } from 'pinia';
import topicsData from '@/modules/social/data/topics.json';
import theoryData from '@/modules/social/data/theory.json';
import normativeActsData from '@/modules/social/data/normative_acts.json';
import planTopicsData from '@/modules/social/data/plan_topics.json';
import essayTopicsData from '@/modules/social/data/essay_topics.json';
import tasksData from '@/modules/social/data/tasks.json';
import textsData from '@/modules/social/data/texts.json';
import lawTasksData from '@/modules/social/data/law_tasks.json';
import staticTasksData from '@/modules/social/data/static_tasks.json';
import matchPairsData from '@/modules/social/data/match_pairs.json';

export const useQuestionGenerator = defineStore('questionGenerator', {
  state: () => ({
    topicsMap: null,
    theoryMap: null,
    normativeActs: null,
    planTopics: null,
    essayTopics: null,
    tasks: [],
    texts: [],
    lawTasks: [],
    staticTasks9: [],
    staticTasks21: [],
    cachedTopicsByBlock: new Map()
  }),

  actions: {
    initialize() {
      if (!this.topicsMap) {
        this.topicsMap = new Map();
        topicsData.blocks.forEach(block => {
          block.topics.forEach(topic => {
            this.topicsMap.set(topic.topic_id, topic);
          });
        });
      }
      if (!this.theoryMap) {
        this.theoryMap = new Map();
        theoryData.blocks.forEach(block => {
          block.lessons.forEach(lesson => {
            this.theoryMap.set(lesson.topic_id, lesson);
          });
        });
      }
      this.normativeActs = normativeActsData.acts || [];
      this.planTopics = planTopicsData.plan_topics || [];
      this.essayTopics = essayTopicsData.essay_topics || [];
      this.tasks = tasksData.tasks || [];
      this.texts = textsData.texts || [];
      this.lawTasks = lawTasksData.tasks || [];
      this.staticTasks9 = staticTasksData.tasks9 || [];
      this.staticTasks21 = staticTasksData.tasks21 || [];
    },

    getRandomItem(array) {
      if (!array?.length) return null;
      return array[Math.floor(Math.random() * array.length)];
    },

    shuffleArray(array) {
      if (!array || !array.length) return [];
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },

    getTopicsByBlock(blockId) {
      if (this.cachedTopicsByBlock.has(blockId)) {
        return this.cachedTopicsByBlock.get(blockId);
      }
      let topics;
      if (blockId === 'all') {
        topics = Array.from(this.topicsMap.values());
      } else {
        topics = Array.from(this.topicsMap.values())
          .filter(t => t.topic_id.startsWith(`${blockId}.`));
      }
      this.cachedTopicsByBlock.set(blockId, topics);
      return topics;
    },

    // ========== ЗАДАНИЕ 1 ==========
    generateTask1(topicId, egeNum = 1) {
      const topic = this.topicsMap.get(topicId);
      if (!topic?.definitions?.length || topic.definitions.length < 4) return null;

      const definitions = topic.definitions;
      const shuffled = this.shuffleArray([...definitions]);
      const correctTerms = shuffled.slice(0, 3);

      const otherTopics = Array.from(this.topicsMap.values()).filter(t => t.topic_id !== topicId);
      const otherTopic = this.getRandomItem(otherTopics);
      const extraTerm = this.getRandomItem(otherTopic?.definitions || [])?.term || 'Лишний термин';

      const options = [...correctTerms.map(t => t.term), extraTerm];
      this.shuffleArray(options);

      const correctIndices = options.map((opt, idx) => opt === extraTerm ? idx : null).filter(i => i !== null);

      return {
        id: `task1_${topicId.replace(/\./g, '_')}_${egeNum}`,
        type: 'choice',
        ege_num: egeNum,
        text: `Ниже приведён перечень терминов. Все они, за исключением двух, относятся к теме "${topic.name}". Найдите два термина, «выпадающих» из общего ряда, и запишите цифры, под которыми они указаны.`,
        options: options,
        correct: correctIndices,
        isMultiple: true,
        topicId,
        topicName: topic.name
      };
    },

    // ========== ЗАДАНИЕ 2 ==========
    generateTask2(topicId, egeNum = 2) {
      const theory = this.theoryMap.get(topicId);
      if (!theory?.trueStatements?.length || !theory?.falseStatements?.length) {
        return this.generateTask2Legacy(topicId, egeNum);
      }

      const trueStatements = theory.trueStatements;
      const falseStatements = theory.falseStatements;

      const selectedTrue = this.shuffleArray([...trueStatements]).slice(0, 3);
      const selectedFalse = this.shuffleArray([...falseStatements]).slice(0, 2);
      const allStatements = [...selectedTrue, ...selectedFalse];
      this.shuffleArray(allStatements);

      const correctIndices = [];
      allStatements.forEach((stmt, idx) => {
        if (selectedTrue.includes(stmt)) correctIndices.push(idx);
      });

      return {
        id: `task2_${topicId.replace(/\./g, '_')}_${egeNum}`,
        type: 'choice',
        ege_num: egeNum,
        text: `Выберите верные суждения и запишите цифры, под которыми они указаны.`,
        options: allStatements,
        correct: correctIndices,
        isMultiple: true,
        topicId,
        topicName: theory.title
      };
    },

    generateTask2Legacy(topicId, egeNum = 2) {
      const theory = this.theoryMap.get(topicId);
      if (!theory) return null;
      const text = theory.explanation || '';
      const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 20).slice(0, 4);
      if (sentences.length < 2) return null;
      const options = sentences.slice(0, 4);
      const correctIndices = [0, 2];
      return {
        id: `task2_legacy_${topicId.replace(/\./g, '_')}_${egeNum}`,
        type: 'choice',
        ege_num: egeNum,
        text: `Выберите верные суждения и запишите цифры, под которыми они указаны.`,
        options: options,
        correct: correctIndices,
        isMultiple: true,
        topicId,
        topicName: theory.title
      };
    },

    // ========== СООТВЕТСТВИЕ (3,6,13,15) ==========
    generateMatch(egeNum) {
      const egeKey = `ege${egeNum}`;
      const blocks = matchPairsData[egeKey]?.blocks || [];
      
      if (!blocks.length) return null;

      const selectedBlock = this.getRandomItem(blocks);
      const options = selectedBlock.options;
      
      if (!options || options.length < 2) return null;

      const allPairs = [];
      options.forEach(opt => {
        if (opt.terms && opt.terms.length) {
          opt.terms.forEach(term => {
            allPairs.push({ term: term, correct: opt.id.toString() });
          });
        }
      });

      if (allPairs.length < 4) return null;

      const totalNeeded = Math.min(6, Math.max(4, allPairs.length));
      const shuffledPairs = this.shuffleArray([...allPairs]);
      
      const selectedPairs = [];
      const usedOptions = new Map();
      
      options.forEach(opt => {
        usedOptions.set(opt.id, 0);
      });
      
      for (const opt of options) {
        const pairsFromOpt = shuffledPairs.filter(p => p.correct === opt.id);
        if (pairsFromOpt.length > 0) {
          selectedPairs.push(pairsFromOpt[0]);
          usedOptions.set(opt.id, usedOptions.get(opt.id) + 1);
        }
      }
      
      if (selectedPairs.length < totalNeeded) {
        const remaining = shuffledPairs.filter(p => !selectedPairs.includes(p));
        const toAdd = remaining.slice(0, totalNeeded - selectedPairs.length);
        selectedPairs.push(...toAdd);
        toAdd.forEach(p => {
          usedOptions.set(p.correct, usedOptions.get(p.correct) + 1);
        });
      }
      
      const finalPairs = this.shuffleArray(selectedPairs.slice(0, totalNeeded));
      
      const leftItems = finalPairs.map(p => p.term);
      const correctAnswers = finalPairs.map(p => p.correct).join('');
      
      const optionsList = options.map(opt => opt.name);

      return {
        id: `match_${egeNum}_${selectedBlock.name?.replace(/\s/g, '_') || Date.now()}`,
        type: 'match',
        ege_num: egeNum,
        text: this.getMatchText(egeNum),
        leftItems: leftItems,
        optionsList: optionsList,
        correctAnswers: correctAnswers,
        topicName: selectedBlock.name || `Задание ${egeNum}`
      };
    },

    getMatchText(egeNum) {
      const texts = {
        3: 'Установите соответствие между характеристиками и формами (видами) культуры: к каждой позиции, данной в первом столбце, подберите соответствующую позицию из второго столбца.',
        6: 'Установите соответствие между характеристиками и факторами производства: к каждой позиции, данной в первом столбце, подберите соответствующую позицию из второго столбца.',
        13: 'Установите соответствие между полномочиями и субъектами государственной власти РФ: к каждой позиции, данной в первом столбце, подберите соответствующую позицию из второго столбца.',
        15: 'Установите соответствие между отраслями права и их институтами (характеристиками): к каждой позиции, данной в первом столбце, подберите соответствующую позицию из второго столбца.'
      };
      return texts[egeNum] || 'Установите соответствие между позициями: к каждой позиции, данной в первом столбце, подберите соответствующую позицию из второго столбца.';
    },

    generateMatchEge3() {
      return this.generateMatch(3);
    },

    generateMatchEge6() {
      return this.generateMatch(6);
    },

    generateMatchEge13() {
      return this.generateMatch(13);
    },

    generateMatchEge15() {
      return this.generateMatch(15);
    },

    // ========== ХАРАКТЕРИСТИКИ (4,7,11) ==========
    generateCharacteristics(egeNum, characteristicsKey, topicId) {
      const topic = this.topicsMap.get(topicId);
      if (!topic?.characteristics?.[characteristicsKey]) {
        return this.generateTask2(topicId, egeNum);
      }

      const allCorrect = topic.characteristics[characteristicsKey];
      const shuffledCorrect = this.shuffleArray([...allCorrect]);
      const numCorrect = Math.min(3, Math.max(2, Math.floor(Math.random() * 2) + 2));
      const selectedCorrect = shuffledCorrect.slice(0, numCorrect);
      
      const otherKeys = Object.keys(topic.characteristics).filter(k => k !== characteristicsKey);
      let wrongOptions = [];
      for (const key of otherKeys) {
        const otherChars = topic.characteristics[key];
        if (otherChars && otherChars.length) {
          wrongOptions.push(...otherChars);
        }
      }
      const shuffledWrong = this.shuffleArray([...wrongOptions]);
      const neededWrong = 6 - selectedCorrect.length;
      const selectedWrong = shuffledWrong.slice(0, neededWrong);
      
      const options = [...selectedCorrect, ...selectedWrong];
      this.shuffleArray(options);

      const correctIndices = [];
      options.forEach((opt, idx) => {
        if (selectedCorrect.includes(opt)) correctIndices.push(idx);
      });

      return {
        id: `char_${egeNum}_${topicId.replace(/\./g, '_')}`,
        type: 'choice',
        ege_num: egeNum,
        text: this.getTaskText(egeNum, characteristicsKey),
        options: options,
        correct: correctIndices,
        isMultiple: true,
        topicId,
        topicName: topic.name
      };
    },

    getTaskText(egeNum, key) {
      const texts = {
        4: {
          traditional: 'Выберите признаки, характерные для традиционного общества.',
          industrial: 'Выберите признаки, характерные для индустриального общества.',
          postindustrial: 'Выберите признаки, характерные для постиндустриального общества.'
        },
        7: {
          fixed_costs: 'Выберите примеры постоянных издержек фирмы.',
          variable_costs: 'Выберите примеры переменных издержек фирмы.'
        },
        11: {
          majoritarian_system: 'Выберите признаки мажоритарной избирательной системы.',
          proportional_system: 'Выберите признаки пропорциональной избирательной системы.',
          mixed_system: 'Выберите признаки смешанной избирательной системы.'
        }
      };
      return texts[egeNum]?.[key] || 'Выберите верные утверждения.';
    },

    // ========== СТАТИЧЕСКИЕ ЗАДАНИЯ 9 ==========
    getStaticTask9() {
      if (!this.staticTasks9.length) return null;
      const task = this.getRandomItem(this.staticTasks9);
      return {
        type: 'choice',
        ege_num: 9,
        text: task.question,
        options: task.options,
        correct: task.correct,
        isMultiple: true,
        data: task.data,
        explanation: task.explanation,
        id: task.id || `static9_${Date.now()}`
      };
    },

    // ========== СТАТИЧЕСКИЕ ЗАДАНИЯ 21 ==========
    getStaticTask21() {
      if (!this.staticTasks21.length) return null;
      const task = this.getRandomItem(this.staticTasks21);
      return {
        type: 'graph_analysis',
        ege_num: 21,
        title: task.title,
        data: task.data,
        questions: task.questions,
        expected: task.expected,
        id: task.id || `static21_${Date.now()}`
      };
    },

    getStaticTask21ById(id) {
      if (!this.staticTasks21.length) return null;
      const task = this.staticTasks21.find(t => t.id === id);
      if (!task) return null;
      return {
        type: 'graph_analysis',
        ege_num: 21,
        title: task.title,
        data: task.data,
        questions: task.questions,
        expected: task.expected,
        id: task.id || `static21_${Date.now()}`
      };
    },

    // ========== ГЕНЕРАЦИЯ ПОЛНОГО ЭКЗАМЕНА ==========
    generateFullExam(blockId, title, classId, deadline = null, part2Selections = {}) {
      this.initialize();
      const topicsInBlock = this.getTopicsByBlock(blockId);
      if (!topicsInBlock.length) return null;

      const part1 = [];

      // 1
      let q = this.generateTask1(this.getRandomItem(topicsInBlock).topic_id, 1);
      if (!q) q = this.generateTask2(this.getRandomItem(topicsInBlock).topic_id, 1);
      if (q) part1.push(q);

      // 2
      q = this.generateTask2(this.getRandomItem(topicsInBlock).topic_id, 2);
      if (!q && this.getRandomItem(topicsInBlock)) q = this.generateMatch(2);
      if (q) part1.push(q);

      // 3
      q = this.generateMatchEge3();
      if (q) part1.push(q);

      // 4
      q = this.generateCharacteristics(4, 'traditional', '1.8');
      if (!q) q = this.generateTask2('1.8', 4);
      if (q) part1.push(q);

      // 5
      const ecoTopics = topicsInBlock.filter(t => t.topic_id.startsWith('2.'));
      const topic5 = ecoTopics.length ? this.getRandomItem(ecoTopics) : this.topicsMap.get('2.1');
      q = this.generateTask2(topic5?.topic_id, 5);
      if (!q && topic5) q = this.generateMatch(5);
      if (q) part1.push(q);

      // 6
      q = this.generateMatchEge6();
      if (q) part1.push(q);

      // 7
      q = this.generateCharacteristics(7, 'fixed_costs', '2.8');
      if (!q) q = this.generateTask2('2.8', 7);
      if (q) part1.push(q);

      // 8
      const socTopics = topicsInBlock.filter(t => t.topic_id.startsWith('3.'));
      const topic8 = socTopics.length ? this.getRandomItem(socTopics) : this.topicsMap.get('3.1');
      q = this.generateTask2(topic8?.topic_id, 8);
      if (!q && topic8) q = this.generateMatch(8);
      if (q) part1.push(q);

      // 9
      q = this.getStaticTask9();
      if (!q) q = this.generateTask2(this.getRandomItem(topicsInBlock).topic_id, 9);
      if (q) part1.push(q);

      // 10
      const polTopics = topicsInBlock.filter(t => t.topic_id.startsWith('4.'));
      const topic10 = polTopics.length ? this.getRandomItem(polTopics) : this.topicsMap.get('4.1');
      q = this.generateTask2(topic10?.topic_id, 10);
      if (!q && topic10) q = this.generateMatch(10);
      if (q) part1.push(q);

      // 11
      q = this.generateCharacteristics(11, 'majoritarian_system', '4.10');
      if (!q) q = this.generateTask2('4.10', 11);
      if (q) part1.push(q);

      // 12
      const lawTopics = topicsInBlock.filter(t => t.topic_id.startsWith('5.'));
      const topic12 = lawTopics.length ? this.getRandomItem(lawTopics) : this.topicsMap.get('5.1');
      q = this.generateTask2(topic12?.topic_id, 12);
      if (!q && topic12) q = this.generateMatch(12);
      if (q) part1.push(q);

      // 13
      q = this.generateMatchEge13();
      if (q) part1.push(q);

      // 14
      const topic14 = this.getRandomItem(topicsInBlock);
      q = this.generateTask2(topic14?.topic_id, 14);
      if (!q && topic14) q = this.generateMatch(14);
      if (q) part1.push(q);

      // 15
      q = this.generateMatchEge15();
      if (q) part1.push(q);

      // 16
      const constTopic16 = this.topicsMap.get('5.6');
      q = this.generateTask2(constTopic16?.topic_id, 16);
      if (!q && constTopic16) q = this.generateMatch(16);
      if (q) part1.push(q);

      // ========== ЧАСТЬ 2 ==========
      const part2 = [];

      // 17-20: текст (4 отдельных вопроса, каждый со своим текстом)
      if (part2Selections.text?.enabled && part2Selections.text?.value) {
        const textData = this.getTextById(part2Selections.text.value);
        if (textData && textData.questions) {
          for (let key = 17; key <= 20; key++) {
            const qData = textData.questions[key];
            if (qData && qData.text) {
              part2.push({
                type: 'text_analysis',
                ege_num: key,
                text: qData.text,
                content: textData.content,
                expected: qData.expected || null,
                id: `text_${textData.id || Date.now()}_${key}`
              });
            }
          }
        }
      }

      // 21: график
      if (part2Selections.graph?.enabled && part2Selections.graph?.value) {
        const selectedGraph = this.getStaticTask21ById(part2Selections.graph.value);
        if (selectedGraph) part2.push(selectedGraph);
      }

      // 22: задача
      if (part2Selections.task?.enabled && part2Selections.task?.value) {
        const task = this.getTaskById(part2Selections.task.value);
        if (task) part2.push(task);
      }

      // 23: правовая задача
      if (part2Selections.lawTask?.enabled && part2Selections.lawTask?.value) {
        const lawTask = this.getLawTaskById(part2Selections.lawTask.value);
        if (lawTask) {
          part2.push({
            type: 'law_task',
            ege_num: 23,
            title: lawTask.title,
            question: lawTask.question,
            expected_answer: lawTask.expected_answer,
            source: lawTask.source,
            id: lawTask.id || `lawtask_${Date.now()}`
          });
        }
      }

      // 24: план
      if (part2Selections.plan?.enabled && part2Selections.plan?.value) {
        const plan = this.getPlanTopicById(part2Selections.plan.value);
        if (plan) {
          part2.push({
            type: 'plan',
            ege_num: 24,
            title: plan.title,
            suggestedPlan: plan.suggestedPlan,
            topicId: plan.topicId,
            id: plan.id || `plan_${plan.topicId?.replace(/\./g, '_') || Date.now()}`
          });
        }
      }

      // 25: эссе
      if (part2Selections.essay?.enabled && part2Selections.essay?.value) {
        const essay = this.getEssayTopicById(part2Selections.essay.value);
        if (essay) {
          part2.push({
            type: 'essay',
            ege_num: 25,
            title: essay.title,
            prompt: essay.prompt,
            criteria: essay.criteria,
            topicId: essay.topicId,
            id: essay.id || `essay_${essay.topicId?.replace(/\./g, '_') || Date.now()}`
          });
        }
      }

      return {
        title: title || `Экзамен по блоку ${blockId}`,
        type: 'exam',
        classId: classId,
        blockId: blockId,
        questions: [...part1, ...part2],
        createdAt: new Date(),
        published: false,
        deadline: deadline || null
      };
    },

    // ========== ГЕНЕРАЦИЯ ДОМАШНЕГО ЗАДАНИЯ ==========
    generateHomework(topicId, title, classId, typesCount = {}, deadline = null) {
      this.initialize();
      const topic = this.topicsMap.get(topicId);
      if (!topic) return null;

      const questions = [];
      for (let i = 0; i < (typesCount.choice || 0); i++) {
        const q = this.generateTask2(topicId, 2);
        if (q) questions.push(q);
      }
      for (let i = 0; i < (typesCount.match || 0); i++) {
        const q = this.generateMatch(3);
        if (q) questions.push(q);
      }
      for (let i = 0; i < (typesCount.short || 0); i++) {
        const q = this.generateShort(topicId, 3);
        if (q) questions.push(q);
      }
      if (typesCount.essay && typesCount.essayTopicId) {
        const essay = this.getEssayTopicById(typesCount.essayTopicId);
        if (essay) questions.push(essay);
      } else if (typesCount.essay) {
        const essay = this.getRandomEssayTopic();
        if (essay) questions.push(essay);
      }

      return {
        title: title || `Домашнее задание: ${topic.name}`,
        type: 'homework',
        classId: classId,
        topicId: topicId,
        topicName: topic.name,
        questions: questions,
        createdAt: new Date(),
        published: false,
        deadline: deadline || null
      };
    },

    // ========== МЕТОДЫ ДЛЯ ЧАСТИ 2 ==========
    getTextsList(blockId = null) {
      let texts = [...this.texts];
      if (blockId && blockId !== 'all') {
        const blockNames = {
          1: 'Человек в обществе. Духовная культура',
          2: 'Экономика',
          3: 'Социальная сфера',
          4: 'Политическая сфера',
          5: 'Право'
        };
        const targetBlock = blockNames[blockId];
        if (targetBlock) texts = texts.filter(t => t.block === targetBlock);
      }
      return texts.map(t => ({ value: t.id, label: t.title }));
    },

    getTextById(id) {
      const text = this.texts.find(t => t.id === id);
      if (!text) return null;
      const result = { ...text };
      if (!result.id) result.id = `text_${Date.now()}`;
      return result;
    },

    getPlanTopicsList(blockId = null) {
      let topics = this.planTopics;
      if (blockId && blockId !== 'all') topics = topics.filter(t => t.topic_id.startsWith(`${blockId}.`));
      return topics.map(t => ({ value: t.topic_id, label: t.title }));
    },

    getPlanTopicById(id) {
      const topic = this.planTopics.find(t => t.topic_id === id);
      if (!topic) return null;
      return {
        type: 'plan',
        ege_num: 24,
        title: topic.title,
        suggestedPlan: topic.suggested_plan,
        topicId: topic.topic_id,
        id: `plan_${topic.topic_id.replace(/\./g, '_')}`
      };
    },

    getEssayTopicsList(blockId = null) {
      let topics = this.essayTopics;
      if (blockId && blockId !== 'all') topics = topics.filter(t => t.topic_id.startsWith(`${blockId}.`));
      return topics.map(t => ({ value: t.topic_id, label: t.title }));
    },

    getEssayTopicById(id) {
      const topic = this.essayTopics.find(t => t.topic_id === id);
      if (!topic) return null;
      return {
        type: 'essay',
        ege_num: 25,
        text: topic.prompt,
        prompt: topic.prompt,
        criteria: topic.criteria,
        title: topic.title,
        topicId: topic.topic_id,
        id: `essay_${topic.topic_id.replace(/\./g, '_')}`
      };
    },

    getRandomEssayTopic() {
      if (!this.essayTopics?.length) return null;
      const randomTopic = this.getRandomItem(this.essayTopics);
      return {
        type: 'essay',
        ege_num: 25,
        text: randomTopic.prompt,
        prompt: randomTopic.prompt,
        criteria: randomTopic.criteria,
        title: randomTopic.title,
        topicId: randomTopic.topic_id,
        id: `essay_${randomTopic.topic_id.replace(/\./g, '_')}`
      };
    },

    getTasksList(blockId = null) {
      let tasks = [...this.tasks];
      if (blockId && blockId !== 'all') {
        const blockNames = {
          1: 'Человек в обществе. Духовная культура',
          2: 'Экономика',
          3: 'Социальная сфера',
          4: 'Политическая сфера',
          5: 'Право'
        };
        const blockName = blockNames[blockId];
        if (blockName) tasks = tasks.filter(t => t.block === blockName);
      }
      return tasks.map(t => ({ value: t.id, label: t.title }));
    },

    getTaskById(id) {
      const task = this.tasks.find(t => t.id === id);
      if (!task) return null;
      const result = { ...task };
      if (!result.id) result.id = `task_${id || Date.now()}`;
      return {
        type: 'task',
        ege_num: 22,
        title: result.title,
        situation: result.situation,
        questions: result.questions,
        expected_answer: result.expected_answer,
        source: result.source,
        id: result.id
      };
    },

    getLawTasksList() {
      return this.lawTasks.map(t => ({ value: t.id, label: t.title }));
    },

    getLawTaskById(id) {
      const task = this.lawTasks.find(t => t.id === id);
      if (!task) return null;
      return {
        type: 'law_task',
        ege_num: 23,
        title: task.title,
        question: task.question,
        expected_answer: task.expected_answer,
        source: task.source,
        id: task.id || `lawtask_${Date.now()}`
      };
    },

    generateShort(topicId, egeNum = 3) {
      const topic = this.topicsMap.get(topicId);
      if (!topic?.definitions?.length) return null;

      const definition = this.getRandomItem(topic.definitions);
      if (!definition) return null;
      
      const termRegex = new RegExp(`\\b${this.escapeRegExp(definition.term)}\\b`, 'gi');
      const textWithBlank = definition.definition.replace(termRegex, '________');

      return {
        id: `short_${topicId.replace(/\./g, '_')}_${egeNum}`,
        type: 'short',
        ege_num: egeNum,
        text: textWithBlank,
        correctAnswer: definition.term,
        topicId,
        topicName: topic.name
      };
    },

    escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }
});