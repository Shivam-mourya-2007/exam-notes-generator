const HISTORY_STORAGE_KEY = 'notegem-note-history';
const MAX_HISTORY_ITEMS = 50;

export const getNoteHistory = () => {
  try {
    const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    return storedHistory ? JSON.parse(storedHistory) : [];
  } catch {
    return [];
  }
};

export const saveNoteHistory = ({ fileName, notes }) => {
  const newNote = {
    id: crypto.randomUUID(),
    fileName: fileName || 'document.pdf',
    notes,
    createdAt: new Date().toISOString()
  };
  const updatedHistory = [newNote, ...getNoteHistory()].slice(0, MAX_HISTORY_ITEMS);
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
};

export const deleteNoteHistory = (noteId) => {
  const updatedHistory = getNoteHistory().filter((note) => note.id !== noteId);
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
};
