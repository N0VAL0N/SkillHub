// src/modules/english/utils/normalizeAnswer.js

const CONTRACTIONS_TO_FULL = {
  "i'm": "i am", "you're": "you are", "he's": "he is", "she's": "she is",
  "it's": "it is", "we're": "we are", "they're": "they are", "i've": "i have",
  "you've": "you have", "we've": "we have", "they've": "they have",
  "i'll": "i will", "you'll": "you will", "he'll": "he will", "she'll": "she will",
  "it'll": "it will", "we'll": "we will", "they'll": "they will",
  "i'd": "i would", "you'd": "you would", "he'd": "he would", "she'd": "she would",
  "it'd": "it would", "we'd": "we would", "they'd": "they would",
  "don't": "do not", "doesn't": "does not", "didn't": "did not",
  "isn't": "is not", "aren't": "are not", "wasn't": "was not", "weren't": "were not",
  "haven't": "have not", "hasn't": "has not", "hadn't": "had not",
  "won't": "will not", "wouldn't": "would not", "can't": "cannot",
  "couldn't": "could not", "shouldn't": "should not", "mightn't": "might not",
  "mustn't": "must not", "needn't": "need not"
};

const FULL_TO_CONTRACTIONS = {
  "i am": "i'm", "you are": "you're", "he is": "he's", "she is": "she's",
  "it is": "it's", "we are": "we're", "they are": "they're", "i have": "i've",
  "you have": "you've", "we have": "we've", "they have": "they've",
  "i will": "i'll", "you will": "you'll", "he will": "he'll", "she will": "she'll",
  "it will": "it'll", "we will": "we'll", "they will": "they'll",
  "i would": "i'd", "you would": "you'd", "he would": "he'd", "she would": "she'd",
  "it would": "it'd", "we would": "we'd", "they would": "they'd",
  "do not": "don't", "does not": "doesn't", "did not": "didn't",
  "is not": "isn't", "are not": "aren't", "was not": "wasn't", "were not": "weren't",
  "have not": "haven't", "has not": "hasn't", "had not": "hadn't",
  "will not": "won't", "would not": "wouldn't", "cannot": "can't",
  "could not": "couldn't", "should not": "shouldn't", "might not": "mightn't",
  "must not": "mustn't", "need not": "needn't"
};

