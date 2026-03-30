// src/stores/questionGenerator.js
import { defineStore } from 'pinia';
import topicsData from '@/data/topics.json';
import theoryData from '@/data/theory.json';
import normativeActsData from '@/data/normative_acts.json';
import planTopicsData from '@/data/plan_topics.json';
import essayTopicsData from '@/data/essay_topics.json';
import tasksData from '@/data/tasks.json';
import textsData from '@/data/texts.json';
import lawTasksData from '@/data/law_tasks.json';
import staticTasksData from '@/data/static_tasks.json';

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
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    },

    // ========== КЭШИРОВАНИЕ ТЕМ ПО БЛОКУ ==========
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

    // ==================== ЗАДАНИЕ 1: ВЫБОР ЛИШНЕГО ТЕРМИНА ====================
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
        id: `task1_${topicId}_${Date.now()}_${Math.random()}`,
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

    // ==================== ЗАДАНИЕ 2: ВЕРНЫЕ СУЖДЕНИЯ ====================
    generateTask2(topicId, egeNum = 2) {
      const theory = this.theoryMap.get(topicId);
      if (!theory?.trueStatements?.length || !theory?.falseStatements?.length) {
        // fallback – старая логика (генерируем из теории по умолчанию)
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
        id: `task2_${topicId}_${Date.now()}_${Math.random()}`,
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

    // fallback для старых тем, где нет true/false
    generateTask2Legacy(topicId, egeNum = 2) {
      const theory = this.theoryMap.get(topicId);
      if (!theory) return null;
      // простая заглушка – берём два утверждения из объяснения
      const text = theory.explanation || '';
      const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 20).slice(0, 4);
      if (sentences.length < 2) return null;
      const options = sentences.slice(0, 4);
      const correctIndices = [0, 2]; // условно
      return {
        id: `task2_${topicId}_${Date.now()}_${Math.random()}`,
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

    // ==================== ЗАДАНИЕ 3,6,13,15: СООТВЕТСТВИЕ (общее) ====================
    generateMatch(egeNum, topicId = null, specificPairs = null) {
      let pairs = specificPairs;
      let topicName = '';

      if (!pairs) {
        const topic = this.topicsMap.get(topicId);
        if (!topic?.matchPairs?.length) return null;
        pairs = topic.matchPairs;
        topicName = topic.name;
      }

      const selectedPairs = this.shuffleArray([...pairs]).slice(0, 4);
      const leftItems = selectedPairs.map(p => p.term);
      const rightItems = this.shuffleArray(selectedPairs.map(p => p.definition));

      return {
        id: `match_${egeNum}_${Date.now()}_${Math.random()}`,
        type: 'match',
        ege_num: egeNum,
        text: 'Установите соответствие между понятиями и их определениями: к каждой позиции, данной в первом столбце, подберите соответствующую позицию из второго столбца.',
        pairs: leftItems.map((left, idx) => ({ left, right: rightItems[idx] })),
        correctMapping: selectedPairs,
        topicId: topicId || 'mixed',
        topicName: topicName
      };
    },

    // ==================== ЗАДАНИЕ 3 (специальное: Человек и общество) ====================
    generateMatchEge3() {
      const block1Topics = this.getTopicsByBlock(1);
      const allPairs = [];
      for (const topic of block1Topics) {
        if (topic.matchPairs && topic.matchPairs.length) {
          allPairs.push(...topic.matchPairs);
        }
      }
      if (allPairs.length < 4) return this.generateMatch(3, '1.8');
      const selectedPairs = this.shuffleArray([...allPairs]).slice(0, 5);
      const leftItems = selectedPairs.map(p => p.term);
      const rightItems = this.shuffleArray(selectedPairs.map(p => p.definition));
      return {
        id: `ege3_${Date.now()}_${Math.random()}`,
        type: 'match',
        ege_num: 3,
        text: 'Установите соответствие между понятиями и их определениями: к каждой позиции, данной в первом столбце, подберите соответствующую позицию из второго столбца.',
        pairs: leftItems.map((left, idx) => ({ left, right: rightItems[idx] })),
        correctMapping: selectedPairs,
        topicId: '1',
        topicName: 'Человек и общество'
      };
    },

    // ==================== ЗАДАНИЕ 6 (специальное: Экономика) ====================
    generateMatchEge6() {
      const block2Topics = this.getTopicsByBlock(2);
      const allPairs = [];
      for (const topic of block2Topics) {
        if (topic.matchPairs && topic.matchPairs.length) {
          allPairs.push(...topic.matchPairs);
        }
      }
      if (allPairs.length < 4) return this.generateMatch(6, '2.5');
      const selectedPairs = this.shuffleArray([...allPairs]).slice(0, 5);
      const leftItems = selectedPairs.map(p => p.term);
      const rightItems = this.shuffleArray(selectedPairs.map(p => p.definition));
      return {
        id: `ege6_${Date.now()}_${Math.random()}`,
        type: 'match',
        ege_num: 6,
        text: 'Установите соответствие между понятиями и их определениями: к каждой позиции, данной в первом столбце, подберите соответствующую позицию из второго столбца.',
        pairs: leftItems.map((left, idx) => ({ left, right: rightItems[idx] })),
        correctMapping: selectedPairs,
        topicId: '2',
        topicName: 'Экономика'
      };
    },

    // ==================== ЗАДАНИЕ 13 (специальное: Конституция, органы власти) ====================
    generateMatchEge13() {
      const constTopic = this.topicsMap.get('5.6');
      const govTopic = this.topicsMap.get('4.6');
      const allPairs = [];
      if (constTopic?.matchPairs) allPairs.push(...constTopic.matchPairs);
      if (govTopic?.matchPairs) allPairs.push(...govTopic.matchPairs);
      const specificPairs = [
        { term: 'Назначение выборов Президента РФ', definition: 'Совет Федерации' },
        { term: 'Утверждение изменения границ между субъектами РФ', definition: 'Совет Федерации' },
        { term: 'Разрешение споров о компетенции между высшими органами власти', definition: 'Конституционный Суд РФ' },
        { term: 'Осуществление мер по поддержке институтов гражданского общества', definition: 'Правительство РФ' },
        { term: 'Обеспечение исполнения федерального бюджета', definition: 'Правительство РФ' }
      ];
      allPairs.push(...specificPairs);
      if (allPairs.length < 4) return this.generateMatch(13, '5.6');
      const selectedPairs = this.shuffleArray([...allPairs]).slice(0, 5);
      const leftItems = selectedPairs.map(p => p.term);
      const rightItems = this.shuffleArray(selectedPairs.map(p => p.definition));
      return {
        id: `ege13_${Date.now()}_${Math.random()}`,
        type: 'match',
        ege_num: 13,
        text: 'Установите соответствие между полномочиями и субъектами государственной власти РФ: к каждой позиции, данной в первом столбце, подберите соответствующую позицию из второго столбца.',
        pairs: leftItems.map((left, idx) => ({ left, right: rightItems[idx] })),
        correctMapping: selectedPairs,
        topicId: '5.6',
        topicName: 'Конституция РФ и органы власти'
      };
    },

    // ==================== ЗАДАНИЕ 15 (специальное: Право) ====================
    generateMatchEge15() {
      const block5Topics = this.getTopicsByBlock(5);
      const allPairs = [];
      for (const topic of block5Topics) {
        if (topic.matchPairs && topic.matchPairs.length) {
          allPairs.push(...topic.matchPairs);
        }
      }
      if (allPairs.length < 4) return this.generateMatch(15, '5.5');
      const selectedPairs = this.shuffleArray([...allPairs]).slice(0, 5);
      const leftItems = selectedPairs.map(p => p.term);
      const rightItems = this.shuffleArray(selectedPairs.map(p => p.definition));
      return {
        id: `ege15_${Date.now()}_${Math.random()}`,
        type: 'match',
        ege_num: 15,
        text: 'Установите соответствие между понятиями и их определениями: к каждой позиции, данной в первом столбце, подберите соответствующую позицию из второго столбца.',
        pairs: leftItems.map((left, idx) => ({ left, right: rightItems[idx] })),
        correctMapping: selectedPairs,
        topicId: '5',
        topicName: 'Право'
      };
    },

    // ==================== ЗАДАНИЕ 4,7,11: ВЫБОР ПРИЗНАКОВ ====================
    generateCharacteristics(egeNum, characteristicsKey, topicId) {
      const topic = this.topicsMap.get(topicId);
      if (!topic?.characteristics?.[characteristicsKey]) {
        return this.generateTask2(topicId, egeNum);
      }

      const correctChars = topic.characteristics[characteristicsKey];
      const options = [...correctChars];
      const otherKeys = Object.keys(topic.characteristics).filter(k => k !== characteristicsKey);
      for (const key of otherKeys) {
        const otherChars = topic.characteristics[key];
        if (otherChars && otherChars.length) {
          options.push(...otherChars.slice(0, 2));
        }
      }
      this.shuffleArray(options);

      const correctIndices = [];
      options.forEach((opt, idx) => {
        if (correctChars.includes(opt)) correctIndices.push(idx);
      });

      return {
        id: `char_${egeNum}_${Date.now()}_${Math.random()}`,
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

    // ==================== ЗАДАНИЕ 9: СТАТИЧЕСКАЯ ДИАГРАММА ====================
    getStaticTask9() {
      if (!this.staticTasks9.length) return null;
      const task = this.getRandomItem(this.staticTasks9);
      return {
        id: `static9_${task.id}`,
        type: 'choice',
        ege_num: 9,
        text: task.title,
        options: task.options,
        correct: task.correct,
        isMultiple: true,
        diagramData: task.data,
        explanation: task.explanation
      };
    },

    // ==================== ЗАДАНИЕ 21: СТАТИЧЕСКИЙ ГРАФИК ====================
    getStaticTask21() {
      if (!this.staticTasks21.length) return null;
      const task = this.getRandomItem(this.staticTasks21);
      return {
        type: 'graph_analysis',
        ege_num: 21,
        title: task.title,
        data: task.data,
        questions: task.questions,
        expected: task.expected
      };
    },

    // ==================== ГЕНЕРАЦИЯ ПОЛНОГО ЭКЗАМЕНА ====================
    generateFullExam(blockId, title, classId, deadline = null, part2Selections = {}) {
      this.initialize();
      const topicsInBlock = this.getTopicsByBlock(blockId);
      if (!topicsInBlock.length) return null;

      const part1 = [];

      // 1
      let q = this.generateTask1(this.getRandomItem(topicsInBlock).topic_id, 1);
      if (!q) q = this.generateTask2(this.getRandomItem(topicsInBlock).topic_id, 1);
      part1.push(q);

      // 2
      q = this.generateTask2(this.getRandomItem(topicsInBlock).topic_id, 2);
      if (!q) q = this.generateMatch(2, this.getRandomItem(topicsInBlock).topic_id);
      part1.push(q);

      // 3
      q = this.generateMatchEge3();
      if (!q) q = this.generateMatch(3, this.getRandomItem(topicsInBlock.filter(t => t.topic_id.startsWith('1.'))).topic_id);
      part1.push(q);

      // 4
      q = this.generateCharacteristics(4, 'traditional', '1.8');
      if (!q) q = this.generateTask2('1.8', 4);
      part1.push(q);

      // 5 (экономика)
      const ecoTopics = topicsInBlock.filter(t => t.topic_id.startsWith('2.'));
      const topic5 = ecoTopics.length ? this.getRandomItem(ecoTopics) : this.topicsMap.get('2.1');
      q = this.generateTask2(topic5.topic_id, 5);
      if (!q) q = this.generateMatch(5, topic5.topic_id);
      part1.push(q);

      // 6 (экономика match)
      q = this.generateMatchEge6();
      if (!q) q = this.generateMatch(6, this.getRandomItem(ecoTopics).topic_id);
      part1.push(q);

      // 7 (издержки)
      q = this.generateCharacteristics(7, 'fixed_costs', '2.8');
      if (!q) q = this.generateTask2('2.8', 7);
      part1.push(q);

      // 8 (социология)
      const socTopics = topicsInBlock.filter(t => t.topic_id.startsWith('3.'));
      const topic8 = socTopics.length ? this.getRandomItem(socTopics) : this.topicsMap.get('3.1');
      q = this.generateTask2(topic8.topic_id, 8);
      if (!q) q = this.generateMatch(8, topic8.topic_id);
      part1.push(q);

      // 9 (статическая диаграмма)
      q = this.getStaticTask9();
      if (!q) q = this.generateTask2(this.getRandomItem(topicsInBlock).topic_id, 9);
      part1.push(q);

      // 10 (политика)
      const polTopics = topicsInBlock.filter(t => t.topic_id.startsWith('4.'));
      const topic10 = polTopics.length ? this.getRandomItem(polTopics) : this.topicsMap.get('4.1');
      q = this.generateTask2(topic10.topic_id, 10);
      if (!q) q = this.generateMatch(10, topic10.topic_id);
      part1.push(q);

      // 11 (избирательная система)
      q = this.generateCharacteristics(11, 'majoritarian_system', '4.10');
      if (!q) q = this.generateTask2('4.10', 11);
      part1.push(q);

      // 12 (право)
      const lawTopics = topicsInBlock.filter(t => t.topic_id.startsWith('5.'));
      const topic12 = lawTopics.length ? this.getRandomItem(lawTopics) : this.topicsMap.get('5.1');
      q = this.generateTask2(topic12.topic_id, 12);
      if (!q) q = this.generateMatch(12, topic12.topic_id);
      part1.push(q);

      // 13 (Конституция match)
      q = this.generateMatchEge13();
      if (!q) q = this.generateMatch(13, '5.6');
      part1.push(q);

      // 14 (верные суждения)
      const topic14 = this.getRandomItem(topicsInBlock);
      q = this.generateTask2(topic14.topic_id, 14);
      if (!q) q = this.generateMatch(14, topic14.topic_id);
      part1.push(q);

      // 15 (право match)
      q = this.generateMatchEge15();
      if (!q) q = this.generateMatch(15, '5.5');
      part1.push(q);

      // 16 (Конституция суждения)
      const constTopic16 = this.topicsMap.get('5.6');
      q = this.generateTask2(constTopic16?.topic_id, 16);
      if (!q) q = this.generateMatch(16, constTopic16?.topic_id);
      part1.push(q);

      // Часть 2 (без изменений)
      const part2 = [];
      if (part2Selections.text?.enabled && part2Selections.text?.value) {
        const textData = this.getTextById(part2Selections.text.value);
        if (textData && textData.questions) {
          part2.push({ type: 'text_question', ege_num: 17, text: textData.content, question: textData.questions['17']?.text || 'Вопрос не указан', expected: textData.questions['17']?.expected });
          part2.push({ type: 'text_question', ege_num: 18, text: textData.content, question: textData.questions['18']?.text || 'Вопрос не указан', expected: textData.questions['18']?.expected });
          part2.push({ type: 'text_question', ege_num: 19, text: textData.content, question: textData.questions['19']?.text || 'Вопрос не указан', expected: textData.questions['19']?.expected });
          part2.push({ type: 'text_question', ege_num: 20, text: textData.content, question: textData.questions['20']?.text || 'Вопрос не указан', expected: textData.questions['20']?.expected });
        }
      }
      if (part2Selections.graph?.enabled && part2Selections.graph?.value) {
        const graph = this.getStaticTask21();
        if (graph) part2.push(graph);
      }
      if (part2Selections.task?.enabled && part2Selections.task?.value) {
        const task = this.getTaskById(part2Selections.task.value);
        if (task) part2.push(task);
      }
      if (part2Selections.lawTask?.enabled && part2Selections.lawTask?.value) {
        const lawTask = this.getLawTaskById(part2Selections.lawTask.value);
        if (lawTask) part2.push(lawTask);
      }
      if (part2Selections.plan?.enabled && part2Selections.plan?.value) {
        const plan = this.getPlanTopicById(part2Selections.plan.value);
        if (plan) part2.push(plan);
      }
      if (part2Selections.essay?.enabled && part2Selections.essay?.value) {
        const essay = this.getEssayTopicById(part2Selections.essay.value);
        if (essay) part2.push(essay);
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

    // ==================== ГЕНЕРАЦИЯ ДОМАШНЕГО ЗАДАНИЯ ====================
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
        const q = this.generateMatch(3, topicId);
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

    // ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ДЛЯ ЧАСТИ 2 ==========
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
      return this.texts.find(t => t.id === id) || null;
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
        topicId: topic.topic_id
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
        topicId: topic.topic_id
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
        topicId: randomTopic.topic_id
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
      return {
        type: 'task',
        ege_num: 22,
        title: task.title,
        situation: task.situation,
        questions: task.questions,
        expected_answer: task.expected_answer,
        source: task.source
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
        source: task.source
      };
    },

    generateShort(topicId, egeNum = 3) {
      const topic = this.topicsMap.get(topicId);
      if (!topic?.definitions?.length) return null;

      const definition = this.getRandomItem(topic.definitions);
      const termRegex = new RegExp(`\\b${definition.term}\\b`, 'gi');
      const textWithBlank = definition.definition.replace(termRegex, '________');

      return {
        id: `${topicId}_short_${Date.now()}_${Math.random()}`,
        type: 'short',
        ege_num: egeNum,
        text: textWithBlank,
        correctAnswer: definition.term,
        topicId,
        topicName: topic.name
      };
    }
  }
});