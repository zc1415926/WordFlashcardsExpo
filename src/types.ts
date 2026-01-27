export interface WordCard {
  id: string;
  english: string;
  chinese: string;
  createdAt: number;
}

export type StudyMode = 'english-to-chinese' | 'chinese-to-english';