const SYNONYM_GROUPS = [
  // Приветствия и прощания
  { correct: "hello", variants: ["hi", "hey", "good morning", "good afternoon", "good evening"] },
  { correct: "goodbye", variants: ["bye", "bye-bye", "see you", "see you later", "see ya", "farewell"] },
  { correct: "thank you", variants: ["thanks", "cheers", "ta", "much obliged"] },
  { correct: "sorry", variants: ["i'm sorry", "pardon me", "excuse me"] },
  
  // Чувства и состояния
  { correct: "fine", variants: ["ok", "okay", "good", "alright", "all right"] },
  { correct: "great", variants: ["excellent", "wonderful", "fantastic", "amazing", "awesome"] },
  { correct: "sad", variants: ["unhappy", "sorrowful", "down", "depressed"] },
  { correct: "happy", variants: ["glad", "joyful", "cheerful", "delighted", "pleased"] },
  { correct: "tired", variants: ["exhausted", "worn out", "fatigued", "sleepy"] },
  { correct: "hungry", variants: ["starving", "famished"] },
  { correct: "thirsty", variants: ["parched"] },
  { correct: "hot", variants: ["warm", "boiling"] },
  { correct: "cold", variants: ["freezing", "chilly"] },
  { correct: "scared", variants: ["afraid", "frightened", "terrified", "fearful"] },
  { correct: "surprised", variants: ["astonished", "amazed", "shocked"] },
  { correct: "bored", variants: ["uninterested", "fed up"] },
  { correct: "confused", variants: ["puzzled", "bewildered", "mixed up"] },
  
  // Дни недели
  { correct: "monday", variants: ["mon"] },
  { correct: "tuesday", variants: ["tue", "tues"] },
  { correct: "wednesday", variants: ["wed"] },
  { correct: "thursday", variants: ["thu", "thurs"] },
  { correct: "friday", variants: ["fri"] },
  { correct: "saturday", variants: ["sat"] },
  { correct: "sunday", variants: ["sun"] },
  
  // Месяцы
  { correct: "january", variants: ["jan"] },
  { correct: "february", variants: ["feb"] },
  { correct: "march", variants: ["mar"] },
  { correct: "april", variants: ["apr"] },
  { correct: "june", variants: ["jun"] },
  { correct: "july", variants: ["jul"] },
  { correct: "august", variants: ["aug"] },
  { correct: "september", variants: ["sep", "sept"] },
  { correct: "october", variants: ["oct"] },
  { correct: "november", variants: ["nov"] },
  { correct: "december", variants: ["dec"] },
  
  // Предлоги времени
  { correct: "at", variants: ["@"] },
  
  // Предлоги места
  { correct: "in", variants: ["inside", "within"] },
  { correct: "on", variants: ["upon", "on top of"] },
  { correct: "under", variants: ["underneath", "beneath"] },
  { correct: "next to", variants: ["beside", "by", "near", "close to", "adjacent to"] },
  { correct: "behind", variants: ["in back of"] },
  { correct: "in front of", variants: ["before"] },
  { correct: "among", variants: ["amongst"] },
  
  // Члены семьи
  { correct: "mother", variants: ["mom", "mum", "mommy", "mummy", "mama", "ma"] },
  { correct: "father", variants: ["dad", "daddy", "papa", "pa"] },
  { correct: "brother", variants: ["bro"] },
  { correct: "sister", variants: ["sis"] },
  { correct: "grandmother", variants: ["grandma", "granny", "nana"] },
  { correct: "grandfather", variants: ["grandpa", "granddad", "gramps"] },
  
  // Цвета
  { correct: "grey", variants: ["gray"] },
  { correct: "navy", variants: ["navy blue"] },
  
  // Профессии
  { correct: "doctor", variants: ["physician"] },
  { correct: "teacher", variants: ["instructor", "educator"] },
  { correct: "student", variants: ["pupil"] },
  { correct: "police officer", variants: ["policeman", "policewoman", "cop"] },
  { correct: "firefighter", variants: ["fireman"] },
  { correct: "chef", variants: ["cook"] },
  { correct: "lawyer", variants: ["attorney"] },
  
  // Еда и напитки
  { correct: "coffee", variants: ["java", "brew"] },
  
  // Животные
  { correct: "cat", variants: ["kitty", "kitten"] },
  { correct: "dog", variants: ["puppy", "pooch"] },
  { correct: "rabbit", variants: ["bunny"] },
  { correct: "chicken", variants: ["hen", "rooster"] },
  
  // Дом и предметы
  { correct: "table", variants: ["desk"] },
  { correct: "chair", variants: ["seat"] },
  { correct: "house", variants: ["home", "residence"] },
  { correct: "apartment", variants: ["flat"] },
  { correct: "bathroom", variants: ["restroom", "washroom"] },
  { correct: "living room", variants: ["lounge"] },
  { correct: "garden", variants: ["yard"] },
  { correct: "stairs", variants: ["steps"] },
  { correct: "sofa", variants: ["couch", "settee"] },
  { correct: "lamp", variants: ["light"] },
  { correct: "phone", variants: ["telephone"] },
  { correct: "computer", variants: ["pc"] },
  { correct: "tv", variants: ["television", "telly"] },
  
  // Глаголы действия
  { correct: "open", variants: ["unlock"] },
  { correct: "close", variants: ["shut", "lock"] },
  { correct: "read", variants: ["peruse"] },
  { correct: "write", variants: ["note down", "jot down"] },
  { correct: "sleep", variants: ["slumber", "doze"] },
  { correct: "eat", variants: ["consume", "have"] },
  { correct: "drink", variants: ["sip", "have"] },
  { correct: "go", variants: ["leave", "depart"] },
  { correct: "come", variants: ["arrive", "enter"] },
  { correct: "run", variants: ["sprint", "jog"] },
  { correct: "walk", variants: ["stroll", "step"] },
  { correct: "jump", variants: ["leap", "hop"] },
  { correct: "cook", variants: ["prepare"] },
  { correct: "study", variants: ["learn"] },
  { correct: "watch", variants: ["view", "look at"] },
  { correct: "listen", variants: ["hear"] },
  { correct: "speak", variants: ["talk", "say"] },
  { correct: "ask", variants: ["inquire", "question"] },
  { correct: "answer", variants: ["reply", "respond"] },
  { correct: "help", variants: ["assist", "aid"] },
  { correct: "need", variants: ["require"] },
  { correct: "want", variants: ["desire", "wish"] },
  { correct: "like", variants: ["enjoy", "love", "adore"] },
  { correct: "hate", variants: ["dislike", "detest", "loathe"] },
  
  // Наречия частоты
  { correct: "always", variants: ["all the time", "constantly"] },
  { correct: "usually", variants: ["generally", "normally", "typically"] },
  { correct: "often", variants: ["frequently", "regularly"] },
  { correct: "sometimes", variants: ["occasionally", "from time to time"] },
  { correct: "rarely", variants: ["seldom", "hardly ever", "almost never"] },
  { correct: "never", variants: ["not ever", "at no time"] },
  
  // Слова времени
  { correct: "today", variants: ["this day"] },
  { correct: "tomorrow", variants: ["the next day"] },
  { correct: "yesterday", variants: ["the previous day"] },
  { correct: "morning", variants: ["a.m.", "am"] },
  { correct: "afternoon", variants: ["p.m.", "pm"] },
  { correct: "night", variants: ["midnight"] },
  { correct: "hour", variants: ["hr"] },
  { correct: "minute", variants: ["min"] },
  { correct: "second", variants: ["sec"] },
  
  // Модальные глаголы
  { correct: "can", variants: ["be able to", "know how to"] },
  { correct: "could", variants: ["would be able to"] },
  { correct: "must", variants: ["have to", "need to", "got to", "gotta"] },
  { correct: "should", variants: ["ought to", "had better"] },
  { correct: "will", variants: ["'ll"] },
  
  // Ключевые слова Present Perfect
  { correct: "ever", variants: ["at any time", "in your life"] },
  { correct: "already", variants: ["by now", "previously"] },
  { correct: "yet", variants: ["so far", "up to now"] },
  { correct: "just", variants: ["recently", "a moment ago"] },
  { correct: "for", variants: ["over", "during"] },
  { correct: "since", variants: ["from", "starting from"] },
  
  // Ключевые слова Past Simple
  { correct: "last", variants: ["previous"] },
  { correct: "ago", variants: ["earlier", "back"] },
  { correct: "when", variants: ["at the time that"] },
  
  // Обороты there is/are
  { correct: "there is", variants: ["there's", "there exists"] },
  { correct: "there are", variants: ["there exist"] },
  
  // Указательные местоимения
  { correct: "this", variants: ["this one", "this thing"] },
  { correct: "that", variants: ["that one", "that thing"] },
  { correct: "these", variants: ["these ones", "these things"] },
  { correct: "those", variants: ["those ones", "those things"] },
  
  // Артикли
  { correct: "a", variants: ["an"] },
  { correct: "", variants: ["null", "none", "zero"] },
  
  // Вопросительные слова
  { correct: "who", variants: ["whom"] },
  
  // Количественные слова
  { correct: "many", variants: ["a lot of", "lots of", "numerous", "countless"] },
  { correct: "much", variants: ["a great deal of", "plenty of"] },
  { correct: "some", variants: ["a few", "several", "a number of"] },
  { correct: "any", variants: ["a single"] },
  { correct: "few", variants: ["a small number of", "not many"] },
  { correct: "little", variants: ["a small amount of", "not much"] },
  { correct: "enough", variants: ["sufficient", "adequate"] },
  { correct: "too many", variants: ["excessive"] },
  { correct: "too much", variants: ["excessive"] },
  
  // Союзы
  { correct: "and", variants: ["&", "plus", "as well as"] },
  { correct: "but", variants: ["however", "yet", "nevertheless"] },
  { correct: "or", variants: ["either", "otherwise"] },
  { correct: "so", variants: ["therefore", "thus", "consequently"] },
  { correct: "because", variants: ["since", "as", "due to", "owing to"] },
  { correct: "if", variants: ["whether", "in case", "provided that", "as long as"] },
  { correct: "when", variants: ["while", "as", "at the time that"] },
  { correct: "before", variants: ["prior to", "earlier than"] },
  { correct: "after", variants: ["following", "subsequent to"] },
  { correct: "although", variants: ["though", "even though", "whereas", "while"] }
];

