// src/composables/useLocalStudentName.js
const STORAGE_KEY_PREFIX = 'teacher_student_names_';

export function useLocalStudentName() {
  const getTeacherKey = (teacherUid) => `${STORAGE_KEY_PREFIX}${teacherUid}`;

  const getStudentName = (teacherUid, studentUid) => {
    const key = getTeacherKey(teacherUid);
    const data = localStorage.getItem(key);
    if (!data) return null;
    try {
      const names = JSON.parse(data);
      return names[studentUid] || null;
    } catch (e) {
      return null;
    }
  };

  const setStudentName = (teacherUid, studentUid, name) => {
    const key = getTeacherKey(teacherUid);
    let names = {};
    const existing = localStorage.getItem(key);
    if (existing) {
      try {
        names = JSON.parse(existing);
      } catch (e) {}
    }
    if (name && name.trim()) {
      names[studentUid] = name.trim();
    } else {
      delete names[studentUid];
    }
    localStorage.setItem(key, JSON.stringify(names));
  };

  const removeStudentName = (teacherUid, studentUid) => {
    const key = getTeacherKey(teacherUid);
    const existing = localStorage.getItem(key);
    if (existing) {
      try {
        const names = JSON.parse(existing);
        delete names[studentUid];
        localStorage.setItem(key, JSON.stringify(names));
      } catch (e) {}
    }
  };

  const getAllNames = (teacherUid) => {
    const key = getTeacherKey(teacherUid);
    const data = localStorage.getItem(key);
    if (!data) return {};
    try {
      return JSON.parse(data);
    } catch (e) {
      return {};
    }
  };

  return {
    getStudentName,
    setStudentName,
    removeStudentName,
    getAllNames,
  };
}