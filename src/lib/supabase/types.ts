export interface FavoriteRow {
  user_id: string;
  content_id: string;
  title: string;
  addr1: string | null;
  firstimage: string | null;
  contenttypeid: string | null;
  added_at: string;
}

export interface LikeRow {
  user_id: string;
  content_id: string;
  created_at: string;
}

export interface MemoRow {
  id: string;
  user_id: string;
  content_id: string;
  body: string;
  is_public: boolean;
  updated_at: string;
}

export interface ProfileRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface LikeCountRow {
  content_id: string;
  count: number;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<Omit<ProfileRow, 'created_at'>> & { id: string };
        Update: Partial<ProfileRow>;
      };
      favorites: {
        Row: FavoriteRow;
        Insert: Omit<FavoriteRow, 'added_at'> & { added_at?: string };
        Update: Partial<FavoriteRow>;
      };
      likes: {
        Row: LikeRow;
        Insert: Omit<LikeRow, 'created_at'> & { created_at?: string };
        Update: Partial<LikeRow>;
      };
      memos: {
        Row: MemoRow;
        Insert: Omit<MemoRow, 'id' | 'updated_at'> & {
          id?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<MemoRow, 'id' | 'user_id' | 'content_id'>>;
      };
    };
    Views: {
      like_counts: {
        Row: LikeCountRow;
      };
    };
  };
}