const NUMBER_MAP = {
  "1": "one", "one": "1", "2": "two", "two": "2", "3": "three", "three": "3",
  "4": "four", "four": "4", "5": "five", "five": "5", "6": "six", "six": "6",
  "7": "seven", "seven": "7", "8": "eight", "eight": "8", "9": "nine", "nine": "9",
  "10": "ten", "ten": "10", "11": "eleven", "eleven": "11", "12": "twelve", "twelve": "12",
  "13": "thirteen", "thirteen": "13", "14": "fourteen", "fourteen": "14", "15": "fifteen", "fifteen": "15",
  "16": "sixteen", "sixteen": "16", "17": "seventeen", "seventeen": "17", "18": "eighteen", "eighteen": "18",
  "19": "nineteen", "nineteen": "19", "20": "twenty", "twenty": "20"
};

const ORDINAL_MAP = {
  "1st": "first", "first": "1st", "2nd": "second", "second": "2nd", "3rd": "third", "third": "3rd",
  "4th": "fourth", "fourth": "4th", "5th": "fifth", "fifth": "5th", "6th": "sixth", "sixth": "6th",
  "7th": "seventh", "seventh": "7th", "8th": "eighth", "eighth": "8th", "9th": "ninth", "ninth": "9th",
  "10th": "tenth", "tenth": "10th", "11th": "eleventh", "eleventh": "11th", "12th": "twelfth", "twelfth": "12th",
  "13th": "thirteenth", "thirteenth": "13th", "14th": "fourteenth", "fourteenth": "14th", "15th": "fifteenth", "fifteenth": "15th",
  "20th": "twentieth", "twentieth": "20th", "21st": "twenty-first", "twenty-first": "21st", "22nd": "twenty-second", "twenty-second": "22nd",
  "23rd": "twenty-third", "twenty-third": "23rd", "24th": "twenty-fourth", "twenty-fourth": "24th", "30th": "thirtieth", "thirtieth": "30th",
  "31st": "thirty-first", "thirty-first": "31st"
};

