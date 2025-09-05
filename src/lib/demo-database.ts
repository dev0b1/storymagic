// Demo/fallback database for development and testing

interface DemoUser {
  id: string;
  email: string;
  name: string | null;
  is_premium: boolean | null;
  stories_generated: number | null;
  created_at: Date | null;
  updated_at?: Date | null;
  subscription_status?: string | null;
  subscription_id?: string | null;
  subscription_end_date?: Date | null;
  lemonsqueezy_customer_id?: string | null;
  lemonsqueezy_subscription_id?: string | null;
}

interface DemoStory {
  id: string;
  user_id: string;
  input_text: string;
  output_story: string;
  narration_mode: string;
  source: string;
  created_at: Date;
}

// In-memory demo data
let demoUsers: DemoUser[] = [];
let demoStories: DemoStory[] = [];

export const DemoDatabase = {
  async validateDatabase(): Promise<boolean> {
    console.log('Using demo database - always returns true');
    return true;
  },

  async getUser(userId: string): Promise<DemoUser | null> {
    let user = demoUsers.find(u => u.id === userId);
    if (!user) {
      // Create demo user on first access
      user = {
        id: userId,
        email: userId.includes('@') ? userId : `${userId}@demo.com`,
        name: userId.includes('@') ? userId.split('@')[0] : userId,
        is_premium: false,
        stories_generated: 0,
        created_at: new Date(),
        updated_at: new Date()
      };
      demoUsers.push(user);
    }
    return user;
  },

  async createUser(userData: any): Promise<DemoUser | null> {
    const user: DemoUser = {
      id: userData.id,
      email: userData.email,
      name: userData.name || userData.email.split('@')[0],
      is_premium: userData.is_premium || false,
      stories_generated: userData.stories_generated || 0,
      created_at: new Date(),
      updated_at: new Date()
    };
    demoUsers.push(user);
    return user;
  },

  async updateUser(userId: string, updates: Partial<DemoUser>): Promise<DemoUser | null> {
    const userIndex = demoUsers.findIndex(u => u.id === userId);
    if (userIndex >= 0) {
      demoUsers[userIndex] = { ...demoUsers[userIndex], ...updates };
      return demoUsers[userIndex];
    }
    return null;
  },

  async getUserStories(userId: string, limit: number = 50): Promise<DemoStory[]> {
    return demoStories
      .filter(s => s.user_id === userId)
      .slice(0, limit)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  },

  async createStory(storyData: any): Promise<DemoStory | null> {
    const story: DemoStory = {
      id: `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: storyData.user_id,
      input_text: storyData.input_text,
      output_story: storyData.output_story || 'Demo story generated successfully!',
      narration_mode: storyData.narration_mode,
      source: storyData.source,
      created_at: new Date()
    };
    demoStories.push(story);
    
    // Update user's story count
    const user = await this.getUser(storyData.user_id);
    if (user) {
      const currentCount = user.stories_generated || 0;
      await this.updateUser(user.id, { stories_generated: currentCount + 1 });
    }
    
    return story;
  }
};
