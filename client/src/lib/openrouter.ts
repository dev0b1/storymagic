import { apiRequest } from "./queryClient";

export interface GenerateStoryRequest {
  text: string;
  character: 'lumi' | 'spark' | 'bella';
  userId?: string;
}

export interface GenerateStoryResponse {
  story: string;
  character: string;
  savedStory?: any;
}

export const storyService = {
  async generateStory(request: GenerateStoryRequest): Promise<GenerateStoryResponse> {
    const response = await apiRequest('POST', '/api/story', request);
    return response.json();
  },

  async getUserStories() {
    const response = await apiRequest('GET', '/api/stories');
    return response.json();
  }
};