const IRREGULAR_VERB_FORMS = {
  "go": "went", "went": "go", "see": "saw", "saw": "see", "break": "broke", "broke": "break",
  "eat": "ate", "ate": "eat", "drink": "drank", "drank": "drink", "take": "took", "took": "take",
  "buy": "bought", "bought": "buy", "come": "came", "came": "come", "do": "did", "did": "do",
  "write": "wrote", "wrote": "write", "read": "read", "speak": "spoke", "spoke": "speak",
  "understand": "understood", "understood": "understand", "forget": "forgot", "forgot": "forget",
  "meet": "met", "met": "meet", "lose": "lost", "lost": "lose", "find": "found", "found": "find",
  "give": "gave", "gave": "give", "get": "got", "got": "get", "know": "knew", "knew": "know",
  "think": "thought", "thought": "think", "leave": "left", "left": "leave", "feel": "felt", "felt": "feel",
  "keep": "kept", "kept": "keep", "sleep": "slept", "slept": "sleep", "drive": "drove", "drove": "drive",
  "fly": "flew", "flew": "fly", "wear": "wore", "wore": "wear"
};

const PHRASAL_VERBS = {
  "get up": "rise", "wake up": "awaken", "look for": "search", "turn on": "activate",
  "turn off": "deactivate", "give up": "quit", "look after": "care for", "run out of": "exhaust",
  "take off": "depart", "put up with": "tolerate", "come up with": "devise", "get away with": "evade punishment",
  "cut down on": "reduce", "drop out of": "withdraw from", "look forward to": "anticipate",
  "count on": "depend on", "take after": "resemble", "work out": "exercise", "call off": "cancel",
  "carry out": "execute"
};

const COMPARATIVE_PATTERNS = {
  "good": "better", "bad": "worse", "far": "farther"
};

const SUPERLATIVE_PATTERNS = {
  "good": "the best", "bad": "the worst", "far": "the farthest"
};

export function normalizeAnswer(str) {
  if (!str) return '';
  
  let normalized = String(str).toLowerCase().trim();
  normalized = normalized.replace(/\.$/, '');
  normalized = normalized.replace(/[^\w\s]/g, '');
  normalized = normalized.replace(/\s+/g, ' ');
  
  // Сокращения → полные формы
  if (CONTRACTIONS_TO_FULL[normalized]) {
    normalized = CONTRACTIONS_TO_FULL[normalized];
  }
  
  // Проверка синонимов
  for (const group of SYNONYM_GROUPS) {
    if (group.variants.includes(normalized)) {
      return group.correct;
    }
  }
  
  // Числа
  if (NUMBER_MAP[normalized]) {
    return NUMBER_MAP[normalized];
  }
  
  // Порядковые числа
  if (ORDINAL_MAP[normalized]) {
    return ORDINAL_MAP[normalized];
  }
  
  // Неправильные глаголы
  if (IRREGULAR_VERB_FORMS[normalized]) {
    return IRREGULAR_VERB_FORMS[normalized];
  }
  
  // Фразовые глаголы
  if (PHRASAL_VERBS[normalized]) {
    return PHRASAL_VERBS[normalized];
  }
  
  // Сравнительная степень
  if (COMPARATIVE_PATTERNS[normalized]) {
    return COMPARATIVE_PATTERNS[normalized];
  }
  
  // Превосходная степень
  if (SUPERLATIVE_PATTERNS[normalized]) {
    return SUPERLATIVE_PATTERNS[normalized];
  }
  
  return normalized;
}